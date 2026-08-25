"use client";

import { useRef, useState, useTransition } from "react";
import type { Project, Task } from "@prisma/client";
import { Plus } from "lucide-react";
import { createTask } from "@/lib/actions/tasks";

export default function QuickAddTask({
  projects,
  deadlines,
}: {
  projects: Project[];
  deadlines: Task[];
}) {
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
      <div className="grid grid-cols-3 gap-3">
        <input
          type="date"
          name="dueDate"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
        />
        <select
          name="deadlineId"
          defaultValue=""
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
        >
          <option value="">No linked deadline</option>
          {deadlines.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title}
            </option>
          ))}
        </select>
        <select
          name="projectId"
          defaultValue=""
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
        >
          <option value="">No linked project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
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
