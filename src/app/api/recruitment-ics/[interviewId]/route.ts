import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAccess } from "@/lib/section-access";
import { appOrigin, buildCalendar } from "@/lib/recruitment-calendar";

/** One interview as a downloadable .ics file — the "Add to calendar" button on an interview. */
export async function GET(req: Request, { params }: { params: Promise<{ interviewId: string }> }) {
  const access = await getAccess();
  if (!access.sections.includes("RECRUITMENT")) return new NextResponse("Unauthorized", { status: 401 });

  const { interviewId } = await params;
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    select: {
      id: true,
      round: true,
      scheduledAt: true,
      interviewer: true,
      updatedAt: true,
      candidate: { select: { id: true, name: true, vacancy: { select: { title: true } } } },
    },
  });
  if (!interview) return new NextResponse("Not found", { status: 404 });

  const safeName = interview.candidate.name.replace(/[^\w-]+/g, "_");
  return new NextResponse(buildCalendar([interview], appOrigin(req.headers, req.url), `Interview - ${interview.candidate.name}`), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="interview-${safeName}.ics"`,
      "Cache-Control": "private, no-store",
    },
  });
}
