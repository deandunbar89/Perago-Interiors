import { prisma } from "@/lib/prisma";
import { syncProjectDates } from "@/lib/tasks-sync";

/**
 * Issued quotes: one file per tender (CRM) or PM project is marked as the quote issued to the client.
 * Marking a new one moves any earlier issued quote on the same tender / project to SUPERSEDED,
 * so it is always clear which revision the client has.
 */

export type IssuedQuote = {
  id: string;
  name: string;
  issuedAt: Date | null;
  issuedValue: number | null;
  href: string;
};

export async function issueCrmQuote(
  projectId: string,
  documentId: string,
  opts: { value?: number | null; at?: Date; userId?: string | null } = {}
) {
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc || doc.projectId !== projectId) return { error: "File not found on this tender" };
  await prisma.$transaction([
    prisma.document.updateMany({
      where: { projectId, quoteStatus: "ISSUED", NOT: { id: documentId } },
      data: { quoteStatus: "SUPERSEDED" },
    }),
    prisma.document.update({
      where: { id: documentId },
      data: { quoteStatus: "ISSUED", issuedAt: opts.at ?? new Date(), issuedValue: opts.value ?? null },
    }),
    prisma.activity.create({
      data: {
        projectId,
        userId: opts.userId ?? null,
        type: "DOCUMENT",
        message: `Quote issued to client — ${doc.originalName}`,
      },
    }),
  ]);

  // Issuing a quote means the tender has been submitted: move it on from Lead / Reviewing.
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { stage: true } });
  if (project && (project.stage === "LEAD" || project.stage === "REVIEWING")) {
    await prisma.project.update({ where: { id: projectId }, data: { stage: "TENDER_SUBMITTED" } });
    await prisma.activity.create({
      data: { projectId, userId: opts.userId ?? null, type: "STAGE_CHANGE", message: "Stage changed to Submitted (quote issued to client)" },
    });
    await syncProjectDates(projectId);
  }
  return { success: true };
}

export async function clearCrmQuote(projectId: string, documentId: string) {
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc || doc.projectId !== projectId) return { error: "File not found on this tender" };
  await prisma.document.update({
    where: { id: documentId },
    data: { quoteStatus: null, issuedAt: null, issuedValue: null },
  });
  return { success: true };
}

export async function issuePmQuote(
  pmProjectId: string,
  documentId: string,
  opts: { value?: number | null; at?: Date } = {}
) {
  const doc = await prisma.pmDocument.findUnique({ where: { id: documentId } });
  if (!doc || doc.pmProjectId !== pmProjectId) return { error: "File not found on this project" };
  await prisma.$transaction([
    prisma.pmDocument.updateMany({
      where: { pmProjectId, quoteStatus: "ISSUED", NOT: { id: documentId } },
      data: { quoteStatus: "SUPERSEDED" },
    }),
    prisma.pmDocument.update({
      where: { id: documentId },
      data: { quoteStatus: "ISSUED", issuedAt: opts.at ?? new Date(), issuedValue: opts.value ?? null },
    }),
  ]);
  return { success: true };
}

export async function clearPmQuote(pmProjectId: string, documentId: string) {
  const doc = await prisma.pmDocument.findUnique({ where: { id: documentId } });
  if (!doc || doc.pmProjectId !== pmProjectId) return { error: "File not found on this project" };
  await prisma.pmDocument.update({
    where: { id: documentId },
    data: { quoteStatus: null, issuedAt: null, issuedValue: null },
  });
  return { success: true };
}

/** Current issued quote for each tender id. */
export async function issuedQuotesForTenders(projectIds: string[]): Promise<Map<string, IssuedQuote>> {
  if (projectIds.length === 0) return new Map();
  const docs = await prisma.document.findMany({
    where: { projectId: { in: projectIds }, quoteStatus: "ISSUED" },
    select: { id: true, projectId: true, originalName: true, issuedAt: true, issuedValue: true },
  });
  return new Map(
    docs.map((d) => [
      d.projectId,
      { id: d.id, name: d.originalName, issuedAt: d.issuedAt, issuedValue: d.issuedValue, href: `/api/files/${d.id}` },
    ])
  );
}

/** Current issued quote for each PM project id. */
export async function issuedQuotesForPmProjects(pmProjectIds: string[]): Promise<Map<string, IssuedQuote>> {
  if (pmProjectIds.length === 0) return new Map();
  const docs = await prisma.pmDocument.findMany({
    where: { pmProjectId: { in: pmProjectIds }, quoteStatus: "ISSUED" },
    select: { id: true, pmProjectId: true, originalName: true, issuedAt: true, issuedValue: true },
  });
  return new Map(
    docs.map((d) => [
      d.pmProjectId,
      { id: d.id, name: d.originalName, issuedAt: d.issuedAt, issuedValue: d.issuedValue, href: `/api/pm-files/${d.id}` },
    ])
  );
}

/** Working on a quote (a file added to the tender's Commercial sections) moves a Lead to Reviewing. */
export async function markTenderReviewing(projectId: string, userId?: string | null) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { stage: true } });
  if (project?.stage !== "LEAD") return false;
  await prisma.project.update({ where: { id: projectId }, data: { stage: "REVIEWING" } });
  await prisma.activity.create({
    data: { projectId, userId: userId ?? null, type: "STAGE_CHANGE", message: "Stage changed to Reviewing (quote in progress)" },
  });
  await syncProjectDates(projectId);
  return true;
}
