"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { format, isPast, isToday, startOfDay } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import {
  createRecruitmentTask,
  deleteRecruitmentTask,
  setRecruitmentTaskStatus,
  updateRecruitmentTask,
} from "@/lib/actions/recruitment";
import { FIELD } from "./parts";
import type { TaskRow, TeamMember } from "./types";

/** Recruitment to-dos. Used on a candidate, on a vacancy, and on the section-wide Tasks tab. */
export default function RecruitmentTasksPanel({
  tasks,
  team,
  currentUserId,
  candidateId,
  vacancyId,
  showContext = false,
  showFilters = false,
}: {
  tasks: TaskRow[];
  team: TeamMember[];
  currentUserId: string;
  /** Tasks added from here are tied to this candidate… */
  candidateId?: string;
  /** …or to this vacancy. */
  vacancyId?: string;
  /** Show which candidate/vacancy each task belongs to. */
  showContext?: boolean;
  showFilters?: boolean;
}) {
  const [showDone, setShowDone] = useState(!showFilters);
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [statusOverrides, setStatusOverrides] = useState<Record<string, "OPEN" | "DONE">>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const visible = useMemo(
    () =>
      tasks
        .map((t) => (statusOverrides[t.id] ? { ...t, status: statusOverrides[t.id] } : t))
        .filter((t) => {
          if (!showDone && t.status === "DONE") return false;
          if (assigneeFilter === "ME") return t.assigneeId === currentUserId;
          if (assigneeFilter === "NONE") return !t.assigneeId;
          if (assigneeFilter) return t.assigneeId === assigneeFilter;
          return true;
        }),
    [tasks, statusOverrides, showDone, assigneeFilter, currentUserId]
  );

  function handleAdd(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createRecruitmentTask(undefined, formData);
      if (result?.error) setError(result.error);
      else formRef.current?.reset();
    });
  }

  function toggle(task: TaskRow & { status: "OPEN" | "DONE" }) {
    const next = task.status === "OPEN" ? "DONE" : "OPEN";
    setStatusOverrides((prev) => ({ ...prev, [task.id]: next }));
    startTransition(() => {
      setRecruitmentTaskStatus(task.id, next);
    });
  }

  function remove(taskId: string) {
    if (!confirm("Delete this task?")) return;
    startTransition(() => {
      deleteRecruitmentTask(taskId);
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <form ref={formRef} action={handleAdd} className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
        {candidateId && <input type="hidden" name="candidateId" value={candidateId} />}
        {vacancyId && <input type="hidden" name="vacancyId" value={vacancyId} />}
        <input name="title" required placeholder="Add a task… e.g. Book interview with Sara" className={`${FIELD} min-w-48 flex-1`} />
        <input name="dueDate" type="date" className={`${FIELD} w-36`} />
        <select name="assigneeId" defaultValue={currentUserId} className={`${FIELD} w-40`}>
          <option value="">Unassigned</option>
          {team.map((m) => (
            <option key={m.id} value={m.id}>
              {m.id === currentUserId ? `${m.name} (me)` : m.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-1 rounded-lg bg-charcoal px-3 py-2 text-sm font-medium text-white transition hover:bg-gold hover:text-charcoal disabled:opacity-60"
        >
          <Plus size={14} />
          Add
        </button>
        {error && <p className="w-full text-xs text-red-600">{error}</p>}
      </form>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-3 py-2">
          <label className="flex items-center gap-2 text-sm text-slate-500">
            <input
              type="checkbox"
              checked={showDone}
              onChange={(e) => setShowDone(e.target.checked)}
              className="rounded border-slate-300"
            />
            Show completed
          </label>
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-gold"
          >
            <option value="">Everyone&apos;s tasks</option>
            <option value="ME">My tasks</option>
            <option value="NONE">Unassigned</option>
            {team
              .filter((m) => m.id !== currentUserId)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
          </select>
        </div>
      )}

      {visible.length === 0 ? (
        <p className="p-6 text-center text-sm text-slate-400">No tasks.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {visible.map((task) => {
            const due = task.dueDate ? startOfDay(task.dueDate) : null;
            const overdue = due && task.status === "OPEN" && isPast(due) && !isToday(due);
            return (
              <li key={task.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={task.status === "DONE"}
                  onChange={() => toggle(task)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <div className="min-w-48 flex-1">
                  <p className={`text-sm ${task.status === "DONE" ? "text-slate-400 line-through" : "text-slate-800"}`}>
                    {task.title}
                  </p>
                  {showContext && (task.candidate || task.vacancy) && (
                    <p className="text-[11px] text-slate-400">
                      {task.candidate && (
                        <Link href={`/recruitment/candidates/${task.candidate.id}`} className="hover:underline">
                          {task.candidate.name}
                        </Link>
                      )}
                      {task.candidate && task.vacancy && " · "}
                      {task.vacancy && (
                        <Link href={`/recruitment/vacancies/${task.vacancy.id}`} className="hover:underline">
                          {task.vacancy.title}
                        </Link>
                      )}
                    </p>
                  )}
                </div>
                <select
                  value={task.assigneeId ?? ""}
                  onChange={(e) => {
                    const assigneeId = e.target.value || null;
                    startTransition(() => {
                      updateRecruitmentTask(task.id, { assigneeId });
                    });
                  }}
                  className="w-36 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 outline-none focus:border-gold"
                >
                  <option value="">Unassigned</option>
                  {team.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  defaultValue={due ? format(due, "yyyy-MM-dd") : ""}
                  onChange={(e) => {
                    const dueDate = e.target.value || null;
                    startTransition(() => {
                      updateRecruitmentTask(task.id, { dueDate });
                    });
                  }}
                  className={`w-32 rounded-lg border px-2 py-1 text-xs outline-none focus:border-gold ${
                    overdue ? "border-red-200 bg-red-50 text-red-700" : "border-slate-200 text-slate-600"
                  }`}
                />
                <button onClick={() => remove(task.id)} title="Delete task" className="text-slate-400 transition hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
