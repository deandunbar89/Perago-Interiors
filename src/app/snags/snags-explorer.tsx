"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Plus, Search } from "lucide-react";
import type { Vendor } from "@prisma/client";
import ViewSwitcher, { type ExplorerView } from "@/components/view-switcher";
import Modal from "@/components/modal";
import { deleteSnag } from "@/lib/actions/pm-snags";
import {
  SNAG_PRIORITIES,
  SNAG_PRIORITY_LABELS,
  SNAG_CATEGORIES,
  SNAG_CATEGORY_LABELS,
  TRADES,
  TRADE_LABELS,
} from "@/lib/constants";
import type { GlobalSnag } from "./types";
import ListView from "./list-view";
import GridView from "./grid-view";
import KanbanView from "./kanban-view";
import AddSnagForm from "./add-snag-form";

const VIEW_KEY = "tendercrm.snags.view";

export default function SnagsExplorer({
  snags,
  projects,
  vendors,
}: {
  snags: GlobalSnag[];
  projects: { id: string; title: string }[];
  vendors: Vendor[];
}) {
  const [view, setView] = useState<ExplorerView>("list");
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("OPEN");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [tradeFilter, setTradeFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const saved = localStorage.getItem(VIEW_KEY) as ExplorerView | null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setView(saved);
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(VIEW_KEY, view);
  }, [view, ready]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return snags.filter((s) => {
      if (projectFilter && s.pmProjectId !== projectFilter) return false;
      if (statusFilter && s.status !== statusFilter) return false;
      if (priorityFilter && s.priority !== priorityFilter) return false;
      if (categoryFilter && s.category !== categoryFilter) return false;
      if (tradeFilter && s.trade !== tradeFilter) return false;
      if (vendorFilter && s.vendorId !== vendorFilter) return false;
      if (!q) return true;
      return (
        s.description.toLowerCase().includes(q) ||
        s.location?.toLowerCase().includes(q) ||
        s.pmProject.title.toLowerCase().includes(q) ||
        s.vendor?.name.toLowerCase().includes(q)
      );
    });
  }, [snags, search, projectFilter, statusFilter, priorityFilter, categoryFilter, tradeFilter, vendorFilter]);

  function handleDelete(snag: GlobalSnag) {
    if (!confirm("Delete this snag?")) return;
    startTransition(() => {
      deleteSnag(snag.pmProjectId, snag.id);
    });
  }

  const openCount = snags.filter((s) => s.status === "OPEN").length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search snags…"
              className="w-52 rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            />
          </div>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
          >
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
          >
            <option value="">Open & closed</option>
            <option value="OPEN">Open ({openCount})</option>
            <option value="CLOSED">Closed</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
          >
            <option value="">All priorities</option>
            {SNAG_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {SNAG_PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
          >
            <option value="">All categories</option>
            {SNAG_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {SNAG_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          <select
            value={tradeFilter}
            onChange={(e) => setTradeFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
          >
            <option value="">All trades</option>
            {TRADES.map((t) => (
              <option key={t} value={t}>
                {TRADE_LABELS[t]}
              </option>
            ))}
          </select>
          <select
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
          >
            <option value="">All contractors</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          <span className="text-xs text-slate-400">
            {filtered.length} of {snags.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ViewSwitcher view={view} onChange={setView} views={["list", "grid", "kanban"]} />
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-charcoal px-3 py-1.5 text-sm font-medium text-white transition hover:bg-jet"
          >
            <Plus size={15} />
            Raise snag
          </button>
        </div>
      </div>

      {view === "list" && <ListView snags={filtered} onDelete={handleDelete} />}
      {view === "grid" && <GridView snags={filtered} onDelete={handleDelete} />}
      {view === "kanban" && <KanbanView snags={filtered} />}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Raise snag">
        <AddSnagForm projects={projects} vendors={vendors} onDone={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}
