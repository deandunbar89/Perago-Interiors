import Link from "next/link";
import { addMonths, differenceInCalendarDays, format, startOfMonth } from "date-fns";
import { PM_STATUS_COLORS, type PmStatus } from "@/lib/constants";
import type { PmProjectRow } from "./types";

const DAY_WIDTH = 8; // px per day

function getBarRange(project: PmProjectRow): [Date, Date] {
  const start = project.startDate || project.createdAt;
  let end = project.targetEndDate || start;
  if (end.getTime() <= start.getTime()) {
    end = new Date(start.getTime() + 1000 * 60 * 60 * 24 * 7); // pad to at least a week
  }
  return [start, end];
}

export default function GanttView({ projects }: { projects: PmProjectRow[] }) {
  if (projects.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
        No projects match your filters.
      </p>
    );
  }

  const ranges = projects.map(getBarRange);
  const minDate = startOfMonth(new Date(Math.min(...ranges.map(([s]) => s.getTime()))));
  const maxDateRaw = new Date(Math.max(...ranges.map(([, e]) => e.getTime())));
  const maxDate = addMonths(startOfMonth(maxDateRaw), 1);

  const totalDays = differenceInCalendarDays(maxDate, minDate);
  const timelineWidth = totalDays * DAY_WIDTH;

  const months: Date[] = [];
  let cursor = minDate;
  while (cursor < maxDate) {
    months.push(cursor);
    cursor = addMonths(cursor, 1);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <div style={{ width: timelineWidth + 220 }}>
          <div className="flex border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <div className="w-[220px] shrink-0 px-4 py-2.5">Project</div>
            <div className="relative flex-1" style={{ width: timelineWidth }}>
              {months.map((m) => (
                <div
                  key={m.toISOString()}
                  className="absolute top-0 border-l border-slate-100 py-2.5 pl-2"
                  style={{ left: differenceInCalendarDays(m, minDate) * DAY_WIDTH }}
                >
                  {format(m, "MMM yyyy")}
                </div>
              ))}
              <div className="py-2.5">&nbsp;</div>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {projects.map((project, i) => {
              const [start, end] = ranges[i];
              const left = differenceInCalendarDays(start, minDate) * DAY_WIDTH;
              const width = Math.max(differenceInCalendarDays(end, start) * DAY_WIDTH, 6);
              const colors = PM_STATUS_COLORS[project.status as PmStatus];
              return (
                <div key={project.id} className="flex items-center">
                  <div className="w-[220px] shrink-0 truncate px-4 py-2.5 text-sm">
                    <Link
                      href={`/pm/projects/${project.id}`}
                      className="font-medium text-slate-800 hover:underline"
                    >
                      {project.title}
                    </Link>
                  </div>
                  <div className="relative flex-1" style={{ width: timelineWidth, height: 36 }}>
                    {months.map((m) => (
                      <div
                        key={m.toISOString()}
                        className="absolute top-0 h-full border-l border-slate-50"
                        style={{ left: differenceInCalendarDays(m, minDate) * DAY_WIDTH }}
                      />
                    ))}
                    <Link
                      href={`/pm/projects/${project.id}`}
                      title={`${project.title}: ${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`}
                      className={`absolute top-1/2 h-5 -translate-y-1/2 rounded-md ${colors.dot} opacity-80 transition hover:opacity-100`}
                      style={{ left, width }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
        Bars run from start date to target completion.
      </p>
    </div>
  );
}
