"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { Project, Task } from "@prisma/client";
import { matchesRange, sortByDueDate, RANGES, RANGE_LABELS, type Range } from "@/lib/date-ranges";
import { updateTaskStatus, updateTaskDueDate, deleteTask } from "@/lib/actions/tasks";
import ColumnPicker from "@/components/column-picker";
import ViewSwitcher, { type ExplorerView } from "@/components/view-switcher";
import { ALL_COLUMNS, COLUMN_LABELS, DEFAULT_COLUMNS, sortTasks, type ColumnId, type SortState } from "./columns";
import type { TaskRow } from "./types";
import QuickAddTask from "./quick-add-task";
import ListView from "./list-view";
import GridView from "./grid-view";
import GanttView from "./gantt-view";
import KanbanView from "./kanban-view";

type StatusMap = Record<string, "OPEN" | "DONE">;

const VIEW_KEY = "tendercrm.tasks.view";
const COLUMNS_KEY = "tendercrm.tasks.columns";
const SORT_KEY = "tendercrm.tasks.sort";

export default function TasksExplorer({
  tasks,
  projects,
  deadlines,
  initialRange,
}: {
  tasks: TaskRow[];
  projects: Project[];
  deadlines: Task[];
  initialRange: Range;
}) {
  const [range, setRange] = useState<Range>(initialRange);
  const [showDone, setShowDone] = useState(false);
  const [view, setView] = useState<ExplorerView>("list");
  const [columns, setColumns] = useState<ColumnId[]>(DEFAULT_COLUMNS);
  const [sort, setSort] = useState<SortState | null>(null);
  const [ready, setReady] = useState(false);
  const [statusOverrides, setStatusOverrides] = useState<StatusMap>({});
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
    const savedSort = localStorage.getItem(SORT_KEY);
    if (savedSort) {
      try {
        setSort(JSON.parse(savedSort));
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

  useEffect(() => {
    if (ready) localStorage.setItem(SORT_KEY, JSON.stringify(sort));
  }, [sort, ready]);

  // Derived fresh from props each render so newly created/deleted tasks show up
  // without a full page reload; overrides only cover the optimistic in-flight window.
  const items = useMemo(
    () => tasks.map((t) => (statusOverrides[t.id] ? { ...t, status: statusOverrides[t.id] } : t)),
    [tasks, statusOverrides]
  );

  const openTasks = useMemo(() => items.filter((t) => t.status === "OPEN"), [items]);

  const counts = useMemo(() => {
    const c: Record<Range, number> = {
      overdue: 0,
      today: 0,
      tomorrow: 0,
      week: 0,
      "7days": 0,
      "14days": 0,
      all: openTasks.length,
    };
    for (const r of RANGES) {
      if (r === "all") continue;
      c[r] = openTasks.filter((t) => matchesRange(t, r)).length;
    }
    return c;
  }, [openTasks]);

  const visible = useMemo(() => {
    const base = showDone ? items : openTasks;
    return sortByDueDate(base.filter((t) => matchesRange(t, range)));
  }, [items, openTasks, showDone, range]);

  const sortedForList = useMemo(() => sortTasks(visible, sort), [visible, sort]);

  // Kanban's columns are themselves date buckets, so it ignores the range chips and
  // shows everything at once (still honoring "show completed").
  const kanbanItems = showDone ? items : openTasks;

  function toggleDone(task: TaskRow) {
    const next = task.status === "OPEN" ? "DONE" : "OPEN";
    setStatusOverrides((prev) => ({ ...prev, [task.id]: next }));
    startTransition(() => {
      updateTaskStatus(task.id, next);
    });
  }

  function changeDueDate(taskId: string, value: string) {
    startTransition(() => {
      updateTaskDueDate(taskId, value || null);
    });
  }

  function remove(taskId: string) {
    if (!confirm("Delete this task?")) return;
    startTransition(() => {
      deleteTask(taskId);
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
          <QuickAddTask projects={projects} deadlines={deadlines} />
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

      {view === "grid" && <GridView tasks={visible} />}
      {view === "gantt" && <GanttView tasks={visible} />}
      {view === "kanban" && <KanbanView tasks={kanbanItems} />}
      {view === "list" && (
        <ListView
          tasks={sortedForList}
          columns={columns}
          sort={sort}
          onSortChange={setSort}
          onToggle={toggleDone}
          onChangeDueDate={changeDueDate}
          onDelete={remove}
        />
      )}
    </div>
  );
}
