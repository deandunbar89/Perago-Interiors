import { addMonths, differenceInCalendarDays, format, startOfMonth } from "date-fns";
import type { ScheduleItem } from "@prisma/client";

const DAY_WIDTH = 10; // px per day

const STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: "bg-slate-300",
  IN_PROGRESS: "bg-gold",
  DONE: "bg-emerald-500",
};

export default function ScheduleGantt({ items }: { items: ScheduleItem[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
        No schedule items yet — add one below to see it on the timeline.
      </p>
    );
  }

  const minDate = startOfMonth(new Date(Math.min(...items.map((i) => i.startDate.getTime()))));
  const maxDate = addMonths(startOfMonth(new Date(Math.max(...items.map((i) => i.endDate.getTime())))), 1);
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
            <div className="w-[220px] shrink-0 px-4 py-2.5">Item</div>
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
            {items.map((item) => {
              const left = differenceInCalendarDays(item.startDate, minDate) * DAY_WIDTH;
              const width = Math.max(differenceInCalendarDays(item.endDate, item.startDate) * DAY_WIDTH, 6);
              const color = STATUS_COLORS[item.status];

              return (
                <div key={item.id} className="flex items-center">
                  <div className="w-[220px] shrink-0 truncate px-4 py-3 text-sm font-medium text-slate-800">
                    {item.title}
                  </div>
                  <div className="relative flex-1" style={{ width: timelineWidth, height: 40 }}>
                    {months.map((m) => (
                      <div
                        key={m.toISOString()}
                        className="absolute top-0 h-full border-l border-slate-50"
                        style={{ left: differenceInCalendarDays(m, minDate) * DAY_WIDTH }}
                      />
                    ))}
                    <div
                      title={`${item.title}: ${format(item.startDate, "MMM d")} – ${format(item.endDate, "MMM d, yyyy")} (${item.percentComplete}%)`}
                      className="absolute top-1/2 h-5 -translate-y-1/2 overflow-hidden rounded-md bg-slate-100"
                      style={{ left, width }}
                    >
                      <div className={`h-full ${color}`} style={{ width: `${item.percentComplete}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
