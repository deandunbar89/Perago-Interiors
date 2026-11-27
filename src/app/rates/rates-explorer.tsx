"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Plus, Search, Trash2, X } from "lucide-react";
import { addRate, deleteRate, updateRateField } from "@/lib/actions/rates";
import { RATE_TYPE_LABELS, RATE_TYPES, SOURCE_TYPE_LABELS, SOURCE_TYPES, TRADES } from "@/lib/rates";
import { formatNumber } from "@/lib/constants";

type Rate = {
  id: string;
  trade: string;
  description: string;
  unit: string;
  rate: number;
  rateType: string;
  source: string;
  sourceType: string;
  sourceRef: string | null;
  projectName: string | null;
  quotedAt: string;
  notes: string | null;
};

const input = "w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-gold";

function fmtDate(ymd: string) {
  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y}`;
}

function Editable({ value, onSave, className = "", numeric = false }: { value: string; onSave: (v: string) => void; className?: string; numeric?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  if (!editing)
    return (
      <button
        type="button"
        title="Click to edit"
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
        className={`w-full rounded px-1 py-0.5 text-left hover:bg-gold/15 ${className}`}
      >
        {value || <span className="text-slate-300">—</span>}
      </button>
    );
  const commit = () => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  };
  return (
    <input
      autoFocus
      inputMode={numeric ? "decimal" : undefined}
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

function AddRateForm({ onDone }: { onDone: () => void }) {
  const [state, action, pending] = useActionState(addRate, null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state && "success" in state) {
      formRef.current?.reset();
      onDone();
    }
  }, [state, onDone]);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form ref={formRef} action={action} className="mb-5 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-6">
      <label className="col-span-2 text-xs text-slate-500 md:col-span-3">
        Description
        <input name="description" required className={input} placeholder="e.g. Chilled-water FCU 1,200 CFM, supply & install" />
      </label>
      <label className="text-xs text-slate-500">
        Trade
        <select name="trade" className={input} defaultValue="Other">
          {TRADES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <label className="text-xs text-slate-500">
        Unit
        <input name="unit" required className={input} placeholder="m2, nr, item…" />
      </label>
      <label className="text-xs text-slate-500">
        Rate (AED excl. VAT)
        <input name="rate" required inputMode="decimal" className={input} placeholder="0.00" />
      </label>
      <label className="text-xs text-slate-500">
        Type
        <select name="rateType" className={input}>
          {RATE_TYPES.map((t) => (
            <option key={t} value={t}>
              {RATE_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs text-slate-500">
        Source (company)
        <input name="source" required className={input} placeholder="e.g. CoreDesign" />
      </label>
      <label className="text-xs text-slate-500">
        Source type
        <select name="sourceType" className={input}>
          {SOURCE_TYPES.map((t) => (
            <option key={t} value={t}>
              {SOURCE_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs text-slate-500">
        Quote ref / link
        <input name="sourceRef" className={input} />
      </label>
      <label className="text-xs text-slate-500">
        Project
        <input name="projectName" className={input} />
      </label>
      <label className="text-xs text-slate-500">
        Date quoted
        <input name="quotedAt" type="date" defaultValue={today} className={input} />
      </label>
      <label className="col-span-2 text-xs text-slate-500 md:col-span-5">
        Notes
        <input name="notes" className={input} placeholder="Spec, brand, what's included / excluded" />
      </label>
      <div className="col-span-2 flex items-end justify-end gap-2 md:col-span-1">
        {state && "error" in state && <p className="text-xs text-red-600">{state.error}</p>}
        <button
          disabled={pending}
          className="rounded-lg bg-charcoal px-4 py-2 text-sm font-medium text-white transition hover:bg-gold hover:text-charcoal disabled:opacity-60"
        >
          {pending ? "Saving…" : "Add rate"}
        </button>
      </div>
    </form>
  );
}

export default function RatesExplorer({ items }: { items: Rate[] }) {
  const [q, setQ] = useState("");
  const [trade, setTrade] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();

  const trades = useMemo(() => [...new Set(items.map((i) => i.trade))].sort(), [items]);
  const filtered = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return items.filter((r) => {
      const hay = `${r.description} ${r.source} ${r.notes ?? ""} ${r.projectName ?? ""} ${r.sourceRef ?? ""}`.toLowerCase();
      return (!trade || r.trade === trade) && (!sourceType || r.sourceType === sourceType) && words.every((w) => hay.includes(w));
    });
  }, [items, q, trade, sourceType]);

  const save = (id: string, field: "rate" | "description" | "unit" | "notes", v: string) =>
    start(async () => {
      const res = await updateRateField(id, field, v);
      setError(res && "error" in res && res.error ? res.error : null);
    });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search description, supplier, project…"
            className="w-72 rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-3 text-sm outline-none focus:border-gold"
          />
        </div>
        <select value={trade} onChange={(e) => setTrade(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm outline-none focus:border-gold">
          <option value="">All trades</option>
          {trades.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select value={sourceType} onChange={(e) => setSourceType(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm outline-none focus:border-gold">
          <option value="">All sources</option>
          {SOURCE_TYPES.map((t) => (
            <option key={t} value={t}>
              {SOURCE_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <span className="text-sm text-slate-400">
          {filtered.length} of {items.length}
        </span>
        <button
          onClick={() => setAdding((v) => !v)}
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-charcoal px-4 py-2 text-sm font-medium text-white transition hover:bg-gold hover:text-charcoal"
        >
          {adding ? <X size={16} /> : <Plus size={16} />}
          {adding ? "Close" : "Add rate"}
        </button>
      </div>

      {adding && <AddRateForm onDone={() => setAdding(false)} />}
      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        {filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">No rates yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-charcoal text-left text-[11px] uppercase tracking-wide text-white">
              <tr>
                <th className="px-3 py-2.5 font-semibold">Trade</th>
                <th className="px-3 py-2.5 font-semibold">Description</th>
                <th className="px-3 py-2.5 font-semibold">Unit</th>
                <th className="px-3 py-2.5 text-right font-semibold">Rate (AED)</th>
                <th className="px-3 py-2.5 font-semibold">Type</th>
                <th className="px-3 py-2.5 font-semibold">Source</th>
                <th className="px-3 py-2.5 font-semibold">Project</th>
                <th className="px-3 py-2.5 font-semibold">Date</th>
                <th className="px-3 py-2.5 font-semibold">Notes</th>
                <th className="px-2 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-500">{r.trade}</td>
                  <td className="min-w-72 px-2 py-1.5 text-slate-900">
                    <Editable value={r.description} onSave={(v) => save(r.id, "description", v)} />
                  </td>
                  <td className="w-20 px-2 py-1.5 text-slate-700">
                    <Editable value={r.unit} onSave={(v) => save(r.id, "unit", v)} />
                  </td>
                  <td className="w-28 px-2 py-1.5 text-right font-medium text-slate-900">
                    <Editable numeric value={formatNumber(r.rate)} className="text-right" onSave={(v) => save(r.id, "rate", v)} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-500">{RATE_TYPE_LABELS[r.rateType] ?? r.rateType}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <span className="text-slate-800">{r.source}</span>
                    <span className="block text-[11px] text-slate-400">
                      {SOURCE_TYPE_LABELS[r.sourceType] ?? r.sourceType}
                      {r.sourceRef ? ` · ${r.sourceRef.length > 30 ? r.sourceRef.slice(0, 30) + "…" : r.sourceRef}` : ""}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600">{r.projectName ?? "—"}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-600">{fmtDate(r.quotedAt)}</td>
                  <td className="min-w-48 px-2 py-1.5 text-xs text-slate-600">
                    <Editable value={r.notes ?? ""} onSave={(v) => save(r.id, "notes", v)} />
                  </td>
                  <td className="px-2 py-2">
                    <button
                      title="Delete rate"
                      onClick={() => {
                        if (confirm(`Delete "${r.description}"?`)) start(async () => deleteRate(r.id));
                      }}
                      className="rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
