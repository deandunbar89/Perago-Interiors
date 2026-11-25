import { prisma } from "@/lib/prisma";

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
