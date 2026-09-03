"use client";

import { useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { Plus, Trash2, Pencil } from "lucide-react";
import { createReportEntry, updateReportEntry, deleteReportEntry } from "@/lib/actions/pm-report";
import {
  REPORT_SECTIONS,
  REPORT_SECTION_LABELS,
  REPORT_PERIOD_TYPES,
  REPORT_PERIOD_TYPE_LABELS,
  type ReportSection,
} from "@/lib/constants";
import type { PmProjectDetail } from "./types";

const fieldClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold";

function periodLabel(periodType: string, periodStart: Date) {
  return periodType === "MONTHLY" ? format(periodStart, "MMMM yyyy") : `Week of ${format(periodStart, "MMM d, yyyy")}`;
}

function AddEntryForm({ pmProjectId, section, onDone }: { pmProjectId: string; section: ReportSection; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    formData.set("section", section);
    setError(null);
    startTransition(async () => {
      const result = await createReportEntry(pmProjectId, formData);
      if (result?.error) setError(result.error);
      else {
        formRef.current?.reset();
        onDone();
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-3 border-t border-slate-100 p-4">
      <div className="grid grid-cols-2 gap-3">
        <select name="periodType" defaultValue="WEEKLY" className={fieldClass}>
          {REPORT_PERIOD_TYPES.map((p) => (
            <option key={p} value={p}>
              {REPORT_PERIOD_TYPE_LABELS[p]}
            </option>
          ))}
        </select>
        <input name="periodStart" type="date" required className={fieldClass} />
      </div>
      <textarea
        name="content"
        required
        rows={4}
        placeholder="What happened this period…"
        className={fieldClass}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-charcoal px-4 py-2 text-sm font-medium text-white transition hover:bg-jet disabled:opacity-60"
      >
        {pending ? "Saving…" : "Add entry"}
      </button>
    </form>
  );
}

function EntryCard({ entry }: { entry: PmProjectDetail["reportEntries"][number] }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateReportEntry(entry.id, formData);
      if (result?.error) setError(result.error);
      else setEditing(false);
    });
  }

  function handleDelete() {
    if (!confirm("Delete this entry?")) return;
    startTransition(() => {
      deleteReportEntry(entry.id);
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-800">{periodLabel(entry.periodType, entry.periodStart)}</p>
          <p className="text-xs text-slate-400">
            {entry.createdBy?.name ?? "Unknown"} · {format(entry.createdAt, "MMM d, yyyy")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => setEditing((v) => !v)}
            className="flex items-center justify-center rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center justify-center rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {editing ? (
        <form ref={formRef} action={handleSubmit} className="space-y-2">
          <textarea name="content" defaultValue={entry.content} rows={4} className={fieldClass} />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-charcoal px-3 py-1.5 text-xs font-medium text-white transition hover:bg-jet disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <p className="whitespace-pre-wrap text-sm text-slate-700">{entry.content}</p>
      )}
    </div>
  );
}

export default function ReportTab({ project }: { project: PmProjectDetail }) {
  const [section, setSection] = useState<ReportSection>("SITE_PROGRESS");
  const [addOpen, setAddOpen] = useState(false);

  const entries = project.reportEntries
    .filter((e) => e.section === section)
    .sort((a, b) => b.periodStart.getTime() - a.periodStart.getTime());

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {REPORT_SECTIONS.map((s) => (
          <button
            key={s}
            onClick={() => {
              setSection(s);
              setAddOpen(false);
            }}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
              section === s
                ? "border-charcoal bg-charcoal text-white"
                : "border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            {REPORT_SECTION_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <button
          onClick={() => setAddOpen((v) => !v)}
          className="flex w-full items-center gap-1.5 px-4 py-3 text-sm font-medium text-slate-700"
        >
          <Plus size={15} />
          Add {REPORT_SECTION_LABELS[section].toLowerCase()} entry
        </button>
        {addOpen && (
          <AddEntryForm pmProjectId={project.id} section={section} onDone={() => setAddOpen(false)} />
        )}
      </div>

      {entries.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">No entries yet for this section.</p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
