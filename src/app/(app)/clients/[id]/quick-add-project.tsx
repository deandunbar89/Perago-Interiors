"use client";

import { useRef, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { quickCreateProjectForClient } from "@/lib/actions/projects";

export default function QuickAddProject({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await quickCreateProjectForClient(clientId, formData);
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
        className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
      >
        <Plus size={15} />
        New project for this client
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="space-y-2.5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <input
        name="title"
        required
        autoFocus
        placeholder="Project title"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
      />
      <div className="grid grid-cols-2 gap-2.5">
        <input
          type="number"
          step="0.01"
          name="value"
          placeholder="Value"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
        />
        <input
          type="date"
          name="submissionDeadline"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-charcoal px-4 py-1.5 text-sm font-medium text-white transition hover:bg-jet disabled:opacity-60"
        >
          {pending ? "Adding…" : "Add project"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
        >
          Cancel
        </button>
      </div>
      <p className="text-xs text-slate-400">
        You can add more detail (type, contacts, drawings…) from the project page after.
      </p>
    </form>
  );
}
