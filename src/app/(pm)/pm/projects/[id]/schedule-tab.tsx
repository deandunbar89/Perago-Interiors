"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  createScheduleItem,
  deleteScheduleItem,
  updateScheduleItem,
  updateScheduleItemProgress,
} from "@/lib/actions/schedule";
import ScheduleGantt from "./schedule-gantt";
import type { PmProjectDetail } from "./types";

type StatusValue = "NOT_STARTED" | "IN_PROGRESS" | "DONE";

const STATUS_LABELS: Record<StatusValue, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

function toDateInputValue(date: Date) {
  return new Date(date).toISOString().slice(0, 10);
}

export default function ScheduleTab({ project }: { project: PmProjectDetail }) {
  const [statusOverrides, setStatusOverrides] = useState<Record<string, StatusValue>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const addFormRef = useRef<HTMLFormElement>(null);

  const items = useMemo(
    () =>
      project.scheduleItems.map((i) =>
        statusOverrides[i.id]
          ? { ...i, status: statusOverrides[i.id], percentComplete: statusOverrides[i.id] === "DONE" ? 100 : statusOverrides[i.id] === "NOT_STARTED" ? 0 : i.percentComplete }
          : i
      ),
    [project.scheduleItems, statusOverrides]
  );

  function handleAdd(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createScheduleItem(project.id, formData);
      if (result?.error) setError(result.error);
      else {
        addFormRef.current?.reset();
        setAdding(false);
      }
    });
  }

  function handleEdit(itemId: string, formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateScheduleItem(project.id, itemId, formData);
      if (result?.error) setError(result.error);
      else setEditingId(null);
    });
  }

  function handleStatusChange(itemId: string, status: StatusValue) {
    setStatusOverrides((prev) => ({ ...prev, [itemId]: status }));
    startTransition(() => {
      updateScheduleItemProgress(project.id, itemId, status);
    });
  }

  function handleDelete(itemId: string) {
    if (!confirm("Delete this schedule item?")) return;
    startTransition(() => {
      deleteScheduleItem(project.id, itemId);
    });
  }

  return (
    <div className="space-y-6">
      <ScheduleGantt items={items} />

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
          <h3 className="text-sm font-semibold text-slate-900">Schedule items</h3>
          <button
            onClick={() => setAdding((v) => !v)}
            className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            <Plus size={14} />
            Add item
          </button>
        </div>

        {adding && (
          <form ref={addFormRef} action={handleAdd} className="space-y-2.5 border-b border-slate-100 p-4">
            <input
              name="title"
              required
              autoFocus
              placeholder="e.g. Demolition & strip-out"
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            />
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="date"
                name="startDate"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
              />
              <input
                type="date"
                name="endDate"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-charcoal px-4 py-1.5 text-sm font-medium text-white transition hover:bg-jet disabled:opacity-60"
            >
              {pending ? "Adding…" : "Add"}
            </button>
          </form>
        )}

        {items.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-400">No schedule items yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((item) =>
              editingId === item.id ? (
                <li key={item.id} className="p-4">
                  <form
                    action={(fd) => handleEdit(item.id, fd)}
                    className="space-y-2.5"
                  >
                    <input
                      name="title"
                      required
                      defaultValue={item.title}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                    />
                    <div className="grid grid-cols-4 gap-2.5">
                      <input
                        type="date"
                        name="startDate"
                        required
                        defaultValue={toDateInputValue(item.startDate)}
                        className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                      />
                      <input
                        type="date"
                        name="endDate"
                        required
                        defaultValue={toDateInputValue(item.endDate)}
                        className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                      />
                      <select
                        name="status"
                        defaultValue={item.status}
                        className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                      >
                        {(Object.keys(STATUS_LABELS) as StatusValue[]).map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        name="percentComplete"
                        min={0}
                        max={100}
                        defaultValue={item.percentComplete}
                        className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                      />
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={pending}
                        className="rounded-lg bg-charcoal px-4 py-1.5 text-sm font-medium text-white transition hover:bg-jet disabled:opacity-60"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </li>
              ) : (
                <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800">{item.title}</p>
                    <p className="text-xs text-slate-400">
                      {format(item.startDate, "MMM d")} – {format(item.endDate, "MMM d, yyyy")} ·{" "}
                      {item.percentComplete}%
                    </p>
                  </div>
                  <select
                    value={item.status}
                    onChange={(e) => handleStatusChange(item.id, e.target.value as StatusValue)}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 outline-none"
                  >
                    {(Object.keys(STATUS_LABELS) as StatusValue[]).map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setEditingId(item.id)}
                    className="text-slate-300 transition hover:text-slate-600"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-slate-300 transition hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              )
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
