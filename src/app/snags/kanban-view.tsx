"use client";

import Link from "next/link";
import { format } from "date-fns";
import { SNAG_PRIORITY_LABELS, SNAG_PRIORITY_COLORS } from "@/lib/constants";
import type { GlobalSnag } from "./types";
import { Photo, CloseSnagForm } from "./snag-parts";

const COLUMNS = [
  { key: "OPEN", label: "Open" },
  { key: "CLOSED", label: "Closed" },
] as const;

export default function KanbanView({ snags }: { snags: GlobalSnag[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {COLUMNS.map((col) => {
        const items = snags.filter((s) => s.status === col.key);
        return (
          <div key={col.key} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <h3 className="mb-3 flex items-center gap-1.5 px-1 text-sm font-semibold text-slate-700">
              {col.label}
              <span className="rounded-full bg-slate-200 px-1.5 text-xs font-medium text-slate-600">
                {items.length}
              </span>
            </h3>
            <div className="space-y-2">
              {items.length === 0 && <p className="px-1 text-xs text-slate-400">Nothing here.</p>}
              {items.map((snag) => {
                const priorityColors = SNAG_PRIORITY_COLORS[snag.priority as keyof typeof SNAG_PRIORITY_COLORS];
                return (
                  <div key={snag.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="flex items-start gap-2">
                      <Photo documentId={snag.openPhotoId} alt="Snag" />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/pm/projects/${snag.pmProjectId}?tab=snags`}
                          className="block truncate text-[11px] font-medium text-slate-500 hover:text-slate-800"
                        >
                          {snag.pmProject.title}
                        </Link>
                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-800">{snag.description}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${priorityColors.bg} ${priorityColors.text}`}
                          >
                            {SNAG_PRIORITY_LABELS[snag.priority as keyof typeof SNAG_PRIORITY_LABELS]}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400">
                          {format(col.key === "CLOSED" && snag.closedAt ? snag.closedAt : snag.createdAt, "MMM d")}
                        </p>
                      </div>
                    </div>
                    {snag.status === "OPEN" && (
                      <div className="mt-2">
                        <CloseSnagForm pmProjectId={snag.pmProjectId} snagId={snag.id} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
