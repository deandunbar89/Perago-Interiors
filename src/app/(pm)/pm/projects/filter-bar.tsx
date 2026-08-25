"use client";

import type { Client } from "@prisma/client";
import { Search, X } from "lucide-react";
import { PM_STATUSES, PM_STATUS_LABELS } from "@/lib/constants";

export type Filters = {
  search: string;
  status: string;
  clientId: string;
};

export const EMPTY_FILTERS: Filters = {
  search: "",
  status: "",
  clientId: "",
};

export default function FilterBar({
  filters,
  onChange,
  clients,
}: {
  filters: Filters;
  onChange: (filters: Filters) => void;
  clients: Client[];
}) {
  const active = Object.values(filters).some((v) => v !== "");

  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
          placeholder="Search projects…"
          className="w-52 rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
        />
      </div>

      <select
        value={filters.status}
        onChange={(e) => set("status", e.target.value)}
        className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
      >
        <option value="">All statuses</option>
        {PM_STATUSES.map((s) => (
          <option key={s} value={s}>
            {PM_STATUS_LABELS[s]}
          </option>
        ))}
      </select>

      <select
        value={filters.clientId}
        onChange={(e) => set("clientId", e.target.value)}
        className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
      >
        <option value="">All clients</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {active && (
        <button
          onClick={() => onChange(EMPTY_FILTERS)}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
        >
          <X size={14} />
          Clear
        </button>
      )}
    </div>
  );
}
