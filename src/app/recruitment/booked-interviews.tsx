"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import WhatsAppButton from "@/components/whatsapp-button";
import { rescheduleInterview, setCandidateVacancy, updateCandidateQuick } from "@/lib/actions/recruitment";

export type BookedInterviewRow = {
  id: string;
  candidateId: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  vacancyId: string;
  vacancyTitle: string;
  date: string; // YYYY-MM-DD, Dubai
  time: string; // HH:mm, Dubai
  dateLabel: string;
  timeLabel: string;
};

type Range = "all" | "today" | "7" | "30";

function addDays(ymd: string, n: number) {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** A cell that turns into an input when clicked; Enter / leaving the box saves, Esc cancels. */
function EditableCell({
  value,
  display,
  type = "text",
  onSave,
  className = "",
}: {
  value: string;
  display: React.ReactNode;
  type?: "text" | "tel" | "date" | "time";
  onSave: (v: string) => Promise<unknown>;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [pending, start] = useTransition();

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
        title="Click to edit"
        className={`w-full rounded px-1 py-0.5 text-left transition hover:bg-gold/15 ${pending ? "opacity-50" : ""} ${className}`}
      >
        {display}
      </button>
    );
  }

  const commit = () => {
    setEditing(false);
    if (draft === value) return;
    start(async () => {
      await onSave(draft);
    });
  };

  return (
    <input
      autoFocus
      type={type}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") setEditing(false);
      }}
      className="w-full rounded border border-gold px-1.5 py-0.5 text-sm outline-none"
    />
  );
}

export default function BookedInterviews({
  rows,
  vacancies,
  today,
}: {
  rows: BookedInterviewRow[];
  vacancies: { id: string; title: string }[];
  today: string;
}) {
  const [q, setQ] = useState("");
  const [vacancy, setVacancy] = useState("");
  const [range, setRange] = useState<Range>("all");
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const until = range === "today" ? today : range === "7" ? addDays(today, 7) : range === "30" ? addDays(today, 30) : null;
    return rows.filter(
      (r) =>
        (!term || r.name.toLowerCase().includes(term) || (r.phone ?? "").replace(/\s+/g, "").includes(term.replace(/\s+/g, ""))) &&
        (!vacancy || r.vacancyId === vacancy) &&
        (!until || r.date <= until)
    );
  }, [rows, q, vacancy, range, today]);

  const report = (res: unknown) => {
    if (res && typeof res === "object" && "error" in res && (res as { error?: string }).error) setError((res as { error: string }).error);
    else setError(null);
  };

  return (
    <div className="mb-8">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="mr-auto text-xs font-semibold uppercase tracking-wide text-slate-500">
          Booked interviews ({filtered.length}
          {filtered.length !== rows.length ? ` of ${rows.length}` : ""})
        </h2>
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or number…"
            className="w-52 rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-2 text-sm outline-none focus:border-gold"
          />
        </div>
        <select
          value={vacancy}
          onChange={(e) => setVacancy(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-gold"
        >
          <option value="">All positions</option>
          {vacancies.map((v) => (
            <option key={v.id} value={v.id}>
              {v.title}
            </option>
          ))}
        </select>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as Range)}
          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-gold"
        >
          <option value="all">All upcoming</option>
          <option value="today">Today</option>
          <option value="7">Next 7 days</option>
          <option value="30">Next 30 days</option>
        </select>
      </div>
      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-400">No interviews match.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Candidate</th>
                <th className="px-4 py-2.5 font-semibold">Position</th>
                <th className="px-4 py-2.5 font-semibold">Interview date</th>
                <th className="px-4 py-2.5 font-semibold">Time</th>
                <th className="px-4 py-2.5 font-semibold">Contact number</th>
                <th className="px-4 py-2.5 font-semibold">WhatsApp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr key={r.id} className={r.date === today ? "bg-gold/5" : undefined}>
                  <td className="min-w-40 px-3 py-2">
                    <div className="flex items-center gap-1">
                      <EditableCell
                        value={r.name}
                        display={<span className="font-medium text-slate-900">{r.name}</span>}
                        onSave={async (v) => report(await updateCandidateQuick(r.candidateId, { name: v }))}
                      />
                      <Link
                        href={`/recruitment/candidates/${r.candidateId}`}
                        className="shrink-0 text-[11px] text-slate-400 hover:text-slate-800 hover:underline"
                      >
                        Open
                      </Link>
                    </div>
                  </td>
                  <td className="min-w-44 px-3 py-2">
                    <select
                      value={r.vacancyId}
                      onChange={(e) => start(async () => setCandidateVacancy(r.candidateId, e.target.value))}
                      className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-slate-700 outline-none hover:border-slate-200 focus:border-gold"
                    >
                      {vacancies.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.title}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                    <EditableCell
                      type="date"
                      value={r.date}
                      display={r.dateLabel}
                      onSave={async (v) => report(await rescheduleInterview(r.id, `${v}T${r.time}`))}
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                    <EditableCell
                      type="time"
                      value={r.time}
                      display={r.timeLabel}
                      onSave={async (v) => report(await rescheduleInterview(r.id, `${r.date}T${v}`))}
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                    <EditableCell
                      type="tel"
                      value={r.phone ?? ""}
                      display={r.phone ?? <span className="text-slate-400">Add number</span>}
                      onSave={async (v) => report(await updateCandidateQuick(r.candidateId, { phone: v }))}
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {r.whatsapp ? <WhatsAppButton number={r.whatsapp} name={r.name} compact /> : <span className="text-slate-400">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="mt-1.5 text-[11px] text-slate-400">Click a name, date, time or number to edit it. Date and time changes also update the Outlook event.</p>
    </div>
  );
}
