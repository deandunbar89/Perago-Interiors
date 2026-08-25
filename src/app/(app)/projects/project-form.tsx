"use client";

import { useActionState } from "react";
import type { Client, Project } from "@prisma/client";
import { createProject, updateProject } from "@/lib/actions/projects";
import {
  PROJECT_TYPES,
  PROJECT_TYPE_LABELS,
  TEMPERATURES,
  TEMPERATURE_LABELS,
} from "@/lib/constants";
import ClientPicker from "@/components/client-picker";

type ActionState = { error?: string; success?: boolean } | undefined;
type FormAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

function toDateInputValue(date: Date | null | undefined) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export default function ProjectForm({
  clients,
  project,
}: {
  clients: Client[];
  project?: Project;
}) {
  const action: FormAction = project
    ? (updateProject.bind(null, project.id) as FormAction)
    : (createProject as FormAction);

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
          placeholder="e.g. Riverside Office Tower — Fit-out Tender"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ClientPicker clients={clients} defaultClientId={project?.clientId} />
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Reference #</label>
          <input
            name="reference"
            defaultValue={project?.reference || ""}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Project type</label>
          <select
            name="projectType"
            defaultValue={project?.projectType || ""}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
          >
            <option value="">Select type…</option>
            {PROJECT_TYPES.map((t) => (
              <option key={t} value={t}>
                {PROJECT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Lead temperature</label>
          <select
            name="temperature"
            defaultValue={project?.temperature || ""}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
          >
            <option value="">Select…</option>
            {TEMPERATURES.map((t) => (
              <option key={t} value={t}>
                {TEMPERATURE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
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

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Location</label>
        <textarea
          name="location"
          rows={2}
          defaultValue={project?.location || ""}
          placeholder="Site address, area, access notes…"
          className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
        />
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <p className="mb-3 text-sm font-semibold text-slate-800">Project contact</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Contact name</label>
            <input
              name="contactName"
              defaultValue={project?.contactName || ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
            <input
              type="email"
              name="contactEmail"
              defaultValue={project?.contactEmail || ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Phone 1</label>
            <input
              name="contactPhone1"
              defaultValue={project?.contactPhone1 || ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Phone 2</label>
            <input
              name="contactPhone2"
              defaultValue={project?.contactPhone2 || ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Submission deadline</label>
          <input
            type="date"
            name="submissionDeadline"
            defaultValue={toDateInputValue(project?.submissionDeadline)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Site visit</label>
          <input
            type="date"
            name="siteVisitDate"
            defaultValue={toDateInputValue(project?.siteVisitDate)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Award date</label>
          <input
            type="date"
            name="awardDate"
            defaultValue={toDateInputValue(project?.awardDate)}
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
