import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { badRequest, isResponse, requireAgent } from "@/lib/agent-auth";
import { resolveTarget } from "@/lib/agent-targets";
import { saveUploadedFile, deleteUploadedFile } from "@/lib/storage";
import { mirrorToDrive } from "@/lib/google-drive";
import { issueCrmQuote, issuePmQuote, markTenderReviewing } from "@/lib/quotes";
import {
  DOC_CATEGORIES,
  DOC_CATEGORY_LABELS,
  PM_DOC_CATEGORIES,
  PM_DOC_CATEGORY_LABELS,
  type DocCategory,
  type PmDocCategory,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB, same as uploads in the app
const PM_CATEGORIES: readonly PmDocCategory[] = PM_DOC_CATEGORIES;
const CRM_CATEGORIES: readonly DocCategory[] = DOC_CATEGORIES;

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Lists where a coworker can file documents on a project.
 * GET /api/agent/documents?target=pm:<id>  → PM sections grouped by category (Design, Commercial, Operations…)
 * GET /api/agent/documents?target=crm:<id> → the tender's Commercial sections + Documents tab categories
 */
export async function GET(req: Request) {
  const actor = await requireAgent(req);
  if (isResponse(actor)) return actor;

  const target = await resolveTarget(new URL(req.url).searchParams.get("target"), true);
  if (typeof target === "string") return badRequest(target);

  if (target.pmProjectId) {
    const subsections = await prisma.pmDocSubsection.findMany({
      where: { pmProjectId: target.pmProjectId },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
      select: { category: true, alsoInCategory: true, name: true, mode: true, _count: { select: { documents: true } } },
    });
    const issuedPm = await prisma.pmDocument.findFirst({
      where: { pmProjectId: target.pmProjectId, quoteStatus: "ISSUED" },
      select: { id: true, originalName: true, issuedAt: true, issuedValue: true },
    });
    return NextResponse.json({
      issuedQuote: issuedPm,
      categories: PM_CATEGORIES,
      sections: subsections.map((s) => ({
        category: s.category,
        alsoInCategory: s.alsoInCategory,
        section: s.name,
        mode: s.mode,
        files: s._count.documents,
      })),
    });
  }

  const sections = await prisma.crmCommercialSection.findMany({
    where: { projectId: target.projectId! },
    orderBy: { sortOrder: "asc" },
    select: { name: true, mode: true, _count: { select: { documents: true } } },
  });
  const commercialFiles = await prisma.document.findMany({
    where: { projectId: target.projectId!, NOT: { commercialSectionId: null } },
    orderBy: { createdAt: "desc" },
    select: { id: true, originalName: true, quoteStatus: true, issuedAt: true, issuedValue: true, commercialSection: { select: { name: true } } },
  });
  return NextResponse.json({
    issuedQuote: commercialFiles.find((f) => f.quoteStatus === "ISSUED") ?? null,
    commercialFiles: commercialFiles.map((f) => ({
      id: f.id,
      section: f.commercialSection?.name ?? null,
      name: f.originalName,
      quoteStatus: f.quoteStatus,
      issuedAt: f.issuedAt,
      issuedValue: f.issuedValue,
    })),
    commercialSections: sections.map((s) => ({ section: s.name, mode: s.mode, files: s._count.documents })),
    documentCategories: CRM_CATEGORIES,
  });
}

/**
 * Uploads one file into a project, exactly like an upload in the app (stored + mirrored to Google Drive).
 * multipart/form-data fields:
 *   file      the file
 *   target    "pm:<id>" or "crm:<id>"
 *   category  PM: DESIGN | COMMERCIAL | OPERATIONS | PROCUREMENT | SITE_WORKS
 *             CRM: COMMERCIAL (with section) or a Documents tab category (DRAWING, TENDER_DOC, CONTRACT, CORRESPONDENCE, OTHER)
 *   section   section name (required for PM and for CRM Commercial), e.g. "Quotation"
 *   replace   "true" to replace the file in a single-file section; without it such a section is never overwritten
 *   issued    "true" to mark this file as the quote issued to the client (earlier issued quote → superseded)
 *   issuedValue  optional quote value in AED excl. VAT;  issuedDate  optional YYYY-MM-DD (default today)
 */
export async function POST(req: Request) {
  const actor = await requireAgent(req);
  if (isResponse(actor)) return actor;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return badRequest("Send multipart/form-data with file, target, category and section");
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return badRequest("file is required");
  if (file.size > MAX_FILE_SIZE) return badRequest(`${file.name} exceeds the 100MB limit`);

  const target = await resolveTarget(form.get("target"), true);
  if (typeof target === "string") return badRequest(target);

  const category = String(form.get("category") ?? "").trim().toUpperCase().replace(/[\s-]+/g, "_");
  const sectionName = String(form.get("section") ?? "").trim();
  const replace = String(form.get("replace") ?? "").toLowerCase() === "true";
  const issued = String(form.get("issued") ?? "").toLowerCase() === "true";
  const issuedValueRaw = Number(String(form.get("issuedValue") ?? "").replace(/[^0-9.]/g, ""));
  const issuedValue = Number.isFinite(issuedValueRaw) && issuedValueRaw > 0 ? issuedValueRaw : null;
  const issuedDateRaw = String(form.get("issuedDate") ?? "").trim();
  const issuedAt = issuedDateRaw && !Number.isNaN(new Date(issuedDateRaw).getTime()) ? new Date(issuedDateRaw) : undefined;
  const mimeType = file.type || "application/octet-stream";

  // ── PM project: Design / Commercial / Operations … → named section ──
  if (target.pmProjectId) {
    const pmProjectId = target.pmProjectId;
    if (!PM_CATEGORIES.includes(category as PmDocCategory)) {
      return badRequest(`category must be one of ${PM_CATEGORIES.join(", ")}`);
    }
    const subsections = await prisma.pmDocSubsection.findMany({
      where: { pmProjectId, OR: [{ category: category as PmDocCategory }, { alsoInCategory: category as PmDocCategory }] },
      orderBy: { sortOrder: "asc" },
    });
    const subsection = subsections.find((s) => same(s.name, sectionName));
    if (!subsection) {
      return badRequest(
        `No section "${sectionName}" under ${PM_DOC_CATEGORY_LABELS[category as PmDocCategory]}. Sections: ${subsections.map((s) => s.name).join(", ") || "none"}`
      );
    }

    const existing = await prisma.pmDocument.findMany({ where: { subsectionId: subsection.id } });
    if (subsection.mode === "SINGLE" && existing.length > 0) {
      if (!replace) {
        return NextResponse.json(
          { error: `"${subsection.name}" keeps one file and already has ${existing[0].originalName}. Send replace=true to replace it.` },
          { status: 409 }
        );
      }
      for (const doc of existing) await deleteUploadedFile(`pm-${pmProjectId}`, doc.storedName);
      await prisma.pmDocument.deleteMany({ where: { subsectionId: subsection.id } });
    }

    const pmProject = await prisma.pmProject.findUnique({ where: { id: pmProjectId }, select: { title: true } });
    const { storedName, size } = await saveUploadedFile(file, `pm-${pmProjectId}`);
    const doc = await prisma.pmDocument.create({
      data: {
        pmProjectId,
        category: subsection.category,
        subsectionId: subsection.id,
        originalName: file.name,
        storedName,
        mimeType,
        size,
        uploadedById: actor.userId,
      },
    });
    if (pmProject) {
      await mirrorToDrive(
        ["PM Projects", pmProject.title, PM_DOC_CATEGORY_LABELS[subsection.category as PmDocCategory], subsection.name],
        file.name,
        mimeType,
        Buffer.from(await file.arrayBuffer())
      );
    }

    if (issued) await issuePmQuote(pmProjectId, doc.id, { value: issuedValue, at: issuedAt });
    revalidatePath(`/pm/projects/${pmProjectId}`);
    return NextResponse.json(
      { id: doc.id, filedIn: `${PM_DOC_CATEGORY_LABELS[subsection.category as PmDocCategory]} › ${subsection.name}`, name: file.name, issued },
      { status: 201 }
    );
  }

  // ── CRM tender: Commercial section, or the Documents tab ──
  const projectId = target.projectId!;
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { title: true } });

  if (sectionName) {
    const sections = await prisma.crmCommercialSection.findMany({ where: { projectId }, orderBy: { sortOrder: "asc" } });
    const section = sections.find((s) => same(s.name, sectionName));
    if (!section) {
      return badRequest(`No Commercial section "${sectionName}". Sections: ${sections.map((s) => s.name).join(", ") || "none"}`);
    }

    const existing = await prisma.document.findMany({ where: { commercialSectionId: section.id } });
    if (section.mode === "SINGLE" && existing.length > 0) {
      if (!replace) {
        return NextResponse.json(
          { error: `"${section.name}" keeps one file and already has ${existing[0].originalName}. Send replace=true to replace it.` },
          { status: 409 }
        );
      }
      for (const doc of existing) await deleteUploadedFile(projectId, doc.storedName);
      await prisma.document.deleteMany({ where: { commercialSectionId: section.id } });
    }

    const { storedName, size } = await saveUploadedFile(file, projectId);
    const doc = await prisma.document.create({
      data: { projectId, commercialSectionId: section.id, originalName: file.name, storedName, mimeType, size, uploadedById: actor.userId },
    });
    if (project) {
      await mirrorToDrive(["CRM Projects", project.title, "Commercial", section.name], file.name, mimeType, Buffer.from(await file.arrayBuffer()));
    }
    await prisma.activity.create({
      data: { projectId, userId: actor.userId, type: "DOCUMENT", message: `Uploaded ${file.name} to Commercial — ${section.name}` },
    });

    if (issued) await issueCrmQuote(projectId, doc.id, { value: issuedValue, at: issuedAt, userId: actor.userId });
    else await markTenderReviewing(projectId, actor.userId);
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/dashboard");
    revalidatePath("/projects");
    return NextResponse.json({ id: doc.id, filedIn: `Commercial › ${section.name}`, name: file.name, issued }, { status: 201 });
  }

  const docCategory = (category || "OTHER") as DocCategory;
  if (!CRM_CATEGORIES.includes(docCategory)) {
    return badRequest(`For a tender, give section (a Commercial section) or category: ${CRM_CATEGORIES.join(", ")}`);
  }

  const { storedName, size } = await saveUploadedFile(file, projectId);
  const doc = await prisma.document.create({
    data: { projectId, category: docCategory, originalName: file.name, storedName, mimeType, size, uploadedById: actor.userId },
  });
  if (project) {
    await mirrorToDrive(["CRM Projects", project.title, DOC_CATEGORY_LABELS[docCategory]], file.name, mimeType, Buffer.from(await file.arrayBuffer()));
  }
  await prisma.activity.create({
    data: { projectId, userId: actor.userId, type: "DOCUMENT", message: `Uploaded ${file.name}` },
  });

  revalidatePath(`/projects/${projectId}`);
  return NextResponse.json({ id: doc.id, filedIn: `Documents › ${DOC_CATEGORY_LABELS[docCategory]}`, name: file.name }, { status: 201 });
}
