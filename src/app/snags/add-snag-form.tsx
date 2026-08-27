"use client";

import { useRef, useState, useTransition } from "react";
import type { Vendor } from "@prisma/client";
import { createSnag } from "@/lib/actions/pm-snags";
import {
  SNAG_PRIORITIES,
  SNAG_PRIORITY_LABELS,
  SNAG_CATEGORIES,
  SNAG_CATEGORY_LABELS,
  TRADES,
  TRADE_LABELS,
} from "@/lib/constants";

const fieldClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold";

export default function AddSnagForm({
  projects,
  vendors,
  onDone,
}: {
  projects: { id: string; title: string }[];
  vendors: Vendor[];
  onDone: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    const pmProjectId = formData.get("pmProjectId") as string;
    if (!pmProjectId) {
      setError("Choose a project");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createSnag(pmProjectId, formData);
      if (result?.error) setError(result.error);
      else {
        formRef.current?.reset();
        onDone();
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-3">
      <select name="pmProjectId" required defaultValue="" className={fieldClass}>
        <option value="" disabled>
          Choose project
        </option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
      </select>

      <textarea
        name="description"
        required
        rows={2}
        placeholder="Describe the snag"
        className={fieldClass}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <select name="priority" defaultValue="MEDIUM" className={fieldClass}>
          {SNAG_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {SNAG_PRIORITY_LABELS[p]} priority
            </option>
          ))}
        </select>
        <select name="category" defaultValue="SNAG" className={fieldClass}>
          {SNAG_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {SNAG_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <select name="trade" defaultValue="" className={fieldClass}>
          <option value="">No trade set</option>
          {TRADES.map((t) => (
            <option key={t} value={t}>
              {TRADE_LABELS[t]}
            </option>
          ))}
        </select>
        <select name="vendorId" defaultValue="" className={fieldClass}>
          <option value="">No contractor assigned</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </div>

      <input
        name="location"
        placeholder="Location / area (e.g. Level 2, Room 204)"
        className={fieldClass}
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
        className="w-full rounded-lg bg-charcoal px-4 py-2 text-sm font-medium text-white transition hover:bg-jet disabled:opacity-60"
      >
        {pending ? "Raising…" : "Raise snag"}
      </button>
    </form>
  );
}
