"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { SNAG_PRIORITY_LABELS, SNAG_PRIORITY_COLORS, SNAG_CATEGORY_LABELS, TRADE_LABELS } from "@/lib/constants";
import type { GlobalSnag } from "./types";
import { Photo, CloseSnagForm } from "./snag-parts";

export default function GridView({
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {snags.map((snag) => {
        const priorityColors = SNAG_PRIORITY_COLORS[snag.priority as keyof typeof SNAG_PRIORITY_COLORS];
        return (
          <div
            key={snag.id}
            className={`rounded-xl border p-4 shadow-sm ${
              snag.status === "CLOSED" ? "border-slate-200 bg-slate-50" : "border-slate-200 bg-white"
            }`}
          >
            <div className="mb-2 flex items-start gap-3">
              <Photo documentId={snag.openPhotoId} alt="Snag" />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/pm/projects/${snag.pmProjectId}?tab=snags`}
                  className="block truncate text-xs font-medium text-slate-500 hover:text-slate-800"
                >
                  {snag.pmProject.title}
                </Link>
                <p
                  className={`mt-0.5 text-sm ${
                    snag.status === "CLOSED" ? "text-slate-600 line-through decoration-slate-300" : "text-slate-800"
                  }`}
                >
                  {snag.description}
                </p>
              </div>
              <button
                onClick={() => onDelete(snag)}
                className="flex shrink-0 items-center justify-center rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={13} />
              </button>
            </div>

            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-medium ${priorityColors.bg} ${priorityColors.text}`}
              >
                {SNAG_PRIORITY_LABELS[snag.priority as keyof typeof SNAG_PRIORITY_LABELS]}
              </span>
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
                {SNAG_CATEGORY_LABELS[snag.category as keyof typeof SNAG_CATEGORY_LABELS]}
              </span>
              {snag.trade && (
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
                  {TRADE_LABELS[snag.trade as keyof typeof TRADE_LABELS]}
                </span>
              )}
            </div>

            <p className="mb-2 text-xs text-slate-400">
              {snag.location && <span>{snag.location} · </span>}
              {snag.vendor && <span>{snag.vendor.name} · </span>}
              {snag.status === "CLOSED"
                ? `Closed ${snag.closedAt ? format(snag.closedAt, "MMM d, yyyy") : ""}`
                : `Raised ${format(snag.createdAt, "MMM d, yyyy")}`}
            </p>

            {snag.status === "OPEN" && <CloseSnagForm pmProjectId={snag.pmProjectId} snagId={snag.id} />}
          </div>
        );
      })}
    </div>
  );
}
