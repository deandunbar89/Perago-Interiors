"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

/** A dropdown with tick boxes, so several options can be chosen at once. An empty selection means "all". */
export default function MultiSelect({
  options,
  selected,
  onChange,
  allLabel,
  noun,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
  allLabel: string;
  /** Plural noun for the button when several are chosen, e.g. "stages". */
  noun: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const label =
    selected.length === 0
      ? allLabel
      : selected.length === 1
        ? options.find((o) => o.value === selected[0])?.label ?? allLabel
        : `${selected.length} ${noun}`;

  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
      >
        {label}
        <ChevronDown size={14} className="text-slate-500" />
      </button>
      {open && (
        <div className="absolute left-0 z-30 mt-1 min-w-[14rem] rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          <button
            type="button"
            onClick={() => onChange([])}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-slate-50"
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded border ${
                selected.length === 0 ? "border-charcoal bg-charcoal text-white" : "border-slate-300"
              }`}
            >
              {selected.length === 0 && <Check size={11} />}
            </span>
            {allLabel}
          </button>
          <div className="my-1 border-t border-slate-100" />
          {options.map((o) => {
            const on = selected.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => toggle(o.value)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-slate-50"
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded border ${
                    on ? "border-charcoal bg-charcoal text-white" : "border-slate-300"
                  }`}
                >
                  {on && <Check size={11} />}
                </span>
                {o.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
