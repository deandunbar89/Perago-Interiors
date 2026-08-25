"use client";

import { useState } from "react";
import { Columns3, GripVertical } from "lucide-react";

export default function ColumnPicker<T extends string>({
  allColumns,
  labels,
  lockedColumn,
  visible,
  onChange,
}: {
  allColumns: T[];
  labels: Record<T, string>;
  lockedColumn: T;
  visible: T[];
  onChange: (columns: T[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [dragCol, setDragCol] = useState<T | null>(null);

  const ordered: T[] = [...visible, ...allColumns.filter((c) => !visible.includes(c))];

  function toggle(col: T) {
    if (col === lockedColumn) return;
    if (visible.includes(col)) {
      onChange(visible.filter((c) => c !== col));
    } else {
      onChange([...visible, col]);
    }
  }

  function handleDrop(target: T) {
    if (!dragCol || dragCol === target) return;
    const next = ordered.filter((c) => c !== dragCol);
    const targetIndex = next.indexOf(target);
    next.splice(targetIndex, 0, dragCol);
    onChange(next.filter((c) => visible.includes(c)));
    setDragCol(null);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
      >
        <Columns3 size={14} />
        Columns
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
            <p className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-slate-400">
              Drag to reorder · check to show
            </p>
            <ul>
              {ordered.map((col) => (
                <li
                  key={col}
                  draggable={visible.includes(col)}
                  onDragStart={() => setDragCol(col)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(col)}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${
                    visible.includes(col) ? "text-slate-800" : "text-slate-400"
                  } ${dragCol === col ? "opacity-40" : ""}`}
                >
                  <GripVertical
                    size={14}
                    className={visible.includes(col) ? "cursor-grab text-slate-300" : "text-slate-200"}
                  />
                  <label className="flex flex-1 items-center gap-2">
                    <input
                      type="checkbox"
                      checked={visible.includes(col)}
                      disabled={col === lockedColumn}
                      onChange={() => toggle(col)}
                      className="rounded border-slate-300"
                    />
                    {labels[col]}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
