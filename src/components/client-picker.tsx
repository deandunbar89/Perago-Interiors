"use client";

import { useState } from "react";
import type { Client } from "@prisma/client";
import { X } from "lucide-react";

export default function ClientPicker({
  clients,
  defaultClientId,
}: {
  clients: Client[];
  defaultClientId?: string | null;
}) {
  const [creatingNew, setCreatingNew] = useState(false);

  if (creatingNew) {
    return (
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">New client name</label>
        <div className="flex items-center gap-2">
          <input
            name="newClientName"
            autoFocus
            placeholder="Company name"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
          />
          <button
            type="button"
            onClick={() => setCreatingNew(false)}
            title="Cancel — pick an existing client instead"
            className="flex shrink-0 items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={16} />
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-400">This client will be created along with the project.</p>
      </div>
    );
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">Client</label>
      <div className="flex items-center gap-2">
        <select
          name="clientId"
          defaultValue={defaultClientId || ""}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
        >
          <option value="">No client</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setCreatingNew(true)}
          className="shrink-0 whitespace-nowrap rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
        >
          + New
        </button>
      </div>
    </div>
  );
}
