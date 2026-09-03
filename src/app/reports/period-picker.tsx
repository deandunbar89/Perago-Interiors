"use client";

import { useRouter, usePathname } from "next/navigation";
import { Printer } from "lucide-react";
import { REPORT_PERIODS, REPORT_PERIOD_LABELS, type ReportPeriod } from "@/lib/report-periods";

const CATEGORIES = [
  { key: "TENDERS", label: "Tenders" },
  { key: "PROJECTS", label: "Projects" },
  { key: "SNAGS", label: "Snags" },
] as const;

export default function PeriodPicker({
  category,
  period,
  from,
  to,
}: {
  category: string;
  period: string;
  from?: string;
  to?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function go(next: { category?: string; period?: string; from?: string; to?: string }) {
    const params = new URLSearchParams({
      category: next.category ?? category,
      period: next.period ?? period,
    });
    const nextFrom = next.from !== undefined ? next.from : from;
    const nextTo = next.to !== undefined ? next.to : to;
    if (nextFrom && nextTo) {
      params.set("from", nextFrom);
      params.set("to", nextTo);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const usingCustomRange = Boolean(from && to);

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-lg border border-slate-300 p-0.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => go({ category: c.key })}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                category === c.key ? "bg-charcoal text-white" : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {REPORT_PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => go({ period: p, from: "", to: "" })}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                !usingCustomRange && period === p
                  ? "border-charcoal bg-charcoal text-white"
                  : "border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {REPORT_PERIOD_LABELS[p as ReportPeriod]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <input
            type="date"
            defaultValue={from}
            onChange={(e) => go({ from: e.target.value })}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
          />
          <span>–</span>
          <input
            type="date"
            defaultValue={to}
            onChange={(e) => go({ to: e.target.value })}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
          />
        </div>
      </div>

      <button
        onClick={() => window.print()}
        className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        <Printer size={15} />
        Print / save as PDF
      </button>
    </div>
  );
}
