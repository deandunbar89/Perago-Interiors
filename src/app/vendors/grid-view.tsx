"use client";

import type { Vendor } from "@prisma/client";
import { Mail, Phone, Edit2, Trash2, Building2 } from "lucide-react";
import { TRADE_LABELS, VENDOR_TYPE_LABELS } from "@/lib/constants";

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  SUPPLIER: { bg: "bg-blue-50", text: "text-blue-700" },
  CONTRACTOR: { bg: "bg-amber-50", text: "text-amber-700" },
};

export default function GridView({
  vendors,
  onEdit,
  onDelete,
}: {
  vendors: Vendor[];
  onEdit: (vendor: Vendor) => void;
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {vendors.map((v) => {
        const colors = TYPE_COLORS[v.type];
        return (
          <div key={v.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <Building2 size={16} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{v.name}</p>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[11px] font-medium ${colors.bg} ${colors.text}`}
                  >
                    {VENDOR_TYPE_LABELS[v.type as keyof typeof VENDOR_TYPE_LABELS]}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => onEdit(v)}
                  className="flex items-center justify-center rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  onClick={() => onDelete(v.id)}
                  className="flex items-center justify-center rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {v.trade && (
              <p className="mb-1 text-xs text-slate-500">{TRADE_LABELS[v.trade as keyof typeof TRADE_LABELS]}</p>
            )}
            <div className="space-y-0.5 text-xs text-slate-500">
              {v.contactName && <p>{v.contactName}</p>}
              {v.phone && (
                <p className="flex items-center gap-1">
                  <Phone size={11} />
                  {v.phone}
                </p>
              )}
              {v.email && (
                <p className="flex items-center gap-1">
                  <Mail size={11} />
                  {v.email}
                </p>
              )}
            </div>
            <span
              className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${
                v.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
              }`}
            >
              {v.status === "ACTIVE" ? "Active" : "Inactive"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
