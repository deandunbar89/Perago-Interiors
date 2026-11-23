"use client";

import { useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { addCandidateNote, deleteCandidateNote, updateCandidateNote } from "@/lib/actions/recruitment";
import Modal from "@/components/modal";

const TYPES = [
  { value: "CALL", label: "Call", className: "bg-sky-50 text-sky-700" },
  { value: "INTERVIEW", label: "Interview", className: "bg-violet-50 text-violet-700" },
  { value: "STATUS", label: "Status", className: "bg-amber-50 text-amber-700" },
  { value: "GENERAL", label: "Note", className: "bg-slate-100 text-slate-600" },
] as const;

export type CandidateNoteItem = {
  id: string;
  type: string;
  body: string;
  createdAt: Date;
  author: { name: string } | null;
};

function TypeBadge({ type }: { type: string }) {
  const t = TYPES.find((x) => x.value === type) ?? TYPES[3];
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${t.className}`}>{t.label}</span>;
}

function TypePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {TYPES.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
            value === t.value ? "border-charcoal bg-charcoal text-white" : "border-slate-300 text-slate-600 hover:border-slate-400"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export default function NotesSection({ candidateId, notes }: { candidateId: string; notes: CandidateNoteItem[] }) {
  const [type, setType] = useState("CALL");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const [open, setOpen] = useState<CandidateNoteItem | null>(null);
  const [editBody, setEditBody] = useState("");
  const [editType, setEditType] = useState("GENERAL");
  const [modalError, setModalError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("type", type);
    startTransition(async () => {
      const result = await addCandidateNote(candidateId, formData);
      if (result?.error) setError(result.error);
      else formRef.current?.reset();
    });
  }

  function openNote(note: CandidateNoteItem) {
    setOpen(note);
    setEditBody(note.body);
    setEditType(note.type);
    setModalError(null);
  }

  function save() {
    if (!open) return;
    startTransition(async () => {
      const result = await updateCandidateNote(open.id, editBody, editType);
      if (result?.error) setModalError(result.error);
      else setOpen(null);
    });
  }

  function remove() {
    if (!open || !confirm("Delete this note?")) return;
    const id = open.id;
    setOpen(null);
    startTransition(() => deleteCandidateNote(id));
  }

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Notes</h2>

      <form ref={formRef} action={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <TypePicker value={type} onChange={setType} />
        <textarea
          name="body"
          rows={3}
          required
          placeholder="Called, no answer · Spoke for 10 mins, available in 30 days · Interview notes…"
          className="mt-3 w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-charcoal px-4 py-1.5 text-sm font-medium text-white transition hover:bg-gold hover:text-charcoal disabled:opacity-60"
          >
            {pending ? "Adding…" : "Add note"}
          </button>
        </div>
      </form>

      {notes.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">No notes yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {notes.map((note) => (
            <li key={note.id}>
              <button
                type="button"
                onClick={() => openNote(note)}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-gold"
              >
                <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
                  <TypeBadge type={note.type} />
                  <span>
                    {note.author?.name || "Unknown"} · {format(note.createdAt, "d MMM yyyy, HH:mm")}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-slate-700">{note.body}</p>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal open={open !== null} onClose={() => setOpen(null)} title="Note">
        {open && (
          <div className="space-y-3">
            <TypePicker value={editType} onChange={setEditType} />
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
                onClick={remove}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                <Trash2 size={14} />
                Delete
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setOpen(null)}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  disabled={pending}
                  className="rounded-lg bg-charcoal px-4 py-1.5 text-sm font-medium text-white transition hover:bg-gold hover:text-charcoal disabled:opacity-60"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
