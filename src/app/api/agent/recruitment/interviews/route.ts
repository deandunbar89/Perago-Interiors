import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, isResponse, requireAgent } from "@/lib/agent-auth";

export const dynamic = "force-dynamic";

/**
 * Booked interviews between two Dubai dates (inclusive), with each candidate's documents.
 * GET /api/agent/recruitment/interviews?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Download a document with GET /api/agent/recruitment/files/<documentId>.
 */
export async function GET(req: Request) {
  const actor = await requireAgent(req);
  if (isResponse(actor)) return actor;
  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to") ?? from;
  if (!from || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !to || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return badRequest("Give from=YYYY-MM-DD (and optional to=YYYY-MM-DD)");
  }
  // Dubai is UTC+4 all year.
  const start = new Date(`${from}T00:00:00+04:00`);
  const end = new Date(new Date(`${to}T00:00:00+04:00`).getTime() + 24 * 3600 * 1000);
  const interviews = await prisma.interview.findMany({
    where: {
      scheduledAt: { gte: start, lt: end },
      candidate: { stage: { notIn: ["REJECTED", "ARCHIVED"] } },
    },
    orderBy: { scheduledAt: "asc" },
    select: {
      id: true,
      round: true,
      scheduledAt: true,
      interviewer: true,
      candidate: {
        select: {
          id: true,
          name: true,
          phone: true,
          stage: true,
          vacancy: { select: { title: true } },
          documents: {
            orderBy: { createdAt: "desc" },
            select: { id: true, type: true, originalName: true, mimeType: true, size: true, createdAt: true },
          },
        },
      },
    },
  });
  return NextResponse.json({ count: interviews.length, interviews });
}
