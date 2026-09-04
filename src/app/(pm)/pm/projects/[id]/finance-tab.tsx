"use client";

import { useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { Plus, Trash2, Download } from "lucide-react";
import type { Vendor } from "@prisma/client";
import { createOrder, deleteOrder, createPayment, deletePayment } from "@/lib/actions/pm-finance";
import {
  ORDER_TYPES,
  ORDER_TYPE_LABELS,
  PAYMENT_DIRECTIONS,
  PAYMENT_DIRECTION_LABELS,
  formatNumber,
} from "@/lib/constants";
import StatCard from "@/app/(app)/dashboard/stat-card";
import type { PmProjectDetail } from "./types";

const fieldClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold";

function DocLink({ document }: { document: { id: string; originalName: string } | null }) {
  if (!document) return <span className="text-slate-300">—</span>;
  return (
    <a
      href={`/api/pm-files/${document.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 text-xs text-slate-500 underline hover:text-slate-800"
    >
      <Download size={11} />
      {document.originalName}
    </a>
  );
}

function AddOrderForm({ pmProjectId, vendors, onDone }: { pmProjectId: string; vendors: Vendor[]; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createOrder(pmProjectId, formData);
      if (result?.error) setError(result.error);
      else {
        formRef.current?.reset();
        onDone();
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-3 border-t border-slate-100 p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <select name="type" required defaultValue="" className={fieldClass}>
          <option value="" disabled>
            Order type
          </option>
          {ORDER_TYPES.map((t) => (
            <option key={t} value={t}>
              {ORDER_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <select name="vendorId" defaultValue="" className={fieldClass}>
          <option value="">No supplier set</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
        <input name="reference" placeholder="PO / LPO number" className={fieldClass} />
        <input name="orderDate" type="date" className={fieldClass} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input name="value" type="number" step="0.01" min="0" required placeholder="Value" className={fieldClass} />
        <input name="currency" defaultValue="AED" placeholder="Currency" className={fieldClass} />
      </div>
      <input name="description" placeholder="What's this order for?" className={fieldClass} />
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Attach the PO / LPO / contract</label>
        <input
          name="document"
          type="file"
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-charcoal file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-charcoal px-4 py-2 text-sm font-medium text-white transition hover:bg-jet disabled:opacity-60"
      >
        {pending ? "Saving…" : "Add order"}
      </button>
    </form>
  );
}

function AddPaymentForm({
  pmProjectId,
  vendors,
  orders,
  onDone,
}: {
  pmProjectId: string;
  vendors: Vendor[];
  orders: PmProjectDetail["orders"];
  onDone: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createPayment(pmProjectId, formData);
      if (result?.error) setError(result.error);
      else {
        formRef.current?.reset();
        onDone();
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-3 border-t border-slate-100 p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <select name="direction" required defaultValue="" className={fieldClass}>
          <option value="" disabled>
            Received or paid?
          </option>
          {PAYMENT_DIRECTIONS.map((d) => (
            <option key={d} value={d}>
              {PAYMENT_DIRECTION_LABELS[d]}
            </option>
          ))}
        </select>
        <select name="orderId" defaultValue="" className={fieldClass}>
          <option value="">No order linked</option>
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              {o.reference || ORDER_TYPE_LABELS[o.type as keyof typeof ORDER_TYPE_LABELS]} — {formatNumber(o.value)}
            </option>
          ))}
        </select>
        <select name="vendorId" defaultValue="" className={fieldClass}>
          <option value="">No supplier set</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
        <input name="paidDate" type="date" required className={fieldClass} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <input name="amount" type="number" step="0.01" min="0" required placeholder="Amount" className={fieldClass} />
        <input name="currency" defaultValue="AED" placeholder="Currency" className={fieldClass} />
        <input name="reference" placeholder="Invoice / payment cert #" className={fieldClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Attach proof of payment (optional)</label>
        <input
          name="document"
          type="file"
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-charcoal file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-charcoal px-4 py-2 text-sm font-medium text-white transition hover:bg-jet disabled:opacity-60"
      >
        {pending ? "Saving…" : "Add payment"}
      </button>
    </form>
  );
}

export default function FinanceTab({ project, allVendors }: { project: PmProjectDetail; allVendors: Vendor[] }) {
  const [addOrderOpen, setAddOrderOpen] = useState(false);
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [, startTransition] = useTransition();

  const contractValue = project.value ?? 0;
  const totalReceived = project.payments.filter((p) => p.direction === "RECEIVED").reduce((s, p) => s + p.amount, 0);
  const totalCommitted = project.orders.reduce((s, o) => s + o.value, 0);
  const totalPaid = project.payments.filter((p) => p.direction === "PAID").reduce((s, p) => s + p.amount, 0);
  const netCash = totalReceived - totalPaid;

  function handleDeleteOrder(orderId: string) {
    if (!confirm("Delete this order? Any linked payments will stay but lose the link.")) return;
    startTransition(() => {
      deleteOrder(project.id, orderId);
    });
  }

  function handleDeletePayment(paymentId: string) {
    if (!confirm("Delete this payment?")) return;
    startTransition(() => {
      deletePayment(project.id, paymentId);
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Overview</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Contract Value" value={formatNumber(contractValue)} currency={project.currency} />
          <StatCard label="Received" value={formatNumber(totalReceived)} currency={project.currency} />
          <StatCard
            label="Outstanding Receivable"
            value={formatNumber(Math.max(0, contractValue - totalReceived))}
            currency={project.currency}
            accent={contractValue - totalReceived > 0 ? "warn" : undefined}
          />
          <StatCard label="Committed to Suppliers" value={formatNumber(totalCommitted)} currency={project.currency} />
          <StatCard label="Paid to Suppliers" value={formatNumber(totalPaid)} currency={project.currency} />
          <StatCard
            label="Net Cash Position"
            value={formatNumber(netCash)}
            currency={project.currency}
            accent={netCash < 0 ? "warn" : undefined}
          />
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Supplier Orders</h3>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <button
            onClick={() => setAddOrderOpen((v) => !v)}
            className="flex w-full items-center gap-1.5 px-4 py-3 text-sm font-medium text-slate-700"
          >
            <Plus size={15} />
            Add order
          </button>
          {addOrderOpen && (
            <AddOrderForm pmProjectId={project.id} vendors={allVendors} onDone={() => setAddOrderOpen(false)} />
          )}
        </div>

        {project.orders.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No orders yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Supplier</th>
                  <th className="px-4 py-2.5">Reference</th>
                  <th className="px-4 py-2.5">Value</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Document</th>
                  <th className="w-10 px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {project.orders.map((o) => (
                  <tr key={o.id} className="transition hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-slate-700">{ORDER_TYPE_LABELS[o.type as keyof typeof ORDER_TYPE_LABELS]}</td>
                    <td className="px-4 py-2.5 text-slate-700">{o.vendor?.name ?? "—"}</td>
                    <td className="px-4 py-2.5 text-slate-500">{o.reference ?? "—"}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-800">
                      {formatNumber(o.value)} {o.currency}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">
                      {o.orderDate ? format(o.orderDate, "MMM d, yyyy") : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <DocLink document={o.document} />
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => handleDeleteOrder(o.id)}
                        className="flex items-center justify-center rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Payments</h3>
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <button
            onClick={() => setAddPaymentOpen((v) => !v)}
            className="flex w-full items-center gap-1.5 px-4 py-3 text-sm font-medium text-slate-700"
          >
            <Plus size={15} />
            Add payment
          </button>
          {addPaymentOpen && (
            <AddPaymentForm
              pmProjectId={project.id}
              vendors={allVendors}
              orders={project.orders}
              onDone={() => setAddPaymentOpen(false)}
            />
          )}
        </div>

        {project.payments.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No payments logged yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2.5">Direction</th>
                  <th className="px-4 py-2.5">Supplier / Order</th>
                  <th className="px-4 py-2.5">Reference</th>
                  <th className="px-4 py-2.5">Amount</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Document</th>
                  <th className="w-10 px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {project.payments.map((p) => (
                  <tr key={p.id} className="transition hover:bg-slate-50">
                    <td className="px-4 py-2.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          p.direction === "RECEIVED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {PAYMENT_DIRECTION_LABELS[p.direction as keyof typeof PAYMENT_DIRECTION_LABELS]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">
                      {p.vendor?.name ?? p.order?.reference ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">{p.reference ?? "—"}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-800">
                      {formatNumber(p.amount)} {p.currency}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">{format(p.paidDate, "MMM d, yyyy")}</td>
                    <td className="px-4 py-2.5">
                      <DocLink document={p.document} />
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => handleDeletePayment(p.id)}
                        className="flex items-center justify-center rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
