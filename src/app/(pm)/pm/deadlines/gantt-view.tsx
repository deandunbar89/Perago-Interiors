import Link from "next/link";
import { addMonths, differenceInCalendarDays, format, isPast, isToday, startOfDay, startOfMonth } from "date-fns";
import type { DeadlineRow } from "./types";

const DAY_WIDTH = 8; // px per day

export default function GanttView({ deadlines }: { deadlines: DeadlineRow[] }) {
  const dated = deadlines.filter((d) => d.dueDate);

  if (dated.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
        Nothing with a due date to show on the timeline.
      </p>
    );
  }

  const dates = dated.map((d) => d.dueDate as Date);
  const minDate = startOfMonth(new Date(Math.min(...dates.map((d) => d.getTime()))));
  const maxDate = addMonths(startOfMonth(new Date(Math.max(...dates.map((d) => d.getTime())))), 1);

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
            <div className="w-[220px] shrink-0 px-4 py-2.5">Deadline</div>
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
            {dated.map((deadline) => {
              const due = startOfDay(deadline.dueDate as Date);
              const overdue = deadline.status === "OPEN" && isPast(due) && !isToday(due);
              const dueToday = isToday(due);
              const left = differenceInCalendarDays(due, minDate) * DAY_WIDTH;
              const color =
                deadline.status === "DONE"
                  ? "bg-emerald-500"
                  : overdue
                    ? "bg-red-500"
                    : dueToday
                      ? "bg-amber-500"
                      : "bg-slate-400";

              return (
                <div key={deadline.id} className="flex items-center">
                  <div className="w-[220px] shrink-0 truncate px-4 py-2.5 text-sm">
                    <Link
                      href={`/pm/deadlines/${deadline.id}`}
                      className={`font-medium hover:underline ${
                        deadline.status === "DONE" ? "text-slate-400 line-through" : "text-slate-800"
                      }`}
                    >
                      {deadline.title}
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
                      href={`/pm/deadlines/${deadline.id}`}
                      title={`${deadline.title}: ${format(due, "MMM d, yyyy")}`}
                      className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 ${color} opacity-90 transition hover:opacity-100`}
                      style={{ left }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
        Each marker sits on the deadline&apos;s due date.
      </p>
    </div>
  );
}
