"use client";

import { useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { ArrowDownLeft, ArrowUpRight, Trash2 } from "lucide-react";
import { createEmailLog, deleteEmailLog } from "@/lib/actions/emails";
import type { ProjectDetail } from "./types";

function nowLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function EmailsTab({ project }: { project: ProjectDetail }) {
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createEmailLog(project.id, formData);
      if (result?.error) setError(result.error);
      else {
        formRef.current?.reset();
        setOpen(false);
      }
    });
  }

  function handleDelete(emailId: string) {
    if (!confirm("Delete this logged email?")) return;
    startTransition(() => {
      deleteEmailLog(project.id, emailId);
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-700"
        >
          Log an email
          <span className="text-slate-400">{open ? "−" : "+"}</span>
        </button>
        {open && (
          <form ref={formRef} action={handleSubmit} className="space-y-3 border-t border-slate-100 p-4">
            <input
              name="subject"
              required
              placeholder="Subject"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                name="fromAddr"
                required
                placeholder="From"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
              />
              <input
                name="toAddr"
                required
                placeholder="To"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select
                name="direction"
                defaultValue="outgoing"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
              >
                <option value="outgoing">Outgoing</option>
                <option value="incoming">Incoming</option>
              </select>
              <input
                type="datetime-local"
                name="sentAt"
                defaultValue={nowLocal()}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
              />
            </div>
            <textarea
              name="body"
              rows={4}
              placeholder="Email body / summary (optional)"
              className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-charcoal px-4 py-1.5 text-sm font-medium text-white transition hover:bg-jet disabled:opacity-60"
              >
                {pending ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        )}
      </div>

      {project.emailLogs.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">No emails logged yet.</p>
      ) : (
        <ul className="space-y-3">
          {project.emailLogs.map((email) => (
            <li key={email.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-1.5 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  {email.direction === "incoming" ? (
                    <ArrowDownLeft size={15} className="mt-0.5 shrink-0 text-blue-500" />
                  ) : (
                    <ArrowUpRight size={15} className="mt-0.5 shrink-0 text-emerald-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-800">{email.subject}</p>
                    <p className="text-xs text-slate-500">
                      {email.fromAddr} → {email.toAddr}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-slate-400">
                    {format(email.sentAt, "MMM d, yyyy HH:mm")}
                  </span>
                  <button
                    onClick={() => handleDelete(email.id)}
                    className="text-slate-300 transition hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {email.body && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{email.body}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
