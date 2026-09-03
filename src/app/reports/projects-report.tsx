import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/constants";
import type { PeriodRange } from "@/lib/report-periods";
import StatCard from "@/app/(app)/dashboard/stat-card";

const SCHEDULE_STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

export default async function ProjectsReport({ range }: { range: PeriodRange }) {
  const [allProjects, newProjects, scheduleItems, completedTasks] = await Promise.all([
    prisma.pmProject.findMany({ select: { status: true, value: true } }),
    prisma.pmProject.count({ where: { createdAt: { gte: range.start, lte: range.end } } }),
    prisma.scheduleItem.findMany({
      where: { endDate: { gte: range.start, lte: range.end } },
      include: { pmProject: { select: { title: true } } },
      orderBy: { endDate: "asc" },
    }),
    prisma.subtask.count({
      where: { scope: "PM", status: "DONE", updatedAt: { gte: range.start, lte: range.end } },
    }),
  ]);

  const active = allProjects.filter((p) => p.status === "ACTIVE");
  const onHold = allProjects.filter((p) => p.status === "ON_HOLD");
  const activeValue = active.reduce((sum, p) => sum + (p.value || 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Portfolio snapshot (as of today)
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Active Projects" value={String(active.length)} />
          <StatCard label="Active Value" value={formatNumber(activeValue)} currency="AED" />
          <StatCard label="On Hold" value={String(onHold.length)} accent={onHold.length > 0 ? "warn" : undefined} />
          <StatCard label="New This Period" value={String(newProjects)} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Program items due — {range.label}
        </h2>
        {scheduleItems.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
            No program items were due in this period.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <ul className="divide-y divide-slate-100">
              {scheduleItems.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <span className="text-slate-800">
                    {s.pmProject.title} — {s.title}
                  </span>
                  <span className="flex items-center gap-3 text-slate-400">
                    {s.percentComplete}% · {SCHEDULE_STATUS_LABELS[s.status] ?? s.status}
                    <span className="text-xs">{format(s.endDate, "MMM d")}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Tasks completed — {range.label}
        </h2>
        <StatCard label="PM Tasks Completed" value={String(completedTasks)} />
      </div>
    </div>
  );
}
