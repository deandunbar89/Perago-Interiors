"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { format, isPast, isToday, startOfDay } from "date-fns";
import { Calendar, Plus, Trash2 } from "lucide-react";
import type { Subtask } from "@prisma/client";
import { createTaskForDeadline, deleteTask, updateTaskDueDate, updateTaskStatus } from "@/lib/actions/tasks";
import { sortByDueDate } from "../filter-deadlines";

export default function TasksPanel({ deadlineId, tasks }: { deadlineId: string; tasks: Subtask[] }) {
  const [statusOverrides, setStatusOverrides] = useState<Record<string, "OPEN" | "DONE">>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const items = useMemo(
    () =>
      sortByDueDate(
        tasks.map((t) => (statusOverrides[t.id] ? { ...t, status: statusOverrides[t.id] } : t))
      ),
    [tasks, statusOverrides]
  );

  const doneCount = items.filter((t) => t.status === "DONE").length;

  function handleAdd(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createTaskForDeadline(deadlineId, formData);
      if (result?.error) setError(result.error);
      else formRef.current?.reset();
    });
  }

  function toggle(task: Subtask) {
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
    <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Tasks</h3>
        {items.length > 0 && (
          <span className="text-xs text-slate-400">
            {doneCount}/{items.length} done
          </span>
        )}
      </div>

      {items.length > 0 && (
        <ul className="mb-3 space-y-1.5">
          {items.map((t) => {
            const due = t.dueDate ? startOfDay(t.dueDate) : null;
            const overdue = due && t.status === "OPEN" && isPast(due) && !isToday(due);
            const dueToday = due && isToday(due);
            return (
              <li
                key={t.id}
                className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={t.status === "DONE"}
                  onChange={() => toggle(t)}
                  className="h-4 w-4 shrink-0 rounded border-slate-300"
                />
                <span
                  className={`flex-1 text-sm ${
                    t.status === "DONE" ? "text-slate-400 line-through" : "text-slate-700"
                  }`}
                >
                  {t.title}
                </span>
                <label
                  className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
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
                    onChange={(e) => changeDueDate(t.id, e.target.value)}
                    className="w-[92px] bg-transparent outline-none [color-scheme:light]"
                  />
                </label>
                <button
                  onClick={() => remove(t.id)}
                  className="shrink-0 text-slate-300 transition hover:text-red-600"
                >
                  <Trash2 size={13} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <form ref={formRef} action={handleAdd} className="flex items-center gap-2">
        <input
          name="title"
          required
          placeholder="Add a task…"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
        />
        <input
          type="date"
          name="dueDate"
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
        />
        <button
          type="submit"
          disabled={pending}
          className="flex shrink-0 items-center gap-1 rounded-lg bg-charcoal px-3 py-1.5 text-sm font-medium text-white transition hover:bg-jet disabled:opacity-60"
        >
          <Plus size={14} />
          Add
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
