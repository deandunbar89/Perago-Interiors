import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getRecruitmentTeam } from "@/lib/recruitment-team";
import { candidateScore } from "@/lib/recruitment-score";
import DocCard from "../../doc-card";
import RecruitmentTasksPanel from "../../tasks-panel";
import { taskRowInclude } from "../../types";
import CandidateHeader from "./candidate-header";
import InterviewsSection from "./interviews-section";
import OfferSection from "./offer-section";

export const dynamic = "force-dynamic";

export default async function CandidatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ upload?: string }>;
}) {
  const [{ id }, { upload }] = await Promise.all([params, searchParams]);
  const session = await auth();

  const [candidate, vacancies, tasks, team] = await Promise.all([
    prisma.candidate.findUnique({
      where: { id },
      include: {
        vacancy: { select: { id: true, title: true } },
        documents: { orderBy: { createdAt: "desc" }, include: { uploadedBy: { select: { name: true } } } },
        interviews: { orderBy: { scheduledAt: "desc" }, include: { scores: true } },
        offer: true,
      },
    }),
    prisma.vacancy.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
    prisma.recruitmentTask.findMany({
      where: { candidateId: id },
      include: taskRowInclude,
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    }),
    getRecruitmentTeam(),
  ]);
  if (!candidate) notFound();

  const docsOfType = (type: string) => candidate.documents.filter((d) => d.type === type);

  const details = [
    { label: "Email", value: candidate.email, href: candidate.email ? `mailto:${candidate.email}` : null },
    { label: "Phone", value: candidate.phone, href: candidate.phone ? `tel:${candidate.phone}` : null },
    { label: "Based in", value: candidate.location },
    { label: "Source", value: candidate.source },
    { label: "Notice period", value: candidate.noticePeriod },
    { label: "Expected salary", value: candidate.expectedSalary },
    { label: "Applied", value: format(candidate.appliedAt, "d MMM yyyy") },
  ];

  return (
    <div className="p-8">
      <Link
        href={`/recruitment/vacancies/${candidate.vacancy.id}`}
        className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft size={14} />
        {candidate.vacancy.title}
      </Link>

      {upload === "failed" && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {candidate.name} was saved, but a file didn&apos;t upload. Add it again in the CV or Cover letter box below.
        </p>
      )}

      <CandidateHeader
        candidate={candidate}
        vacancy={candidate.vacancy}
        vacancies={vacancies}
        score={candidateScore(candidate.interviews)}
        offer={candidate.offer}
      />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Details</h2>
            <dl className="space-y-2">
              {details.map((d) => (
                <div key={d.label} className="flex justify-between gap-3 text-sm">
                  <dt className="text-slate-500">{d.label}</dt>
                  <dd className="min-w-0 truncate text-right text-slate-800">
                    {d.value ? (
                      d.href ? (
                        <a href={d.href} className="hover:underline">
                          {d.value}
                        </a>
                      ) : (
                        d.value
                      )
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
              ))}
            </dl>
            {candidate.stage === "REJECTED" && candidate.rejectionReason && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                Rejected: {candidate.rejectionReason}
              </p>
            )}
            {candidate.notes && (
              <p className="mt-3 whitespace-pre-wrap border-t border-slate-100 pt-3 text-sm text-slate-700">
                {candidate.notes}
              </p>
            )}
          </div>

          <DocCard candidateId={candidate.id} type="CV" title="CV" hint="PDF or Word" documents={docsOfType("CV")} />
          <DocCard candidateId={candidate.id} type="COVER_LETTER" title="Cover letter" documents={docsOfType("COVER_LETTER")} />
          <DocCard
            candidateId={candidate.id}
            type="OTHER"
            title="Other documents"
            hint="Portfolio, certificates, references, ID copies"
            documents={docsOfType("OTHER")}
          />
        </div>

        <div className="space-y-8 lg:col-span-2">
          <InterviewsSection candidateId={candidate.id} interviews={candidate.interviews} />
          <OfferSection candidateId={candidate.id} offer={candidate.offer} letters={docsOfType("OFFER_LETTER")} />
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Tasks</h2>
            <RecruitmentTasksPanel
              tasks={tasks}
              team={team}
              currentUserId={session?.user?.id ?? ""}
              candidateId={candidate.id}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
