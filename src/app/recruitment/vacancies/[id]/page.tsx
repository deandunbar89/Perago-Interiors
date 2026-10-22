import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getRecruitmentTeam } from "@/lib/recruitment-team";
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/constants";
import CandidateExplorer from "../../candidate-explorer";
import RecruitmentTasksPanel from "../../tasks-panel";
import { candidateRowInclude, taskRowInclude } from "../../types";
import VacancyHeader from "./vacancy-header";

export const dynamic = "force-dynamic";

export default async function VacancyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const [vacancy, candidates, tasks, team] = await Promise.all([
    prisma.vacancy.findUnique({ where: { id } }),
    prisma.candidate.findMany({ where: { vacancyId: id }, include: candidateRowInclude, orderBy: { appliedAt: "desc" } }),
    prisma.recruitmentTask.findMany({
      where: { vacancyId: id },
      include: taskRowInclude,
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    }),
    getRecruitmentTeam(),
  ]);
  if (!vacancy) notFound();

  const facts = [
    { label: "Department", value: vacancy.department },
    { label: "Location", value: vacancy.location },
    { label: "Type", value: EMPLOYMENT_TYPE_LABELS[vacancy.employmentType] },
    { label: "Positions", value: String(vacancy.headcount) },
    { label: "Salary range", value: vacancy.salaryRange },
  ];

  return (
    <div className="p-8">
      <Link href="/recruitment" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={14} />
        All vacancies
      </Link>

      <VacancyHeader vacancy={vacancy} />

      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {facts.map((f) => (
            <div key={f.label}>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{f.label}</dt>
              <dd className="mt-0.5 text-sm text-slate-800">{f.value || "—"}</dd>
            </div>
          ))}
        </dl>
        {(vacancy.description || vacancy.requirements) && (
          <div className="mt-5 grid gap-5 border-t border-slate-100 pt-5 md:grid-cols-2">
            {vacancy.description && (
              <div>
                <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Description</h3>
                <p className="whitespace-pre-wrap text-sm text-slate-700">{vacancy.description}</p>
              </div>
            )}
            {vacancy.requirements && (
              <div>
                <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Requirements</h3>
                <p className="whitespace-pre-wrap text-sm text-slate-700">{vacancy.requirements}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Candidates</h2>
      <div className="mb-8">
        <CandidateExplorer
          candidates={candidates}
          vacancies={[{ id: vacancy.id, title: vacancy.title }]}
          fixedVacancyId={vacancy.id}
          storageKey="tendercrm.recruitment.vacancy.view"
          cvReading={!!process.env.ANTHROPIC_API_KEY}
        />
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Tasks</h2>
      <RecruitmentTasksPanel
        tasks={tasks}
        team={team}
        currentUserId={session?.user?.id ?? ""}
        vacancyId={vacancy.id}
        showContext
      />
    </div>
  );
}
