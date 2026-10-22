"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Plus, Search } from "lucide-react";
import type { Vacancy } from "@prisma/client";
import Modal from "@/components/modal";
import {
  EMPLOYMENT_TYPE_LABELS,
  VACANCY_STATUSES,
  VACANCY_STATUS_LABELS,
} from "@/lib/constants";
import VacancyForm from "./vacancy-form";
import { VacancyStatusBadge } from "./parts";

export type VacancyRow = Vacancy & { total: number; active: number; hired: number };

export default function VacanciesExplorer({ vacancies }: { vacancies: VacancyRow[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vacancies.filter((v) => {
      if (statusFilter && v.status !== statusFilter) return false;
      if (!q) return true;
      return [v.title, v.department, v.location].filter(Boolean).some((x) => x!.toLowerCase().includes(q));
    });
  }, [vacancies, search, statusFilter]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vacancies…"
              className="w-52 rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
          >
            <option value="">All statuses</option>
            {VACANCY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {VACANCY_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <span className="text-xs text-slate-400">
            {filtered.length} of {vacancies.length}
          </span>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-charcoal px-3 py-1.5 text-sm font-medium text-white transition hover:bg-gold hover:text-charcoal"
        >
          <Plus size={15} />
          New vacancy
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
          {vacancies.length === 0 ? "No vacancies yet. Add the first role you're hiring for." : "No vacancies match."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-champagne bg-charcoal text-left text-xs font-semibold uppercase tracking-wide text-cream">
                <th className="px-4 py-2.5">Job title</th>
                <th className="px-4 py-2.5">Department</th>
                <th className="px-4 py-2.5">Location</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Candidates</th>
                <th className="px-4 py-2.5">Opened</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((v) => (
                <tr key={v.id} className="transition hover:bg-slate-50">
                  <td className="px-4 py-2.5">
                    <Link href={`/recruitment/vacancies/${v.id}`} className="font-medium text-slate-900 hover:underline">
                      {v.title}
                    </Link>
                    {v.headcount > 1 && <p className="text-xs text-slate-400">{v.headcount} positions</p>}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{v.department ?? "—"}</td>
                  <td className="px-4 py-2.5 text-slate-600">{v.location ?? "—"}</td>
                  <td className="px-4 py-2.5 text-slate-600">{EMPLOYMENT_TYPE_LABELS[v.employmentType]}</td>
                  <td className="px-4 py-2.5">
                    <VacancyStatusBadge status={v.status} />
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {v.active} active
                    <span className="text-slate-400"> · {v.total} total</span>
                    {v.hired > 0 && <span className="text-emerald-600"> · {v.hired} hired</span>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-slate-500">{format(v.openedAt, "d MMM yyyy")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New vacancy" size="lg">
        <VacancyForm onDone={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}
