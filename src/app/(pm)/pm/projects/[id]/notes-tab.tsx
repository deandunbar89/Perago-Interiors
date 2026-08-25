"use client";

import { useRef, useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { Trash2 } from "lucide-react";
import { createPmNote, deletePmNote, updatePmNote } from "@/lib/actions/pm-notes";
import Modal from "@/components/modal";
import type { PmProjectDetail } from "./types";

type NoteItem = PmProjectDetail["notes"][number];

export default function NotesTab({ project }: { project: PmProjectDetail }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const [openNote, setOpenNote] = useState<NoteItem | null>(null);
  const [editBody, setEditBody] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createPmNote(project.id, formData);
      if (result?.error) setError(result.error);
      else formRef.current?.reset();
    });
  }

  function openNoteModal(note: NoteItem) {
    setOpenNote(note);
    setEditBody(note.body);
    setModalError(null);
  }

  function saveNote() {
    if (!openNote) return;
    setModalError(null);
    startTransition(async () => {
      const result = await updatePmNote(project.id, openNote.id, editBody);
      if (result?.error) setModalError(result.error);
      else setOpenNote(null);
    });
  }

  function deleteNote() {
    if (!openNote) return;
    if (!confirm("Delete this note?")) return;
    startTransition(() => {
      deletePmNote(project.id, openNote.id);
    });
    setOpenNote(null);
  }

  return (
    <div className="space-y-6">
      <form ref={formRef} action={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <textarea
          name="body"
          rows={3}
          required
          placeholder="Add a note about this project…"
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

      {project.notes.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">No notes yet.</p>
      ) : (
        <ul className="space-y-3">
          {project.notes.map((note) => (
            <li key={note.id}>
              <button
                type="button"
                onClick={() => openNoteModal(note)}
                className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-gold hover:shadow-md"
              >
                <p className="mb-1.5 text-xs font-medium text-slate-500">
                  {note.author?.name || "Unknown"} ·{" "}
                  {formatDistanceToNow(note.createdAt, { addSuffix: true })}
                </p>
                <p className="line-clamp-3 whitespace-pre-wrap text-sm text-slate-700">{note.body}</p>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal open={openNote !== null} onClose={() => setOpenNote(null)} title="Note">
        {openNote && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              {openNote.author?.name || "Unknown"} ·{" "}
              {formatDistanceToNow(openNote.createdAt, { addSuffix: true })}
            </p>
            <textarea
              autoFocus
              rows={6}
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            />
            {modalError && <p className="text-sm text-red-600">{modalError}</p>}
            <div className="flex items-center justify-between">
              <button
                onClick={deleteNote}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                <Trash2 size={14} />
                Delete
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setOpenNote(null)}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={saveNote}
                  disabled={pending}
                  className="rounded-lg bg-charcoal px-4 py-1.5 text-sm font-medium text-white transition hover:bg-jet disabled:opacity-60"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
