"use client";

import { useEffect, useRef, useState } from "react";
import { Search, ChevronDown } from "lucide-react";

type Option = { value: string; label: string };

/** A combobox that behaves like a <select> but with a search box at the top of
 * the dropdown — for long option lists (trades, etc.) where scrolling to find
 * one is painful. Supports two usage patterns:
 *  - controlled: pass `value` + `onChange` (e.g. a filter bar)
 *  - uncontrolled form field: pass `name` (+ optional `defaultValue`) and it
 *    renders a hidden input, so it drops into a plain <form action={...}> the
 *    same way a native <select name="..."> would. */
export default function SearchableSelect({
  name,
  value,
  defaultValue,
  onChange,
  options,
  placeholder,
  className,
}: {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  options: Option[];
  placeholder: string;
  className?: string;
}) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const current = isControlled ? (value ?? "") : internalValue;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => searchRef.current?.focus(), 0);
    return () => clearTimeout(id);
  }, [open]);

  const filtered = options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()));
  const currentLabel = options.find((o) => o.value === current)?.label ?? placeholder;

  function toggleOpen() {
    setOpen((v) => {
      if (!v) setQuery("");
      return !v;
    });
  }

  function select(v: string) {
    if (isControlled) onChange?.(v);
    else setInternalValue(v);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      {name && <input type="hidden" name={name} value={current} />}
      <button
        type="button"
        onClick={toggleOpen}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-left text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
      >
        <span className={`truncate ${current ? "text-slate-800" : "text-slate-500"}`}>{currentLabel}</span>
        <ChevronDown size={14} className="shrink-0 text-slate-400" />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full min-w-[240px] rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="relative border-b border-slate-100 p-1.5">
            <Search size={13} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && filtered.length > 0) {
                  e.preventDefault();
                  select(filtered[0].value);
                } else if (e.key === "Escape") {
                  setOpen(false);
                }
              }}
              placeholder="Search…"
              className="w-full rounded-md py-1 pl-6 pr-2 text-sm outline-none"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            <li>
              <button
                type="button"
                onClick={() => select("")}
                className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-slate-50 ${
                  !current ? "font-medium text-charcoal" : "text-slate-600"
                }`}
              >
                {placeholder}
              </button>
            </li>
            {filtered.length === 0 ? (
              <li className="px-3 py-1.5 text-sm text-slate-400">No matches</li>
            ) : (
              filtered.map((o) => (
                <li key={o.value}>
                  <button
                    type="button"
                    onClick={() => select(o.value)}
                    className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-slate-50 ${
                      current === o.value ? "font-medium text-charcoal" : "text-slate-600"
                    }`}
                  >
                    {o.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
