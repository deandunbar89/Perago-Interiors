"use client";

import { useRef, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { createCommercialSection } from "@/lib/actions/crm-commercial";
import CommercialSectionCard from "./commercial-section-card";
import type { ProjectDetail } from "./types";

export default function CommercialTab({ project }: { project: ProjectDetail }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createCommercialSection(project.id, formData);
      if (result?.error) setError(result.error);
      else {
        formRef.current?.reset();
        setOpen(false);
      }
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Pricing documents for this tender — quotations, BOQs, comparisons and supplier quotes. Everything uploaded here
        also backs up to Google Drive.
      </p>

      {project.commercialSections.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-400">No sections yet — add one below.</p>
      )}

      {project.commercialSections.map((section) => (
        <CommercialSectionCard
          key={section.id}
          projectId={project.id}
          section={section}
          documents={section.documents}
        />
      ))}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-1.5 px-4 py-3 text-sm font-medium text-slate-700"
        >
          <Plus size={15} />
          Add section
        </button>
        {open && (
          <form ref={formRef} action={handleSubmit} className="space-y-3 border-t border-slate-100 p-4">
            <div className="grid grid-cols-2 gap-3">
              <input
                name="name"
                required
                placeholder="Section name"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
              />
              <select
                name="mode"
                defaultValue="MULTIPLE"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
              >
                <option value="MULTIPLE">Keep every file uploaded</option>
                <option value="SINGLE">New upload replaces the old one</option>
              </select>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-charcoal px-4 py-2 text-sm font-medium text-white transition hover:bg-gold hover:text-charcoal disabled:opacity-60"
            >
              {pending ? "Adding…" : "Add section"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
