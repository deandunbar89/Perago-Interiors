"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { SNAG_PRIORITY_LABELS, SNAG_PRIORITY_COLORS, SNAG_CATEGORY_LABELS, TRADE_LABELS } from "@/lib/constants";
import type { GlobalSnag } from "./types";
import { Photo, CloseSnagForm } from "./snag-parts";

export default function ListView({
  snags,
  onDelete,
}: {
  snags: GlobalSnag[];
  onDelete: (snag: GlobalSnag) => void;
}) {
  if (snags.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
        No snags match.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {snags.map((snag) => {
        const priorityColors = SNAG_PRIORITY_COLORS[snag.priority as keyof typeof SNAG_PRIORITY_COLORS];
        return (
          <li
            key={snag.id}
            className={`flex items-start gap-3 rounded-xl border p-4 shadow-sm ${
              snag.status === "CLOSED" ? "border-slate-200 bg-slate-50" : "border-slate-200 bg-white"
            }`}
          >
            <Photo documentId={snag.openPhotoId} alt="Snag" />
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-1.5">
                <Link
                  href={`/pm/projects/${snag.pmProjectId}?tab=snags`}
                  className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-200"
                >
                  {snag.pmProject.title}
                </Link>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${priorityColors.bg} ${priorityColors.text}`}
                >
                  {SNAG_PRIORITY_LABELS[snag.priority as keyof typeof SNAG_PRIORITY_LABELS]}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  {SNAG_CATEGORY_LABELS[snag.category as keyof typeof SNAG_CATEGORY_LABELS]}
                </span>
                {snag.trade && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    {TRADE_LABELS[snag.trade as keyof typeof TRADE_LABELS]}
                  </span>
                )}
                {snag.status === "CLOSED" && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                    Closed
                  </span>
                )}
              </div>
              <p className={`text-sm ${snag.status === "CLOSED" ? "text-slate-600 line-through decoration-slate-300" : "text-slate-800"}`}>
                {snag.description}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {snag.location && <span>{snag.location} · </span>}
                {snag.vendor && <span>{snag.vendor.name} · </span>}
                {snag.status === "CLOSED"
                  ? `Closed ${snag.closedAt ? format(snag.closedAt, "MMM d, yyyy") : ""}`
                  : `Raised ${format(snag.createdAt, "MMM d, yyyy")}`}
              </p>
              <div className="mt-2 flex items-center gap-2">
                {snag.status === "OPEN" && <CloseSnagForm pmProjectId={snag.pmProjectId} snagId={snag.id} />}
                <button
                  onClick={() => onDelete(snag)}
                  className="flex items-center justify-center rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
