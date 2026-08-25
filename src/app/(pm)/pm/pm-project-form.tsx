"use client";

import { useActionState } from "react";
import type { Client, PmProject } from "@prisma/client";
import { createPmProject, updatePmProject } from "@/lib/actions/pm-projects";
import ClientPicker from "@/components/client-picker";

type ActionState = { error?: string; success?: boolean } | undefined;
type FormAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

function toDateInputValue(date: Date | null | undefined) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export default function PmProjectForm({
  clients,
  project,
}: {
  clients: Client[];
  project?: PmProject;
}) {
  const action: FormAction = project
    ? (updatePmProject.bind(null, project.id) as FormAction)
    : (createPmProject as FormAction);

  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Project title *</label>
        <input
          name="title"
          required
          defaultValue={project?.title}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ClientPicker clients={clients} defaultClientId={project?.clientId} />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Value</label>
            <input
              type="number"
              step="0.01"
              name="value"
              defaultValue={project?.value ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Currency</label>
            <input
              name="currency"
              defaultValue={project?.currency || "AED"}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Location</label>
        <textarea
          name="location"
          rows={2}
          defaultValue={project?.location || ""}
          className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Start date</label>
          <input
            type="date"
            name="startDate"
            defaultValue={toDateInputValue(project?.startDate)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Target completion</label>
          <input
            type="date"
            name="targetEndDate"
            defaultValue={toDateInputValue(project?.targetEndDate)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
        <textarea
          name="description"
          rows={4}
          defaultValue={project?.description || ""}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
        />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}
      {state?.success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-600">Saved.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-charcoal px-4 py-2 text-sm font-medium text-white transition hover:bg-jet disabled:opacity-60"
      >
        {pending ? "Saving…" : project ? "Save changes" : "Create project"}
      </button>
    </form>
  );
}
