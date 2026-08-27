"use client";

import { Mail, Phone, Edit2, Trash2 } from "lucide-react";
import { TRADE_LABELS, VENDOR_TYPE_LABELS } from "@/lib/constants";
import type { VendorWithDocs } from "./vendor-form";

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  SUPPLIER: { bg: "bg-blue-50", text: "text-blue-700" },
  CONTRACTOR: { bg: "bg-amber-50", text: "text-amber-700" },
};

export default function ListView({
  vendors,
  onEdit,
  onDelete,
}: {
  vendors: VendorWithDocs[];
  onEdit: (vendor: VendorWithDocs) => void;
  onDelete: (vendorId: string) => void;
}) {
  if (vendors.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
        No vendors match.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[820px] text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="px-4 py-2.5">Name</th>
            <th className="px-4 py-2.5">Type</th>
            <th className="px-4 py-2.5">Trade</th>
            <th className="px-4 py-2.5">Contact</th>
            <th className="px-4 py-2.5">Status</th>
            <th className="w-16 px-4 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {vendors.map((v) => {
            const colors = TYPE_COLORS[v.type];
            return (
              <tr key={v.id} className="transition hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium text-slate-800">{v.name}</td>
                <td className="px-4 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}>
                    {VENDOR_TYPE_LABELS[v.type as keyof typeof VENDOR_TYPE_LABELS]}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-slate-600">
                  {v.trade ? TRADE_LABELS[v.trade as keyof typeof TRADE_LABELS] : "—"}
                </td>
                <td className="px-4 py-2.5 text-slate-600">
                  <div className="flex flex-col gap-0.5">
                    {v.contactName && <span>{v.contactName}</span>}
                    {v.phone && (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Phone size={11} />
                        {v.phone}
                      </span>
                    )}
                    {v.email && (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Mail size={11} />
                        {v.email}
                      </span>
                    )}
                    {!v.contactName && !v.phone && !v.email && "—"}
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      v.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {v.status === "ACTIVE" ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(v)}
                      className="flex items-center justify-center rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(v.id)}
                      className="flex items-center justify-center rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
