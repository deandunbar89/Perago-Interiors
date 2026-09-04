import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { formatNumber, PAYMENT_DIRECTION_LABELS } from "@/lib/constants";
import type { PeriodRange } from "@/lib/report-periods";
import StatCard from "@/app/(app)/dashboard/stat-card";

export default async function FinanceReport({ range }: { range: PeriodRange }) {
  const [activeProjects, allOrders, allPayments, periodPayments] = await Promise.all([
    prisma.pmProject.findMany({ where: { status: { in: ["ACTIVE", "ON_HOLD"] } }, select: { value: true } }),
    prisma.projectOrder.findMany({ select: { value: true } }),
    prisma.projectPayment.findMany({ select: { direction: true, amount: true } }),
    prisma.projectPayment.findMany({
      where: { paidDate: { gte: range.start, lte: range.end } },
      include: { pmProject: { select: { title: true } }, vendor: true },
      orderBy: { paidDate: "asc" },
    }),
  ]);

  const contractValue = activeProjects.reduce((s, p) => s + (p.value || 0), 0);
  const committed = allOrders.reduce((s, o) => s + o.value, 0);
  const receivedAllTime = allPayments.filter((p) => p.direction === "RECEIVED").reduce((s, p) => s + p.amount, 0);
  const paidAllTime = allPayments.filter((p) => p.direction === "PAID").reduce((s, p) => s + p.amount, 0);
  const netAllTime = receivedAllTime - paidAllTime;

  const receivedPeriod = periodPayments.filter((p) => p.direction === "RECEIVED").reduce((s, p) => s + p.amount, 0);
  const paidPeriod = periodPayments.filter((p) => p.direction === "PAID").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Company snapshot (as of today, active &amp; on-hold projects)
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Contract Value" value={formatNumber(contractValue)} currency="AED" />
          <StatCard label="Received" value={formatNumber(receivedAllTime)} currency="AED" />
          <StatCard
            label="Outstanding Receivable"
            value={formatNumber(Math.max(0, contractValue - receivedAllTime))}
            currency="AED"
            accent={contractValue - receivedAllTime > 0 ? "warn" : undefined}
          />
          <StatCard label="Committed to Suppliers" value={formatNumber(committed)} currency="AED" />
          <StatCard label="Paid to Suppliers" value={formatNumber(paidAllTime)} currency="AED" />
          <StatCard
            label="Net Cash Position"
            value={formatNumber(netAllTime)}
            currency="AED"
            accent={netAllTime < 0 ? "warn" : undefined}
          />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Cash flow — {range.label}
        </h2>
        <div className="mb-3 grid grid-cols-3 gap-4">
          <StatCard label="Received This Period" value={formatNumber(receivedPeriod)} currency="AED" />
          <StatCard label="Paid This Period" value={formatNumber(paidPeriod)} currency="AED" />
          <StatCard
            label="Net This Period"
            value={formatNumber(receivedPeriod - paidPeriod)}
            currency="AED"
            accent={receivedPeriod - paidPeriod < 0 ? "warn" : undefined}
          />
        </div>

        {periodPayments.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
            No payments recorded in this period.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <ul className="divide-y divide-slate-100">
              {periodPayments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <div className="min-w-0">
                    <span className="text-slate-800">{p.pmProject.title}</span>
                    {p.vendor && <span className="text-slate-400"> — {p.vendor.name}</span>}
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
                    <span className="text-xs text-slate-400">{format(p.paidDate, "MMM d")}</span>
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
