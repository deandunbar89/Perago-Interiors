"use client";

import { useEffect, useRef, useState } from "react";
import type { DragEvent, PointerEvent as ReactPointerEvent } from "react";

type Widths<T extends string> = Partial<Record<T, number>>;

/**
 * Drag-to-reorder and drag-to-resize for table header columns. Widths are remembered per
 * table in localStorage; the order itself is owned by the caller (it's also edited from the
 * Columns picker), so reordering goes out through `onColumnsChange`.
 */
export function useColumnLayout<T extends string>({
  storageKey,
  columns,
  onColumnsChange,
  defaultWidths,
  minWidth = 70,
}: {
  storageKey: string;
  columns: T[];
  onColumnsChange: (columns: T[]) => void;
  defaultWidths: Record<T, number>;
  minWidth?: number;
}) {
  const [widths, setWidthsState] = useState<Widths<T>>({});
  const widthsRef = useRef<Widths<T>>({});
  const [dragCol, setDragCol] = useState<T | null>(null);
  const [overCol, setOverCol] = useState<T | null>(null);

  function setWidths(next: Widths<T>) {
    widthsRef.current = next;
    setWidthsState(next);
  }

  function persist() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(widthsRef.current));
    } catch {
      // storage blocked — widths just won't be remembered
    }
  }

  // localStorage isn't available during SSR, so saved widths are applied post-mount.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setWidths(JSON.parse(saved));
    } catch {
      // ignore corrupt or blocked storage
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  function widthOf(col: T) {
    return widths[col] ?? defaultWidths[col];
  }

  function startResize(col: T) {
    return (e: ReactPointerEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startWidth = widthOf(col);
      try {
        // Keeps touch drags attached to the handle; the window listeners below do the real work.
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // pointer already released — nothing to capture
      }

      function move(ev: PointerEvent) {
        const next = Math.max(minWidth, Math.round(startWidth + ev.clientX - startX));
        setWidths({ ...widthsRef.current, [col]: next });
      }
      function end() {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", end);
        window.removeEventListener("pointercancel", end);
        persist();
      }
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", end);
      window.addEventListener("pointercancel", end);
    };
  }

  function resetWidth(col: T) {
    const next = { ...widthsRef.current };
    delete next[col];
    setWidths(next);
    persist();
  }

  function reorder(from: T, to: T) {
    const fromIndex = columns.indexOf(from);
    const toIndex = columns.indexOf(to);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;
    const next = columns.filter((c) => c !== from);
    next.splice(toIndex, 0, from);
    onColumnsChange(next);
  }

  function clearDrag() {
    setDragCol(null);
    setOverCol(null);
  }

  return {
    widthOf,
    /** Natural width of the table: the columns plus the fixed checkbox and delete columns. */
    totalWidth: columns.reduce((sum, c) => sum + widthOf(c), 0),
    startResize,
    resetWidth,
    isDragging: (col: T) => dragCol === col,
    /** Which edge of this header the dragged column would land on, if it's being hovered. */
    dropSide: (col: T): "left" | "right" | null => {
      if (!dragCol || overCol !== col || dragCol === col) return null;
      return columns.indexOf(dragCol) < columns.indexOf(col) ? "right" : "left";
    },
    dragProps: (col: T) => ({
      draggable: true,
      onDragStart: (e: DragEvent) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", col);
        setDragCol(col);
      },
      onDragEnd: clearDrag,
    }),
    dropProps: (col: T) => ({
      onDragOver: (e: DragEvent) => {
        if (!dragCol) return;
        e.preventDefault();
        setOverCol(col);
      },
      onDrop: (e: DragEvent) => {
        e.preventDefault();
        if (dragCol) reorder(dragCol, col);
        clearDrag();
      },
    }),
  };
}

export type ColumnLayout<T extends string> = ReturnType<typeof useColumnLayout<T>>;
