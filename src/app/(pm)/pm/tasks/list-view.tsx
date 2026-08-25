import Link from "next/link";
import { format, isPast, isToday, startOfDay } from "date-fns";
import { ArrowDown, ArrowUp, ArrowUpDown, Calendar, Flag, Trash2 } from "lucide-react";
import { COLUMN_LABELS, DEFAULT_SORT_DIRECTION, type ColumnId, type SortState } from "./columns";
import type { TaskRow } from "./types";

export default function ListView({
  tasks,
  columns,
  sort,
  onSortChange,
  onToggle,
  onChangeDueDate,
  onDelete,
}: {
  tasks: TaskRow[];
  columns: ColumnId[];
  sort: SortState | null;
  onSortChange: (sort: SortState) => void;
  onToggle: (task: TaskRow) => void;
  onChangeDueDate: (id: string, value: string) => void;
  onDelete: (id: string) => void;
}) {
  if (tasks.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
        Nothing here.
      </p>
    );
  }

  function handleHeaderClick(col: ColumnId) {
    if (sort?.column === col) {
      onSortChange({ column: col, direction: sort.direction === "asc" ? "desc" : "asc" });
    } else {
      onSortChange({ column: col, direction: DEFAULT_SORT_DIRECTION[col] });
    }
  }

  function renderCell(col: ColumnId, task: TaskRow) {
    switch (col) {
      case "title":
        return (
          <Link
            href={`/my-tasks/${task.id}`}
            className={`font-medium hover:underline ${
              task.status === "DONE" ? "text-slate-400 line-through" : "text-slate-900"
            }`}
          >
            {task.title}
          </Link>
        );
      case "deadline":
        return task.task ? (
          <Link href={`/pm/deadlines/${task.task.id}`} className="flex items-center gap-1 hover:underline">
            <Flag size={11} />
            {task.task.title}
          </Link>
        ) : (
          <span className="text-slate-300">—</span>
        );
      case "project":
        return task.pmProject ? (
          <Link href={`/pm/projects/${task.pmProject.id}`} className="hover:underline">
            {task.pmProject.title}
          </Link>
        ) : (
          <span className="text-slate-300">—</span>
        );
      case "status":
        return (
          <span className={task.status === "DONE" ? "text-emerald-600" : "text-slate-500"}>
            {task.status === "DONE" ? "Done" : "Open"}
          </span>
        );
      case "dueDate": {
        const due = task.dueDate ? startOfDay(task.dueDate) : null;
        const overdue = due && task.status === "OPEN" && isPast(due) && !isToday(due);
        const dueToday = due && isToday(due);
        return (
          <label
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              overdue
                ? "bg-red-50 text-red-700"
                : dueToday
                  ? "bg-amber-50 text-amber-700"
                  : due
                    ? "bg-slate-100 text-slate-600"
                    : "text-slate-300"
            }`}
          >
            <Calendar size={11} />
            <input
              type="date"
              defaultValue={due ? format(due, "yyyy-MM-dd") : ""}
              onChange={(e) => onChangeDueDate(task.id, e.target.value)}
              className="w-[92px] bg-transparent outline-none [color-scheme:light]"
            />
          </label>
        );
      }
      default:
        return null;
    }
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="w-10 px-4 py-2.5" />
            {columns.map((col) => {
              const active = sort?.column === col;
              return (
                <th key={col} className="whitespace-nowrap px-4 py-2.5">
                  <button
                    onClick={() => handleHeaderClick(col)}
                    className={`flex items-center gap-1 transition hover:text-slate-800 ${
                      active ? "text-slate-800" : ""
                    }`}
                  >
                    {COLUMN_LABELS[col]}
                    {active ? (
                      sort.direction === "asc" ? (
                        <ArrowUp size={12} />
                      ) : (
                        <ArrowDown size={12} />
                      )
                    ) : (
                      <ArrowUpDown size={12} className="text-slate-300" />
                    )}
                  </button>
                </th>
              );
            })}
            <th className="w-10 px-4 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tasks.map((task) => (
            <tr key={task.id} className="transition hover:bg-slate-50">
              <td className="px-4 py-2.5">
                <input
                  type="checkbox"
                  checked={task.status === "DONE"}
                  onChange={() => onToggle(task)}
                  className="h-4 w-4 rounded border-slate-300"
                />
              </td>
              {columns.map((col) => (
                <td key={col} className="whitespace-nowrap px-4 py-2.5">
                  {renderCell(col, task)}
                </td>
              ))}
              <td className="px-4 py-2.5 text-right">
                <button
                  onClick={() => onDelete(task.id)}
                  className="text-slate-300 transition hover:text-red-600"
                >
                  <Trash2 size={15} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
