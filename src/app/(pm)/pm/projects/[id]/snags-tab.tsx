"use client";

import { useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import { createSnag, closeSnag, deleteSnag } from "@/lib/actions/pm-snags";
import type { PmProjectDetail } from "./types";

function Photo({ documentId, alt }: { documentId: string; alt: string }) {
  return (
    <a href={`/api/pm-files/${documentId}`} target="_blank" rel="noopener noreferrer" className="shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element -- auth-gated, variable-size photo served from our API route */}
      <img
        src={`/api/pm-files/${documentId}`}
        alt={alt}
        className="h-16 w-16 rounded-lg border border-slate-200 object-cover"
      />
    </a>
  );
}

function CloseSnagForm({ pmProjectId, snagId }: { pmProjectId: string; snagId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await closeSnag(pmProjectId, snagId, formData);
      if (result?.error) setError(result.error);
      else {
        formRef.current?.reset();
        setOpen(false);
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
      >
        <CheckCircle2 size={14} />
        Close snag
      </button>
    );
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-2 rounded-lg bg-slate-50 p-3">
      <label className="block text-xs font-medium text-slate-600">Photo of the closed snag</label>
      <input
        name="photo"
        type="file"
        accept="image/*"
        required
        className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-charcoal file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-charcoal px-3 py-1.5 text-xs font-medium text-white transition hover:bg-jet disabled:opacity-60"
        >
          {pending ? "Closing…" : "Confirm close"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function SnagsTab({ project }: { project: PmProjectDetail }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createSnag(project.id, formData);
      if (result?.error) setError(result.error);
      else {
        formRef.current?.reset();
        setOpen(false);
      }
    });
  }

  function handleDelete(snagId: string) {
    if (!confirm("Delete this snag?")) return;
    startTransition(() => {
      deleteSnag(project.id, snagId);
    });
  }

  const openSnags = project.snags.filter((s) => s.status === "OPEN");
  const closedSnags = project.snags.filter((s) => s.status === "CLOSED");

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-1.5 px-4 py-3 text-sm font-medium text-slate-700"
        >
          <Plus size={15} />
          Raise snag
        </button>
        {open && (
          <form ref={formRef} action={handleSubmit} className="space-y-3 border-t border-slate-100 p-4">
            <textarea
              name="description"
              required
              rows={2}
              placeholder="Describe the snag"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            />
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Photo</label>
              <input
                name="photo"
                type="file"
                accept="image/*"
                required
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-charcoal file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-charcoal px-4 py-2 text-sm font-medium text-white transition hover:bg-jet disabled:opacity-60"
            >
              {pending ? "Raising…" : "Raise snag"}
            </button>
          </form>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Open ({openSnags.length})</h3>
        {openSnags.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">No open snags.</p>
        ) : (
          <ul className="space-y-3">
            {openSnags.map((snag) => (
              <li
                key={snag.id}
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <Photo documentId={snag.openPhotoId} alt="Snag" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-800">{snag.description}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Raised {format(snag.createdAt, "MMM d, yyyy")}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <CloseSnagForm pmProjectId={project.id} snagId={snag.id} />
                    <button
                      onClick={() => handleDelete(snag.id)}
                      className="flex items-center justify-center rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Closed ({closedSnags.length})</h3>
        {closedSnags.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">No closed snags yet.</p>
        ) : (
          <ul className="space-y-3">
            {closedSnags.map((snag) => (
              <li
                key={snag.id}
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <Photo documentId={snag.openPhotoId} alt="Snag before" />
                {snag.closedPhotoId && <Photo documentId={snag.closedPhotoId} alt="Snag after" />}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-600 line-through decoration-slate-300">
                    {snag.description}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Closed {snag.closedAt ? format(snag.closedAt, "MMM d, yyyy") : ""}
                  </p>
                  <button
                    onClick={() => handleDelete(snag.id)}
                    className="mt-2 flex items-center justify-center rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
