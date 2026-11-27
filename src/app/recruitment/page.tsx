import { addDays } from "date-fns";
import StatCard from "@/app/(app)/dashboard/stat-card";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import VacanciesExplorer from "./vacancies-explorer";
import WhatsAppButton from "@/components/whatsapp-button";
import { whatsappNumber } from "@/lib/whatsapp";
import { formatDubaiDate, formatDubaiTime } from "@/lib/dubai-time";

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
      include: { candidate: { select: { id: true, name: true, phone: true, vacancy: { select: { title: true } } } } },
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

      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Booked interviews ({upcoming.length})
      </h2>
      <div className="mb-8 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        {upcoming.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-400">No interviews booked.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Candidate</th>
                <th className="px-4 py-2.5 font-semibold">Position</th>
                <th className="px-4 py-2.5 font-semibold">Interview date</th>
                <th className="px-4 py-2.5 font-semibold">Time</th>
                <th className="px-4 py-2.5 font-semibold">Contact number</th>
                <th className="px-4 py-2.5 font-semibold">WhatsApp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {upcoming.map((iv) => {
                const wa = whatsappNumber(iv.candidate.phone);
                return (
                  <tr key={iv.id}>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <Link href={`/recruitment/candidates/${iv.candidate.id}`} className="font-medium text-slate-900 hover:underline">
                        {iv.candidate.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{iv.candidate.vacancy.title}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-slate-700">{formatDubaiDate(iv.scheduledAt)}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-slate-700">{formatDubaiTime(iv.scheduledAt)}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-slate-700">
                      {iv.candidate.phone ? (
                        <a href={`tel:${iv.candidate.phone.replace(/\s+/g, "")}`} className="hover:underline">
                          {iv.candidate.phone}
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      {wa ? <WhatsAppButton number={wa} name={iv.candidate.name} compact /> : <span className="text-slate-400">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <VacanciesExplorer vacancies={rows} />
    </div>
  );
}
