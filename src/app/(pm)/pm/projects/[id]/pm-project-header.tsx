"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Flag, Trash2 } from "lucide-react";
import { formatCurrency, PM_STATUSES, PM_STATUS_LABELS, PM_STATUS_COLORS, type PmStatus } from "@/lib/constants";
import { updatePmProjectStatus, deletePmProject } from "@/lib/actions/pm-projects";
import type { PmProjectDetail } from "./types";

export default function PmProjectHeader({ project }: { project: PmProjectDetail }) {
  const [status, setStatus] = useState(project.status);
  const [pending, startTransition] = useTransition();

  function handleStatusChange(next: PmStatus) {
    setStatus(next);
    startTransition(() => {
      updatePmProjectStatus(project.id, next);
    });
  }

  function handleDelete() {
    if (!confirm(`Delete "${project.title}"? This removes its schedule too.`)) return;
    startTransition(() => {
      deletePmProject(project.id);
    });
  }

  const colors = PM_STATUS_COLORS[status];

  return (
    <div className="mb-6">
      <Link
        href="/pm/projects"
        className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft size={15} />
        Projects
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-slate-900">{project.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            {project.client && (
              <Link href={`/clients/${project.client.id}`} className="flex items-center gap-1 hover:text-slate-800">
                <Building2 size={14} />
                {project.client.name}
              </Link>
            )}
            {project.linkedTender && (
              <Link href={`/projects/${project.linkedTender.id}`} className="flex items-center gap-1 hover:text-slate-800">
                <Flag size={14} />
                From tender: {project.linkedTender.title}
              </Link>
            )}
            {project.value !== null && (
              <span className="font-medium text-slate-700">{formatCurrency(project.value, project.currency)}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={status}
            disabled={pending}
            onChange={(e) => handleStatusChange(e.target.value as PmStatus)}
            className={`rounded-lg border-0 px-3 py-2 text-sm font-medium outline-none ring-1 ring-inset ring-slate-200 ${colors.bg} ${colors.text}`}
          >
            {PM_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PM_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <button
            onClick={handleDelete}
            title="Delete project"
            className="flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
