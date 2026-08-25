"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Flag } from "lucide-react";
import { BUCKETS, BUCKET_LABELS, DROPPABLE_BUCKETS, getBucket, bucketToDate, type Bucket } from "@/lib/date-ranges";
import { updateTaskDueDate } from "@/lib/actions/tasks";
import type { TaskRow } from "./types";

export default function KanbanView({ tasks }: { tasks: TaskRow[] }) {
  const [overrides, setOverrides] = useState<Record<string, Date | null>>({});
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverBucket, setDragOverBucket] = useState<Bucket | null>(null);
  const [, startTransition] = useTransition();

  // Derived fresh from props each render so newly created/deleted tasks show up without a
  // full reload; overrides only cover the brief optimistic window right after a drop.
  const items = useMemo(
    () => tasks.map((t) => (t.id in overrides ? { ...t, dueDate: overrides[t.id] } : t)),
    [tasks, overrides]
  );

  const columns = useMemo(() => {
    const map = Object.fromEntries(BUCKETS.map((b) => [b, [] as TaskRow[]])) as Record<Bucket, TaskRow[]>;
    for (const item of items) map[getBucket(item)].push(item);
    return map;
  }, [items]);

  function handleDrop(bucket: Bucket) {
    setDragOverBucket(null);
    if (!dragId || !DROPPABLE_BUCKETS.includes(bucket)) {
      setDragId(null);
      return;
    }
    const item = items.find((t) => t.id === dragId);
    if (!item || getBucket(item) === bucket) {
      setDragId(null);
      return;
    }

    const newDate = bucketToDate(bucket);
    setOverrides((prev) => ({ ...prev, [dragId]: newDate }));
    startTransition(() => {
      updateTaskDueDate(dragId, newDate ? newDate.toISOString() : null);
    });
    setDragId(null);
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {BUCKETS.map((bucket) => {
        const droppable = DROPPABLE_BUCKETS.includes(bucket);
        return (
          <div
            key={bucket}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverBucket(bucket);
            }}
            onDragLeave={() => setDragOverBucket((b) => (b === bucket ? null : b))}
            onDrop={() => handleDrop(bucket)}
            className={`flex min-h-[220px] w-72 shrink-0 flex-col rounded-xl border p-2 transition ${
              dragOverBucket === bucket
                ? droppable
                  ? "border-slate-400 bg-slate-100"
                  : "border-red-200 bg-red-50"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="mb-2 flex items-center justify-between px-1.5 pt-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                {BUCKET_LABELS[bucket]}
              </span>
              <span className="text-xs font-medium text-slate-400">{columns[bucket].length}</span>
            </div>

            <div className="flex flex-1 flex-col gap-2">
              {columns[bucket].map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => setDragId(task.id)}
                  className={`cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md active:cursor-grabbing ${
                    task.status === "DONE" ? "opacity-60" : ""
                  }`}
                >
                  <p
                    className={`mb-1.5 line-clamp-2 text-sm font-medium ${
                      task.status === "DONE" ? "text-slate-400 line-through" : "text-slate-900"
                    }`}
                  >
                    {task.title}
                  </p>
                  {(task.task || task.project) && (
                    <div className="mb-1.5 space-y-0.5 text-xs text-slate-500">
                      {task.task && (
                        <Link
                          href={`/deadlines/${task.task.id}`}
                          className="flex items-center gap-1 hover:underline"
                        >
                          <Flag size={10} />
                          <span className="truncate">{task.task.title}</span>
                        </Link>
                      )}
                      {task.project && (
                        <Link href={`/projects/${task.project.id}`} className="block truncate hover:underline">
                          {task.project.title}
                        </Link>
                      )}
                    </div>
                  )}
                  {task.dueDate && (
                    <span className="text-xs text-slate-400">{format(task.dueDate, "MMM d")}</span>
                  )}
                </div>
              ))}
              {columns[bucket].length === 0 && (
                <p className="px-1.5 py-6 text-center text-xs text-slate-400">
                  {droppable ? "Drop here" : "None"}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
