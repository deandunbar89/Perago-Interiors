"use client";

import { useRef, useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { Trash2 } from "lucide-react";
import { addDeadlineNote, deleteDeadlineNote } from "@/lib/actions/pm-deadlines";
import type { TaskNote, User } from "@prisma/client";

export default function DeadlineNotes({
  deadlineId,
  notes,
}: {
  deadlineId: string;
  notes: (TaskNote & { author: User | null })[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await addDeadlineNote(deadlineId, formData);
      if (result?.error) setError(result.error);
      else formRef.current?.reset();
    });
  }

  function handleDelete(noteId: string) {
    if (!confirm("Delete this note?")) return;
    startTransition(() => {
      deleteDeadlineNote(deadlineId, noteId);
    });
  }

  return (
    <div className="space-y-4">
      <form ref={formRef} action={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <textarea
          name="body"
          rows={3}
          required
          placeholder="Add a note about this deadline…"
          className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-charcoal px-4 py-1.5 text-sm font-medium text-white transition hover:bg-jet disabled:opacity-60"
          >
            {pending ? "Adding…" : "Add note"}
          </button>
        </div>
      </form>

      {notes.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">No notes yet.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500">
                  {note.author?.name || "Unknown"} ·{" "}
                  {formatDistanceToNow(note.createdAt, { addSuffix: true })}
                </p>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="text-slate-300 transition hover:text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <p className="whitespace-pre-wrap text-sm text-slate-700">{note.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
