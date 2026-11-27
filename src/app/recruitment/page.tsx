import { addDays } from "date-fns";
import StatCard from "@/app/(app)/dashboard/stat-card";
import { prisma } from "@/lib/prisma";
import VacanciesExplorer from "./vacancies-explorer";
import BookedInterviews from "./booked-interviews";
import { whatsappNumber } from "@/lib/whatsapp";
import { formatDubaiDate, formatDubaiTime, toDubaiInputValue } from "@/lib/dubai-time";

export const dynamic = "force-dynamic";

export default async function RecruitmentPage() {
  const now = new Date();

  const [vacancies, interviewsSoon, offersOut, archivedCount, bookedInterviews] = await Promise.all([
    prisma.vacancy.findMany({
      orderBy: [{ openedAt: "desc" }],
      include: { candidates: { select: { stage: true } } },
    }),
    prisma.interview.count({
      where: { scheduledAt: { gte: now, lte: addDays(now, 7) }, candidate: { stage: { notIn: ["REJECTED", "ARCHIVED"] } } },
    }),
    prisma.offer.count({ where: { status: "SENT" } }),
    prisma.candidate.count({ where: { stage: "ARCHIVED" } }),
    prisma.interview.findMany({
      where: { scheduledAt: { gte: new Date(now.getTime() - 2 * 60 * 60 * 1000) }, candidate: { stage: { notIn: ["REJECTED", "ARCHIVED", "HIRED"] } } },
      orderBy: { scheduledAt: "asc" },
      include: { candidate: { select: { id: true, name: true, phone: true, vacancyId: true, vacancy: { select: { title: true } } } } },
    }),
  ]);
  // Upcoming interviews (plus any that started in the last 2 hours), for active candidates only.
  const upcoming = bookedInterviews;

  const openVacancies = vacancies.filter((v) => v.status === "OPEN");
  const inPipeline = openVacancies.reduce(
    (sum, v) => sum + v.candidates.filter((c) => c.stage !== "HIRED" && c.stage !== "REJECTED" && c.stage !== "ARCHIVED").length,
    0
  );

  const rows = vacancies.map(({ candidates, ...vacancy }) => ({
    ...vacancy,
    total: candidates.length,
    active: candidates.filter((c) => c.stage !== "HIRED" && c.stage !== "REJECTED" && c.stage !== "ARCHIVED").length,
    hired: candidates.filter((c) => c.stage === "HIRED").length,
  }));

  return (
    <div className="p-8">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Recruitment</h1>
      <p className="mb-6 text-sm text-slate-500">Open roles, candidates, interviews and offers</p>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Open vacancies" value={String(openVacancies.length)} />
        <StatCard label="Candidates in play" value={String(inPipeline)} href="/recruitment/candidates" />
        <StatCard label="Interviews this week" value={String(interviewsSoon)} />
        <StatCard label="Offers out" value={String(offersOut)} accent={offersOut > 0 ? "warn" : undefined} />
        <StatCard label="Archived" value={String(archivedCount)} href="/recruitment/candidates?tab=archived" />
      </div>

      <BookedInterviews
        today={toDubaiInputValue(now).slice(0, 10)}
        vacancies={vacancies.map((v) => ({ id: v.id, title: v.title }))}
        rows={upcoming.map((iv) => {
          const local = toDubaiInputValue(iv.scheduledAt);
          return {
            id: iv.id,
            candidateId: iv.candidate.id,
            name: iv.candidate.name,
            phone: iv.candidate.phone,
            whatsapp: whatsappNumber(iv.candidate.phone),
            vacancyId: iv.candidate.vacancyId,
            vacancyTitle: iv.candidate.vacancy.title,
            date: local.slice(0, 10),
            time: local.slice(11, 16),
            dateLabel: formatDubaiDate(iv.scheduledAt),
            timeLabel: formatDubaiTime(iv.scheduledAt),
          };
        })}
      />

      <VacanciesExplorer vacancies={rows} />
    </div>
  );
}
