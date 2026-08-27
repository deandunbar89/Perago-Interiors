"use client";

import { useRef, useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { closeSnag } from "@/lib/actions/pm-snags";

export function Photo({ documentId, alt }: { documentId: string; alt: string }) {
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

export function CloseSnagForm({ pmProjectId, snagId }: { pmProjectId: string; snagId: string }) {
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
