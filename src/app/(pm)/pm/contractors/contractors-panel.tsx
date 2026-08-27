"use client";

import { useRef, useState, useTransition } from "react";
import type { Contractor } from "@prisma/client";
import { Plus, Trash2, HardHat, Phone, Mail } from "lucide-react";
import { createContractor, deleteContractor } from "@/lib/actions/contractors";
import { TRADES, TRADE_LABELS } from "@/lib/constants";

export default function ContractorsPanel({ contractors }: { contractors: Contractor[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createContractor(undefined, formData);
      if (result?.error) setError(result.error);
      else {
        formRef.current?.reset();
        setOpen(false);
      }
    });
  }

  function handleDelete(contractorId: string) {
    if (!confirm("Remove this contractor?")) return;
    startTransition(() => {
      deleteContractor(contractorId);
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {contractors.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-400">No contractors added yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {contractors.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <HardHat size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{c.name}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      {c.trade && <span>{TRADE_LABELS[c.trade as keyof typeof TRADE_LABELS]}</span>}
                      {c.phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={11} />
                          {c.phone}
                        </span>
                      )}
                      {c.email && (
                        <span className="flex items-center gap-1">
                          <Mail size={11} />
                          {c.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="text-slate-300 transition hover:text-red-600"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-1.5 px-4 py-3 text-sm font-medium text-slate-700"
        >
          <Plus size={15} />
          Add contractor
        </button>
        {open && (
          <form ref={formRef} action={handleSubmit} className="space-y-3 border-t border-slate-100 p-4">
            <div className="grid grid-cols-2 gap-3">
              <input
                name="name"
                required
                placeholder="Company / contractor name"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
              />
              <select
                name="trade"
                defaultValue=""
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
              >
                <option value="">No trade set</option>
                {TRADES.map((t) => (
                  <option key={t} value={t}>
                    {TRADE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                name="phone"
                placeholder="Phone"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
              />
              <input
                name="email"
                type="email"
                placeholder="Email"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-charcoal px-4 py-2 text-sm font-medium text-white transition hover:bg-jet disabled:opacity-60"
            >
              {pending ? "Adding…" : "Add contractor"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
