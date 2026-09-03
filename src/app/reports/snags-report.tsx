import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { SNAG_PRIORITY_LABELS, SNAG_PRIORITY_COLORS } from "@/lib/constants";
import type { PeriodRange } from "@/lib/report-periods";
import StatCard from "@/app/(app)/dashboard/stat-card";

export default async function SnagsReport({ range }: { range: PeriodRange }) {
  const [openedInPeriod, closedInPeriod, currentlyOpen] = await Promise.all([
    prisma.snag.count({ where: { createdAt: { gte: range.start, lte: range.end } } }),
    prisma.snag.count({ where: { closedAt: { gte: range.start, lte: range.end } } }),
    prisma.snag.findMany({
      where: { status: "OPEN" },
      include: { pmProject: { select: { title: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const byPriority = { HIGH: 0, MEDIUM: 0, LOW: 0 } as Record<string, number>;
  for (const s of currentlyOpen) byPriority[s.priority] = (byPriority[s.priority] ?? 0) + 1;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {range.label}
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Opened This Period" value={String(openedInPeriod)} />
          <StatCard label="Closed This Period" value={String(closedInPeriod)} />
          <StatCard label="Currently Open" value={String(currentlyOpen.length)} accent={currentlyOpen.length > 0 ? "warn" : undefined} />
          <StatCard label="High Priority Open" value={String(byPriority.HIGH ?? 0)} accent={(byPriority.HIGH ?? 0) > 0 ? "warn" : undefined} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Currently open, oldest first
        </h2>
        {currentlyOpen.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
            No open snags right now.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <ul className="divide-y divide-slate-100">
              {currentlyOpen.map((s) => {
                const colors = SNAG_PRIORITY_COLORS[s.priority as keyof typeof SNAG_PRIORITY_COLORS];
                return (
                  <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                    <div className="min-w-0">
                      <span className="text-slate-400">{s.pmProject.title} — </span>
                      <span className="text-slate-800">{s.description}</span>
                    </div>
                    <span className="flex shrink-0 items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${colors.bg} ${colors.text}`}
                      >
                        {SNAG_PRIORITY_LABELS[s.priority as keyof typeof SNAG_PRIORITY_LABELS]}
                      </span>
                      <span className="text-xs text-slate-400">{format(s.createdAt, "MMM d")}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
