"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Calendar, CheckCircle2, Circle, Flag, Pencil, Trash2 } from "lucide-react";
import {
  createTaskNote,
  deleteTask,
  deleteTaskNote,
  updateTaskDueDate,
  updateTaskNote,
  updateTaskStatus,
  updateTaskTitle,
} from "@/lib/actions/my-tasks";
import type { TaskDetail as TaskDetailRow } from "./types";

function toDateInputValue(date: Date | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export default function TaskDetail({ task }: { task: TaskDetailRow }) {
  const router = useRouter();
  const [status, setStatus] = useState(task.status);
  const [title, setTitle] = useState(task.title);
  const [dueDate, setDueDate] = useState(toDateInputValue(task.dueDate));
  const [pending, startTransition] = useTransition();

  const [noteError, setNoteError] = useState<string | null>(null);
  const noteFormRef = useRef<HTMLFormElement>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteBody, setEditNoteBody] = useState("");

  const project = task.scope === "PM" ? task.pmProject : task.project;
  const projectHref = project
    ? task.scope === "PM"
      ? `/pm/projects/${project.id}`
      : `/projects/${project.id}`
    : null;
  const deadlineHref = task.task
    ? task.scope === "PM"
      ? `/pm/deadlines/${task.task.id}`
      : `/deadlines/${task.task.id}`
    : null;

  function toggleStatus() {
    const next = status === "OPEN" ? "DONE" : "OPEN";
    setStatus(next);
    startTransition(() => {
      updateTaskStatus(task.id, next);
    });
  }

  function handleTitleBlur() {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitle(task.title);
      return;
    }
    if (trimmed === task.title) return;
    startTransition(() => {
      updateTaskTitle(task.id, trimmed);
    });
  }

  function handleDueDateChange(value: string) {
    setDueDate(value);
    startTransition(() => {
      updateTaskDueDate(task.id, value || null);
    });
  }

  function handleDelete() {
    if (!confirm(`Delete "${task.title}"?`)) return;
    startTransition(async () => {
      await deleteTask(task.id);
      router.push("/my-tasks");
    });
  }

  function handleAddNote(formData: FormData) {
    setNoteError(null);
    startTransition(async () => {
      const result = await createTaskNote(task.id, formData);
      if (result?.error) setNoteError(result.error);
      else noteFormRef.current?.reset();
    });
  }

  function startEditNote(noteId: string, body: string) {
    setEditingNoteId(noteId);
    setEditNoteBody(body);
  }

  function saveNote(noteId: string) {
    const trimmed = editNoteBody.trim();
    if (!trimmed) return;
    setEditingNoteId(null);
    startTransition(() => {
      updateTaskNote(task.id, noteId, trimmed);
    });
  }

  function removeNote(noteId: string) {
    if (!confirm("Delete this note?")) return;
    startTransition(() => {
      deleteTaskNote(task.id, noteId);
    });
  }

  return (
    <div>
      <Link
        href="/my-tasks"
        className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft size={15} />
        My Tasks
      </Link>

      <div className="mb-6">
        <div className="flex items-start gap-2.5">
          <button
            onClick={toggleStatus}
            disabled={pending}
            className="mt-1.5 shrink-0 text-slate-400 hover:text-slate-700"
          >
            {status === "DONE" ? <CheckCircle2 size={22} className="text-emerald-600" /> : <Circle size={22} />}
          </button>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            className={`w-full flex-1 rounded-lg border border-transparent bg-transparent px-1 -mx-1 text-2xl font-semibold outline-none transition focus:border-gold focus:bg-white focus:ring-1 focus:ring-gold ${
              status === "DONE" ? "text-slate-400 line-through" : "text-slate-900"
            }`}
          />
        </div>

        <div className="mt-2 ml-9 flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              task.scope === "PM" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"
            }`}
          >
            {task.scope}
          </span>
          {deadlineHref && (
            <Link href={deadlineHref} className="flex items-center gap-1 hover:text-slate-800">
              <Flag size={13} />
              {task.task?.title}
            </Link>
          )}
          {projectHref && project && (
            <Link href={projectHref} className="hover:text-slate-800">
              {project.title}
            </Link>
          )}
        </div>

        <div className="mt-4 ml-9 flex items-center gap-2">
          <label className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600">
            <Calendar size={15} className="text-slate-400" />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => handleDueDateChange(e.target.value)}
              className="outline-none"
            />
          </label>
          <button
            onClick={handleDelete}
            title="Delete task"
            className="flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Notes</h2>

        <form
          ref={noteFormRef}
          action={handleAddNote}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <textarea
            name="body"
            rows={3}
            required
            placeholder="Add a note about this task…"
            className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
          />
          {noteError && <p className="mt-2 text-sm text-red-600">{noteError}</p>}
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-charcoal px-4 py-1.5 text-sm font-medium text-white transition hover:bg-jet disabled:opacity-60"
            >
              Add note
            </button>
          </div>
        </form>

        {task.notes.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No notes yet.</p>
        ) : (
          <ul className="space-y-3">
            {task.notes.map((note) => (
              <li key={note.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-500">
                    {note.author?.name || "Unknown"} ·{" "}
                    {formatDistanceToNow(note.createdAt, { addSuffix: true })}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEditNote(note.id, note.body)}
                      className="text-slate-300 transition hover:text-slate-600"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => removeNote(note.id)}
                      className="text-slate-300 transition hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {editingNoteId === note.id ? (
                  <div className="space-y-2">
                    <textarea
                      autoFocus
                      rows={3}
                      value={editNoteBody}
                      onChange={(e) => setEditNoteBody(e.target.value)}
                      className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingNoteId(null)}
                        className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => saveNote(note.id)}
                        className="rounded-lg bg-charcoal px-4 py-1.5 text-sm font-medium text-white transition hover:bg-jet"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-sm text-slate-700">{note.body}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
