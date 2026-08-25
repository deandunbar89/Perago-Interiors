"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { format, isPast, isToday, startOfDay } from "date-fns";
import { Calendar } from "lucide-react";
import type { Subtask } from "@prisma/client";
import { sortByDueDate } from "@/lib/date-ranges";
import { updateTaskStatus } from "@/lib/actions/pm-tasks";

export default function TasksSummary({ tasks }: { tasks: Subtask[] }) {
  const [overrides, setOverrides] = useState<Record<string, "OPEN" | "DONE">>({});
  const [, startTransition] = useTransition();

  const items = useMemo(
    () => sortByDueDate(tasks.map((t) => (overrides[t.id] ? { ...t, status: overrides[t.id] } : t))),
    [tasks, overrides]
  );

  function toggle(id: string, current: "OPEN" | "DONE") {
    const next = current === "OPEN" ? "DONE" : "OPEN";
    setOverrides((prev) => ({ ...prev, [id]: next }));
    startTransition(() => {
      updateTaskStatus(id, next);
    });
  }

  if (items.length === 0) {
    return <p className="text-sm text-slate-400">No tasks yet.</p>;
  }

  return (
    <ul className="space-y-1.5">
      {items.map((t) => {
        const due = t.dueDate ? startOfDay(t.dueDate) : null;
        const overdue = due && t.status === "OPEN" && isPast(due) && !isToday(due);
        const dueToday = due && isToday(due);
        return (
          <li key={t.id} className="flex items-center gap-2.5 py-1">
            <input
              type="checkbox"
              checked={t.status === "DONE"}
              onChange={() => toggle(t.id, t.status)}
              className="h-4 w-4 shrink-0 rounded border-slate-300"
            />
            <Link
              href={`/my-tasks/${t.id}`}
              className={`flex-1 truncate text-sm hover:underline ${
                t.status === "DONE" ? "text-slate-400 line-through" : "text-slate-700"
              }`}
            >
              {t.title}
            </Link>
            {due && (
              <span
                className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  overdue ? "bg-red-50 text-red-700" : dueToday ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
                }`}
              >
                <Calendar size={11} />
                {format(due, "MMM d")}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
