"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import type { Vacancy } from "@prisma/client";
import Modal from "@/components/modal";
import { deleteVacancy, setVacancyStatus } from "@/lib/actions/recruitment";
import { VACANCY_STATUSES, VACANCY_STATUS_LABELS, type VacancyStatus } from "@/lib/constants";
import VacancyForm from "../../vacancy-form";

export default function VacancyHeader({ vacancy }: { vacancy: Vacancy }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete "${vacancy.title}" and every candidate under it, including their CVs? This can't be undone.`)) return;
    startTransition(async () => {
      await deleteVacancy(vacancy.id);
      router.push("/recruitment");
    });
  }

  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{vacancy.title}</h1>
        <p className="text-sm text-slate-500">Vacancy</p>
      </div>
      <div className="flex items-center gap-2">
        <select
          value={vacancy.status}
          onChange={(e) => {
            const status = e.target.value as VacancyStatus;
            startTransition(() => {
              setVacancyStatus(vacancy.id, status);
            });
          }}
          className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm font-medium outline-none focus:border-gold focus:ring-1 focus:ring-gold"
        >
          {VACANCY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {VACANCY_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <Pencil size={14} />
          Edit
        </button>
        <button
          onClick={handleDelete}
          title="Delete vacancy"
          className="rounded-lg border border-slate-300 p-2 text-slate-400 transition hover:border-red-200 hover:text-red-600"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit vacancy" size="lg">
        <VacancyForm vacancy={vacancy} onDone={() => setEditing(false)} />
      </Modal>
    </div>
  );
}
