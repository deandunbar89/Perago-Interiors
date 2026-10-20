"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { ColumnLayout } from "./use-column-layout";

/** A sortable table header cell that can be dragged to reorder and has an edge handle to resize. */
export default function ColumnHeaderCell<T extends string>({
  col,
  label,
  layout,
  sortDirection,
  onSort,
}: {
  col: T;
  label: string;
  layout: ColumnLayout<T>;
  /** Set when the table is currently sorted by this column. */
  sortDirection: "asc" | "desc" | null;
  onSort: () => void;
}) {
  const side = layout.dropSide(col);

  return (
    <th
      {...layout.dropProps(col)}
      className={`group relative select-none px-4 py-2.5 ${layout.isDragging(col) ? "opacity-40" : ""} ${
        side === "left"
          ? "shadow-[inset_2px_0_0_0_var(--color-champagne)]"
          : side === "right"
            ? "shadow-[inset_-2px_0_0_0_var(--color-champagne)]"
            : ""
      }`}
    >
      <div {...layout.dragProps(col)} className="cursor-grab active:cursor-grabbing">
        <button
          onClick={onSort}
          title={label}
          className={`flex w-full items-center gap-1 whitespace-nowrap transition hover:text-white ${
            sortDirection ? "text-white" : ""
          }`}
        >
          <span className="truncate">{label}</span>
          {sortDirection === "asc" ? (
            <ArrowUp size={12} className="shrink-0" />
          ) : sortDirection === "desc" ? (
            <ArrowDown size={12} className="shrink-0" />
          ) : (
            <ArrowUpDown size={12} className="shrink-0 text-slate-400" />
          )}
        </button>
      </div>
      <div
        onPointerDown={layout.startResize(col)}
        onDoubleClick={() => layout.resetWidth(col)}
        title="Drag to resize · double-click to reset"
        className="absolute right-0 top-0 flex h-full w-3 cursor-col-resize touch-none justify-center"
      >
        <span className="h-full w-px bg-cream/20 transition group-hover:bg-champagne" />
      </div>
    </th>
  );
}
