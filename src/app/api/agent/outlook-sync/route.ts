import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isResponse, requireAgent } from "@/lib/agent-auth";
import { outlookCalendarConfigured, syncInterviewToOutlook } from "@/lib/outlook-calendar";

export const dynamic = "force-dynamic";

/** Puts every upcoming interview into the Outlook calendar (creates missing events, refreshes the rest).
 * POST /api/agent/outlook-sync */
export async function POST(req: Request) {
  const actor = await requireAgent(req);
  if (isResponse(actor)) return actor;
  if (!outlookCalendarConfigured()) {
    const missing = ["MS_TENANT_ID", "MS_CLIENT_ID", "MS_CLIENT_SECRET", "MAIL_FROM"].filter((k) => !process.env[k]);
    return NextResponse.json({ error: "Outlook is not connected", missing }, { status: 400 });
  }

  const interviews = await prisma.interview.findMany({
    where: { scheduledAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    select: { id: true },
  });
  for (const iv of interviews) await syncInterviewToOutlook(iv.id);

  const after = await prisma.interview.findMany({
    where: { id: { in: interviews.map((i) => i.id) } },
    select: { scheduledAt: true, outlookEventId: true, candidate: { select: { name: true } } },
    orderBy: { scheduledAt: "asc" },
  });
  return NextResponse.json({
    interviews: after.map((i) => ({ candidate: i.candidate.name, at: i.scheduledAt, inOutlook: Boolean(i.outlookEventId) })),
  });
}
