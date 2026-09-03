import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { formatNumber, STAGE_LABELS, type Stage } from "@/lib/constants";
import type { PeriodRange } from "@/lib/report-periods";
import StatCard from "@/app/(app)/dashboard/stat-card";

const OPEN_STAGES: Stage[] = ["LEAD", "REVIEWING", "TENDER_SUBMITTED", "ON_HOLD"];

export default async function TendersReport({ range }: { range: PeriodRange }) {
  const [openTenders, newTenders, stageActivity] = await Promise.all([
    prisma.project.findMany({ where: { stage: { in: OPEN_STAGES } }, select: { value: true } }),
    prisma.project.count({ where: { createdAt: { gte: range.start, lte: range.end } } }),
    prisma.activity.findMany({
      where: { type: "STAGE_CHANGE", createdAt: { gte: range.start, lte: range.end } },
      include: { project: { select: { title: true, value: true, stage: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const pipelineValue = openTenders.reduce((sum, p) => sum + (p.value || 0), 0);

  const won = stageActivity.filter((a) => a.message === `Stage changed to ${STAGE_LABELS.WON}`);
  const lost = stageActivity.filter((a) => a.message === `Stage changed to ${STAGE_LABELS.LOST}`);
  const declined = stageActivity.filter((a) => a.message === `Stage changed to ${STAGE_LABELS.DECLINED}`);
  const wonValue = won.reduce((sum, a) => sum + (a.project.value || 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Pipeline snapshot (as of today)
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Open Tenders" value={String(openTenders.length)} />
          <StatCard label="Pipeline Value" value={formatNumber(pipelineValue)} currency="AED" />
          <StatCard label="New This Period" value={String(newTenders)} />
          <StatCard label="Won This Period" value={String(won.length)} currency={formatNumber(wonValue) + " AED"} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Stage movement — {range.label}
        </h2>
        {stageActivity.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
            No tenders changed stage in this period.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <ul className="divide-y divide-slate-100">
              {stageActivity.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <span className="text-slate-800">{a.project.title}</span>
                  <span className="flex items-center gap-3 text-slate-400">
                    {a.message.replace("Stage changed to ", "")}
                    <span className="text-xs">{format(a.createdAt, "MMM d")}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {(lost.length > 0 || declined.length > 0) && (
          <p className="mt-2 text-xs text-slate-400">
            Includes {lost.length} lost and {declined.length} declined in this period.
          </p>
        )}
      </div>
    </div>
  );
}
