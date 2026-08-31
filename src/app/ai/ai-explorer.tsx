"use client";

import { useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import { ExternalLink, Plus, Search, Edit2, Trash2 } from "lucide-react";
import Modal from "@/components/modal";
import { deleteAiSubscription } from "@/lib/actions/ai-subscriptions";
import { AI_SUBSCRIPTION_STATUS_LABELS } from "@/lib/constants";
import type { AiSubscriptionRow } from "./types";
import AiForm from "./ai-form";
import PasswordCell from "./password-cell";

export default function AiExplorer({ subscriptions }: { subscriptions: AiSubscriptionRow[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AiSubscriptionRow | undefined>(undefined);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return subscriptions.filter((s) => {
      if (statusFilter && s.status !== statusFilter) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.username?.toLowerCase().includes(q) ||
        s.plan?.toLowerCase().includes(q)
      );
    });
  }, [subscriptions, search, statusFilter]);

  function openAdd() {
    setEditing(undefined);
    setModalOpen(true);
  }

  function openEdit(sub: AiSubscriptionRow) {
    setEditing(sub);
    setModalOpen(true);
  }

  function handleDelete(sub: AiSubscriptionRow) {
    if (!confirm(`Delete "${sub.name}"?`)) return;
    startTransition(() => {
      deleteAiSubscription(sub.id);
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-56 rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
          >
            <option value="">Active & cancelled</option>
            <option value="ACTIVE">Active</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <span className="text-xs text-slate-400">
            {filtered.length} of {subscriptions.length}
          </span>
        </div>

        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 rounded-lg bg-charcoal px-3 py-1.5 text-sm font-medium text-white transition hover:bg-jet"
        >
          <Plus size={15} />
          Add subscription
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
          No subscriptions match.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Plan</th>
                <th className="px-4 py-2.5">Username</th>
                <th className="px-4 py-2.5">Password</th>
                <th className="px-4 py-2.5">Cost</th>
                <th className="px-4 py-2.5">Renews</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="w-20 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s) => (
                <tr key={s.id} className="transition hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-slate-800">
                    <div className="flex items-center gap-1.5">
                      {s.name}
                      {s.url && (
                        <a
                          href={s.url.startsWith("http") ? s.url : `https://${s.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-300 hover:text-slate-600"
                        >
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                    {s.notes && <p className="mt-0.5 text-xs text-slate-400">{s.notes}</p>}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{s.plan || "—"}</td>
                  <td className="px-4 py-2.5 text-slate-600">{s.username || "—"}</td>
                  <td className="px-4 py-2.5">
                    <PasswordCell id={s.id} hasPassword={s.hasPassword} />
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{s.cost || "—"}</td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {s.renewalDate ? format(s.renewalDate, "MMM d, yyyy") : "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        s.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {AI_SUBSCRIPTION_STATUS_LABELS[s.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(s)}
                        className="flex items-center justify-center rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
                        className="flex items-center justify-center rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit subscription" : "Add subscription"}
      >
        <AiForm subscription={editing} onDone={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}
