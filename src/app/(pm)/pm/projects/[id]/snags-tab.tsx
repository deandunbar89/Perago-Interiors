"use client";

import { useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import type { Vendor } from "@prisma/client";
import { createSnag, closeSnag, deleteSnag } from "@/lib/actions/pm-snags";
import {
  SNAG_PRIORITIES,
  SNAG_PRIORITY_LABELS,
  SNAG_PRIORITY_COLORS,
  SNAG_CATEGORIES,
  SNAG_CATEGORY_LABELS,
  TRADES,
  TRADE_LABELS,
} from "@/lib/constants";
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

const selectClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold";

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
        capture="environment"
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

export default function SnagsTab({
  project,
  allVendors,
}: {
  project: PmProjectDetail;
  allVendors: Vendor[];
}) {
  const contractors = allVendors.filter((v) => v.type === "CONTRACTOR");
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

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <select name="priority" defaultValue="MEDIUM" className={selectClass}>
                {SNAG_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {SNAG_PRIORITY_LABELS[p]} priority
                  </option>
                ))}
              </select>
              <select name="category" defaultValue="SNAG" className={selectClass}>
                {SNAG_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {SNAG_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
              <select name="trade" defaultValue="" className={selectClass}>
                <option value="">No trade set</option>
                {TRADES.map((t) => (
                  <option key={t} value={t}>
                    {TRADE_LABELS[t]}
                  </option>
                ))}
              </select>
              <select name="vendorId" defaultValue="" className={selectClass}>
                <option value="">No contractor assigned</option>
                {contractors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <input
              name="location"
              placeholder="Location / area (e.g. Level 2, Room 204)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            />

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Photo</label>
              <input
                name="photo"
                type="file"
                accept="image/*"
                capture="environment"
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
            {openSnags.map((snag) => {
              const priorityColors = SNAG_PRIORITY_COLORS[snag.priority as keyof typeof SNAG_PRIORITY_COLORS];
              return (
                <li
                  key={snag.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <Photo documentId={snag.openPhotoId} alt="Snag" />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${priorityColors.bg} ${priorityColors.text}`}
                      >
                        {SNAG_PRIORITY_LABELS[snag.priority as keyof typeof SNAG_PRIORITY_LABELS]}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        {SNAG_CATEGORY_LABELS[snag.category as keyof typeof SNAG_CATEGORY_LABELS]}
                      </span>
                      {snag.trade && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          {TRADE_LABELS[snag.trade as keyof typeof TRADE_LABELS]}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-800">{snag.description}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {snag.location && <span>{snag.location} · </span>}
                      {snag.vendor && <span>{snag.vendor.name} · </span>}
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
              );
            })}
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
                    {snag.vendor && <span>{snag.vendor.name} · </span>}
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
