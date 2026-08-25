"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import type { Project, Subtask } from "@prisma/client";
import { format, isPast, isToday, startOfDay } from "date-fns";
import { Calendar } from "lucide-react";
import ColumnPicker from "@/components/column-picker";
import ViewSwitcher, { type ExplorerView } from "@/components/view-switcher";
import { updateDeadlineStatus } from "@/lib/actions/deadlines";
import { updateTaskStatus } from "@/lib/actions/tasks";
import { deadlineGroupMatchesRange, earliestDueDate, sortByDueDate } from "./filter-deadlines";
import { ALL_COLUMNS, COLUMN_LABELS, DEFAULT_COLUMNS, META_COLUMNS, renderMetaItem, type ColumnId } from "./columns";
import { RANGES, RANGE_LABELS, type DeadlineRow, type Range } from "./types";
import QuickAddDeadline from "./quick-add-deadline";
import GridView from "./grid-view";
import GanttView from "./gantt-view";
import KanbanView from "./kanban-view";

type StatusMap = Record<string, "OPEN" | "DONE">;

const VIEW_KEY = "tendercrm.deadlines.view";
const COLUMNS_KEY = "tendercrm.deadlines.columns";

function DueBadge({ date, done }: { date: Date | null; done: boolean }) {
  if (!date) return null;
  const due = startOfDay(date);
  const overdue = !done && isPast(due) && !isToday(due);
  const dueToday = isToday(due);
  return (
    <span
      className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
        overdue ? "bg-red-50 text-red-700" : dueToday ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
      }`}
    >
      <Calendar size={11} />
      {format(due, "MMM d")}
    </span>
  );
}

export default function DeadlinesExplorer({
  deadlines,
  projects,
  initialRange,
}: {
  deadlines: (DeadlineRow & { _count: { taskNotes: number } })[];
  projects: Project[];
  initialRange: Range;
}) {
  const [range, setRange] = useState<Range>(initialRange);
  const [showDone, setShowDone] = useState(false);
  const [view, setView] = useState<ExplorerView>("list");
  const [columns, setColumns] = useState<ColumnId[]>(DEFAULT_COLUMNS);
  const [ready, setReady] = useState(false);
  const [deadlineOverrides, setDeadlineOverrides] = useState<StatusMap>({});
  const [taskOverrides, setTaskOverrides] = useState<StatusMap>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  // localStorage isn't available during SSR, so preferences are applied post-mount
  // rather than in a lazy useState initializer, which would cause a hydration mismatch.
  useEffect(() => {
    const savedView = localStorage.getItem(VIEW_KEY) as ExplorerView | null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (savedView) setView(savedView);
    const savedColumns = localStorage.getItem(COLUMNS_KEY);
    if (savedColumns) {
      try {
        setColumns(JSON.parse(savedColumns));
      } catch {
        // ignore corrupt value
      }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(VIEW_KEY, view);
  }, [view, ready]);

  useEffect(() => {
    if (ready) localStorage.setItem(COLUMNS_KEY, JSON.stringify(columns));
  }, [columns, ready]);

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Derived fresh from props each render (see note in toggleDeadlineDone) so newly
  // created/deleted deadlines and tasks show up without a full page reload.
  const items = useMemo(
    () =>
      deadlines.map((d) => ({
        ...(deadlineOverrides[d.id] ? { ...d, status: deadlineOverrides[d.id] } : d),
        subtasks: d.subtasks.map((s) => (taskOverrides[s.id] ? { ...s, status: taskOverrides[s.id] } : s)),
      })),
    [deadlines, deadlineOverrides, taskOverrides]
  );

  const openDeadlines = useMemo(() => items.filter((d) => d.status === "OPEN"), [items]);

  const counts = useMemo(() => {
    const c: Record<Range, number> = {
      overdue: 0,
      today: 0,
      tomorrow: 0,
      week: 0,
      "7days": 0,
      "14days": 0,
      all: openDeadlines.length,
    };
    for (const r of RANGES) {
      if (r === "all") continue;
      c[r] = openDeadlines.filter((d) => deadlineGroupMatchesRange(d, r)).length;
    }
    return c;
  }, [openDeadlines]);

  const visible = useMemo(() => {
    const base = showDone ? items : openDeadlines;
    const matching = base.filter((d) => deadlineGroupMatchesRange(d, range));
    return [...matching].sort((a, b) => {
      const da = earliestDueDate(a);
      const db = earliestDueDate(b);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return da.getTime() - db.getTime();
    });
  }, [items, openDeadlines, showDone, range]);

  // Kanban's columns are themselves date buckets, so it ignores the range chips and
  // shows everything at once (still honoring "show completed").
  const kanbanItems = showDone ? items : openDeadlines;

  function toggleDeadlineDone(deadline: DeadlineRow) {
    const nextStatus = deadline.status === "OPEN" ? "DONE" : "OPEN";
    setDeadlineOverrides((prev) => ({ ...prev, [deadline.id]: nextStatus }));
    startTransition(() => {
      updateDeadlineStatus(deadline.id, nextStatus);
    });
  }

  function toggleTaskDone(task: Subtask) {
    const nextStatus = task.status === "OPEN" ? "DONE" : "OPEN";
    setTaskOverrides((prev) => ({ ...prev, [task.id]: nextStatus }));
    startTransition(() => {
      updateTaskStatus(task.id, nextStatus);
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {view !== "kanban" &&
            RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  range === r
                    ? "border-charcoal bg-charcoal text-white"
                    : "border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {RANGE_LABELS[r]}
                {r !== "all" && counts[r] > 0 && (
                  <span
                    className={`rounded-full px-1.5 text-xs ${
                      range === r ? "bg-white/20" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {counts[r]}
                  </span>
                )}
              </button>
            ))}
          {view === "kanban" && (
            <p className="text-xs text-slate-400">Columns are date ranges — drag a card to reschedule it.</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {view === "list" && (
            <ColumnPicker
              allColumns={ALL_COLUMNS}
              labels={COLUMN_LABELS}
              lockedColumn="title"
              visible={columns}
              onChange={setColumns}
            />
          )}
          <ViewSwitcher view={view} onChange={setView} views={["list", "grid", "gantt", "kanban"]} />
          <QuickAddDeadline projects={projects} />
        </div>
      </div>

      <label className="mb-3 flex w-fit items-center gap-2 text-sm text-slate-500">
        <input
          type="checkbox"
          checked={showDone}
          onChange={(e) => setShowDone(e.target.checked)}
          className="rounded border-slate-300"
        />
        Show completed
      </label>

      {view === "grid" && <GridView deadlines={visible} />}
      {view === "gantt" && <GanttView deadlines={visible} />}
      {view === "kanban" && <KanbanView deadlines={kanbanItems} />}
      {view === "list" &&
        (visible.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
            Nothing here.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {visible.map((deadline) => {
              const relevantTasks = sortByDueDate(
                showDone ? deadline.subtasks : deadline.subtasks.filter((s) => s.status === "OPEN")
              );
              const visibleMeta = META_COLUMNS.filter((c) => columns.includes(c) && c !== "dueDate");
              const showDueDate = columns.includes("dueDate");

              return (
                <li key={deadline.id} className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={deadline.status === "DONE"}
                      onChange={() => toggleDeadlineDone(deadline)}
                      className="h-4 w-4 shrink-0 rounded border-slate-300"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/deadlines/${deadline.id}`}
                        className={`text-sm font-medium hover:underline ${
                          deadline.status === "DONE" ? "text-slate-400 line-through" : "text-slate-800"
                        }`}
                      >
                        {deadline.title}
                      </Link>
                      {visibleMeta.length > 0 && (
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                          {visibleMeta.map((col) =>
                            renderMetaItem(col, deadline, {
                              expanded: expanded.has(deadline.id),
                              onToggleExpand: () => toggleExpanded(deadline.id),
                            })
                          )}
                        </div>
                      )}
                    </div>
                    {showDueDate && (
                      <DueBadge date={deadline.dueDate} done={deadline.status === "DONE"} />
                    )}
                  </div>

                  {expanded.has(deadline.id) && relevantTasks.length > 0 && (
                    <ul className="mt-2 ml-7 space-y-1 border-l border-slate-100 pl-3">
                      {relevantTasks.map((s) => (
                        <li key={s.id} className="flex items-center gap-2.5 py-0.5">
                          <input
                            type="checkbox"
                            checked={s.status === "DONE"}
                            onChange={() => toggleTaskDone(s)}
                            className="h-3.5 w-3.5 shrink-0 rounded border-slate-300"
                          />
                          <Link
                            href={`/deadlines/${deadline.id}`}
                            className={`flex-1 text-sm hover:underline ${
                              s.status === "DONE" ? "text-slate-400 line-through" : "text-slate-600"
                            }`}
                          >
                            {s.title}
                          </Link>
                          <DueBadge date={s.dueDate} done={s.status === "DONE"} />
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        ))}
    </div>
  );
}
