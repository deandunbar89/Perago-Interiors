import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { badRequest, isResponse, requireAgent } from "@/lib/agent-auth";
import { saveUploadedFile } from "@/lib/storage";
import { mirrorToDrive } from "@/lib/google-drive";
import { EMIRATES, RECRUITMENT_DRIVE_FOLDERS, type RecruitmentDocType } from "@/lib/constants";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const UPLOAD_FOLDER = "recruitment"; // same folder the Recruitment pages use

/** Vacancies (with ids) and existing candidates, so a coworker can pick the right vacancy
 * and avoid adding someone twice. GET /api/agent/recruitment */
export async function GET(req: Request) {
  const actor = await requireAgent(req);
  if (isResponse(actor)) return actor;

  const vacancies = await prisma.vacancy.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      title: true,
      department: true,
      status: true,
      candidates: { select: { id: true, name: true, email: true, phone: true, stage: true } },
    },
  });
  return NextResponse.json({ vacancies });
}

function field(form: FormData, key: string) {
  const v = form.get(key);
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function file(form: FormData, key: string) {
  const v = form.get(key);
  return v instanceof File && v.size > 0 ? v : null;
}

/**
 * Adds a candidate to a vacancy, with their CV (and cover letter) stored and mirrored to Drive
 * exactly like the "Add candidate" form. multipart/form-data:
 *   vacancyId (or vacancy = exact vacancy title), name, email?, phone?, currentRole?, currentCompany?,
 *   location?, emirate?, nationality?, yearsExperience?, source?, noticePeriod?, expectedSalary?, notes?,
 *   cv? (file), coverLetter? (file)
 * Refuses a duplicate (same email or phone already on that vacancy) with 409.
 */
export async function POST(req: Request) {
  const actor = await requireAgent(req);
  if (isResponse(actor)) return actor;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return badRequest("Send multipart/form-data");
  }

  const name = field(form, "name");
  if (!name) return badRequest("name is required");

  const vacancyId = field(form, "vacancyId");
  const vacancyTitle = field(form, "vacancy");
  const vacancy = vacancyId
    ? await prisma.vacancy.findUnique({ where: { id: vacancyId }, select: { id: true, title: true } })
    : vacancyTitle
      ? await prisma.vacancy.findFirst({ where: { title: { equals: vacancyTitle, mode: "insensitive" } }, select: { id: true, title: true } })
      : null;
  if (!vacancy) return badRequest("vacancyId (or an exact vacancy title) is required — see GET /api/agent/recruitment");

  const email = field(form, "email");
  const phone = field(form, "phone");
  if (email || phone) {
    const dup = await prisma.candidate.findFirst({
      where: {
        vacancyId: vacancy.id,
        OR: [
          ...(email ? [{ email: { equals: email, mode: "insensitive" as const } }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
      select: { id: true, name: true },
    });
    if (dup) return NextResponse.json({ error: `${dup.name} is already on ${vacancy.title}`, id: dup.id }, { status: 409 });
  }

  const emirateRaw = field(form, "emirate")?.toUpperCase().replace(/[\s-]+/g, "_") ?? null;
  const emirate = emirateRaw && (EMIRATES as readonly string[]).includes(emirateRaw) ? emirateRaw : null;
  const yearsRaw = parseInt(field(form, "yearsExperience") ?? "", 10);

  const cv = file(form, "cv");
  const cover = file(form, "coverLetter");
  for (const f of [cv, cover]) if (f && f.size > MAX_FILE_SIZE) return badRequest(`${f.name} exceeds the 100MB limit`);

  const candidate = await prisma.candidate.create({
    data: {
      vacancyId: vacancy.id,
      name,
      email,
      phone,
      currentRole: field(form, "currentRole"),
      currentCompany: field(form, "currentCompany"),
      location: field(form, "location"),
      emirate: emirate as never,
      nationality: field(form, "nationality"),
      yearsExperience: Number.isFinite(yearsRaw) && yearsRaw >= 0 && yearsRaw <= 80 ? yearsRaw : null,
      source: field(form, "source"),
      noticePeriod: field(form, "noticePeriod"),
      expectedSalary: field(form, "expectedSalary"),
      notes: field(form, "notes"),
    },
  });

  const store = async (type: RecruitmentDocType, f: File) => {
    const mimeType = f.type || "application/octet-stream";
    const { storedName, size } = await saveUploadedFile(f, UPLOAD_FOLDER);
    await prisma.recruitmentDocument.create({
      data: { candidateId: candidate.id, type, originalName: f.name, storedName, mimeType, size, uploadedById: actor.userId },
    });
    await mirrorToDrive(
      ["Recruitment", vacancy.title, candidate.name, RECRUITMENT_DRIVE_FOLDERS[type]],
      f.name,
      mimeType,
      Buffer.from(await f.arrayBuffer())
    );
  };
  if (cv) await store("CV", cv);
  if (cover) await store("COVER_LETTER", cover);

  revalidatePath("/recruitment", "layout");
  return NextResponse.json({ id: candidate.id, vacancy: vacancy.title, link: `/recruitment/candidates/${candidate.id}` }, { status: 201 });
}
