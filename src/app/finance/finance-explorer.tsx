"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Search } from "lucide-react";
import type { ProjectPayment, ProjectOrder, Vendor, PmProject } from "@prisma/client";
import { formatNumber, PM_STATUS_LABELS, PAYMENT_DIRECTION_LABELS } from "@/lib/constants";
import StatCard from "@/app/(app)/dashboard/stat-card";

type ProjectRow = {
  id: string;
  title: string;
  status: string;
  currency: string;
  contractValue: number;
  received: number;
  committed: number;
  paid: number;
};

type PaymentRow = ProjectPayment & {
  pmProject: Pick<PmProject, "id" | "title">;
  vendor: Vendor | null;
  order: ProjectOrder | null;
};

export default function FinanceExplorer({
  projectRows,
  payments,
  totals,
}: {
  projectRows: ProjectRow[];
  payments: PaymentRow[];
  totals: { contractValue: number; received: number; committed: number; paid: number };
}) {
  const [search, setSearch] = useState("");
  const [directionFilter, setDirectionFilter] = useState("");

  const outstandingReceivable = Math.max(0, totals.contractValue - totals.received);
  const outstandingPayable = Math.max(0, totals.committed - totals.paid);
  const netCash = totals.received - totals.paid;

  const filteredPayments = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payments.filter((p) => {
      if (directionFilter && p.direction !== directionFilter) return false;
      if (!q) return true;
      return (
        p.pmProject.title.toLowerCase().includes(q) ||
        p.vendor?.name.toLowerCase().includes(q) ||
        p.reference?.toLowerCase().includes(q)
      );
    });
  }, [payments, search, directionFilter]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Dashboard — live, active &amp; on-hold projects
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
          <StatCard label="Contract Value" value={formatNumber(totals.contractValue)} currency="AED" />
          <StatCard label="Received" value={formatNumber(totals.received)} currency="AED" />
          <StatCard
            label="Outstanding Receivable"
            value={formatNumber(outstandingReceivable)}
            currency="AED"
            accent={outstandingReceivable > 0 ? "warn" : undefined}
          />
          <StatCard label="Committed to Suppliers" value={formatNumber(totals.committed)} currency="AED" />
          <StatCard label="Paid to Suppliers" value={formatNumber(totals.paid)} currency="AED" />
          <StatCard
            label="Outstanding Payable"
            value={formatNumber(outstandingPayable)}
            currency="AED"
            accent={outstandingPayable > 0 ? "warn" : undefined}
          />
          <StatCard
            label="Net Cash Position"
            value={formatNumber(netCash)}
            currency="AED"
            accent={netCash < 0 ? "warn" : undefined}
          />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">By Project</h2>
        {projectRows.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
            No active or on-hold projects.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2.5">Project</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Contract Value</th>
                  <th className="px-4 py-2.5">Received</th>
                  <th className="px-4 py-2.5">Outstanding</th>
                  <th className="px-4 py-2.5">Committed</th>
                  <th className="px-4 py-2.5">Paid</th>
                  <th className="px-4 py-2.5">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projectRows.map((p) => {
                  const outstanding = Math.max(0, p.contractValue - p.received);
                  const net = p.received - p.paid;
                  return (
                    <tr key={p.id} className="transition hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-medium text-slate-800">
                        <Link href={`/pm/projects/${p.id}?tab=finance`} className="hover:underline">
                          {p.title}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500">
                        {PM_STATUS_LABELS[p.status as keyof typeof PM_STATUS_LABELS] ?? p.status}
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">{formatNumber(p.contractValue)}</td>
                      <td className="px-4 py-2.5 text-slate-700">{formatNumber(p.received)}</td>
                      <td className={`px-4 py-2.5 ${outstanding > 0 ? "text-amber-700" : "text-slate-700"}`}>
                        {formatNumber(outstanding)}
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">{formatNumber(p.committed)}</td>
                      <td className="px-4 py-2.5 text-slate-700">{formatNumber(p.paid)}</td>
                      <td className={`px-4 py-2.5 font-medium ${net < 0 ? "text-red-600" : "text-slate-800"}`}>
                        {formatNumber(net)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payments Ledger</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-52 rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
              />
            </div>
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value)}
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            >
              <option value="">Received &amp; paid</option>
              <option value="RECEIVED">Received</option>
              <option value="PAID">Paid</option>
            </select>
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
            No payments match.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <ul className="divide-y divide-slate-100">
              {filteredPayments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <div className="min-w-0">
                    <Link href={`/pm/projects/${p.pmProjectId}?tab=finance`} className="text-slate-800 hover:underline">
                      {p.pmProject.title}
                    </Link>
                    {p.vendor && <span className="text-slate-400"> — {p.vendor.name}</span>}
                    {p.reference && <span className="text-slate-400"> · {p.reference}</span>}
                  </div>
                  <span className="flex shrink-0 items-center gap-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        p.direction === "RECEIVED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {PAYMENT_DIRECTION_LABELS[p.direction as keyof typeof PAYMENT_DIRECTION_LABELS]}
                    </span>
                    <span className="font-medium text-slate-700">
                      {formatNumber(p.amount)} {p.currency}
                    </span>
                    <span className="text-xs text-slate-400">{format(p.paidDate, "MMM d, yyyy")}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
