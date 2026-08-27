"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { Vendor } from "@prisma/client";
import { Plus, Search } from "lucide-react";
import ViewSwitcher, { type ExplorerView } from "@/components/view-switcher";
import Modal from "@/components/modal";
import { deleteVendor } from "@/lib/actions/vendors";
import { TRADES, TRADE_LABELS, VENDOR_TYPES, VENDOR_TYPE_LABELS } from "@/lib/constants";
import VendorForm from "./vendor-form";
import ListView from "./list-view";
import GridView from "./grid-view";

const VIEW_KEY = "tendercrm.vendors.view";

export default function VendorsExplorer({ vendors }: { vendors: Vendor[] }) {
  const [view, setView] = useState<ExplorerView>("list");
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [tradeFilter, setTradeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | undefined>(undefined);
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
    return vendors.filter((v) => {
      if (typeFilter && v.type !== typeFilter) return false;
      if (tradeFilter && v.trade !== tradeFilter) return false;
      if (statusFilter && v.status !== statusFilter) return false;
      if (!q) return true;
      return (
        v.name.toLowerCase().includes(q) ||
        v.contactName?.toLowerCase().includes(q) ||
        v.email?.toLowerCase().includes(q) ||
        v.phone?.toLowerCase().includes(q)
      );
    });
  }, [vendors, search, typeFilter, tradeFilter, statusFilter]);

  function openAdd() {
    setEditingVendor(undefined);
    setModalOpen(true);
  }

  function openEdit(vendor: Vendor) {
    setEditingVendor(vendor);
    setModalOpen(true);
  }

  function handleDelete(vendorId: string) {
    if (!confirm("Delete this vendor?")) return;
    startTransition(() => {
      deleteVendor(vendorId);
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
              placeholder="Search vendors…"
              className="w-56 rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
          >
            <option value="">All types</option>
            {VENDOR_TYPES.map((t) => (
              <option key={t} value={t}>
                {VENDOR_TYPE_LABELS[t]}
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
          >
            <option value="">Active & inactive</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <span className="text-xs text-slate-400">
            {filtered.length} of {vendors.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ViewSwitcher view={view} onChange={setView} views={["list", "grid"]} />
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 rounded-lg bg-charcoal px-3 py-1.5 text-sm font-medium text-white transition hover:bg-jet"
          >
            <Plus size={15} />
            Add vendor
          </button>
        </div>
      </div>

      {view === "list" && <ListView vendors={filtered} onEdit={openEdit} onDelete={handleDelete} />}
      {view === "grid" && <GridView vendors={filtered} onEdit={openEdit} onDelete={handleDelete} />}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingVendor ? "Edit vendor" : "Add vendor"}
      >
        <VendorForm vendor={editingVendor} onDone={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}
