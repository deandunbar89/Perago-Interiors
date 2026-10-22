import { prisma } from "@/lib/prisma";
import CandidateExplorer from "../candidate-explorer";
import { candidateRowInclude } from "../types";

export const dynamic = "force-dynamic";

export default async function CandidatesPage() {
  const [candidates, vacancies] = await Promise.all([
    prisma.candidate.findMany({ include: candidateRowInclude, orderBy: { appliedAt: "desc" } }),
    prisma.vacancy.findMany({
      where: { status: { in: ["OPEN", "ON_HOLD", "DRAFT"] } },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
  ]);

  // The filter also needs vacancies that are filled/closed if anyone is still filed under them.
  const known = new Set(vacancies.map((v) => v.id));
  const extra = candidates.filter((c) => !known.has(c.vacancyId)).map((c) => c.vacancy);
  const seen = new Set<string>();
  const allVacancies = [...vacancies, ...extra].filter((v) => (seen.has(v.id) ? false : (seen.add(v.id), true)));

  return (
    <div className="p-8">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Candidates</h1>
      <p className="mb-6 text-sm text-slate-500">Everyone who has applied, across every vacancy</p>
      <CandidateExplorer
        candidates={candidates}
        vacancies={allVacancies}
        storageKey="tendercrm.recruitment.candidates.view"
        cvReading={!!process.env.ANTHROPIC_API_KEY}
      />
    </div>
  );
}
