import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { appOrigin, buildCalendar, userIdFromCalendarToken } from "@/lib/recruitment-calendar";

// Public by design (calendar apps can't sign in) but guarded by the signed, per-person link,
// and only served while that person still has Recruitment access. See recruitment-calendar.ts.
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const userId = userIdFromCalendarToken(token);
  if (!userId) return new NextResponse("Not found", { status: 404 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, allowedSections: true },
  });
  if (!user || (user.role !== "ADMIN" && !user.allowedSections.includes("RECRUITMENT"))) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Two months back to everything upcoming, so recent history stays visible.
  const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const interviews = await prisma.interview.findMany({
    where: { scheduledAt: { gte: since } },
    orderBy: { scheduledAt: "asc" },
    select: {
      id: true,
      round: true,
      scheduledAt: true,
      interviewer: true,
      updatedAt: true,
      candidate: { select: { id: true, name: true, vacancy: { select: { title: true } } } },
    },
  });

  return new NextResponse(buildCalendar(interviews, appOrigin(req.headers, req.url)), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="perago-interviews.ics"',
      "Cache-Control": "private, no-store",
    },
  });
}
