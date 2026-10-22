import { addDays } from "date-fns";
import StatCard from "@/app/(app)/dashboard/stat-card";
import { prisma } from "@/lib/prisma";
import VacanciesExplorer from "./vacancies-explorer";

export const dynamic = "force-dynamic";

export default async function RecruitmentPage() {
  const now = new Date();

  const [vacancies, interviewsSoon, offersOut] = await Promise.all([
    prisma.vacancy.findMany({
      orderBy: [{ openedAt: "desc" }],
      include: { candidates: { select: { stage: true } } },
    }),
    prisma.interview.count({ where: { scheduledAt: { gte: now, lte: addDays(now, 7) } } }),
    prisma.offer.count({ where: { status: "SENT" } }),
  ]);

  const openVacancies = vacancies.filter((v) => v.status === "OPEN");
  const inPipeline = openVacancies.reduce(
    (sum, v) => sum + v.candidates.filter((c) => c.stage !== "HIRED" && c.stage !== "REJECTED").length,
    0
  );

  const rows = vacancies.map(({ candidates, ...vacancy }) => ({
    ...vacancy,
    total: candidates.length,
    active: candidates.filter((c) => c.stage !== "HIRED" && c.stage !== "REJECTED").length,
    hired: candidates.filter((c) => c.stage === "HIRED").length,
  }));

  return (
    <div className="p-8">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Recruitment</h1>
      <p className="mb-6 text-sm text-slate-500">Open roles, candidates, interviews and offers</p>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Open vacancies" value={String(openVacancies.length)} />
        <StatCard label="Candidates in play" value={String(inPipeline)} href="/recruitment/candidates" />
        <StatCard label="Interviews this week" value={String(interviewsSoon)} />
        <StatCard label="Offers out" value={String(offersOut)} accent={offersOut > 0 ? "warn" : undefined} />
      </div>

      <VacanciesExplorer vacancies={rows} />
    </div>
  );
}
