"use client";

import { useRef, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { createTask } from "@/lib/actions/my-tasks";

type Item = { id: string; title: string };

export default function QuickAddTask({ tenders, projects }: { tenders: Item[]; projects: Item[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createTask(undefined, formData);
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
        className="flex items-center gap-1.5 rounded-lg bg-charcoal px-3 py-1.5 text-sm font-medium text-white transition hover:bg-jet"
      >
        <Plus size={15} />
        New Task
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="mb-4 space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <input
        name="title"
        required
        autoFocus
        placeholder="What needs to be done?"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          type="date"
          name="dueDate"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
        />
        <select
          name="target"
          required
          defaultValue=""
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
        >
          <option value="" disabled>
            File under…
          </option>
          {tenders.length > 0 && (
            <optgroup label="Tenders (CRM)">
              {tenders.map((t) => (
                <option key={t.id} value={`crm:${t.id}`}>
                  {t.title}
                </option>
              ))}
            </optgroup>
          )}
          {projects.length > 0 && (
            <optgroup label="Projects (PM)">
              {projects.map((p) => (
                <option key={p.id} value={`pm:${p.id}`}>
                  {p.title}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-charcoal px-4 py-1.5 text-sm font-medium text-white transition hover:bg-jet disabled:opacity-60"
        >
          {pending ? "Adding…" : "Add task"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
