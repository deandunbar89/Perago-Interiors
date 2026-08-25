"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Calendar, HardHat, Trash2 } from "lucide-react";
import { STAGES, STAGE_LABELS, STAGE_COLORS, formatCurrency, type Stage } from "@/lib/constants";
import { updateProjectStage, deleteProject } from "@/lib/actions/projects";
import { promoteToPm } from "@/lib/actions/pm-projects";
import { format } from "date-fns";
import type { ProjectDetail } from "./types";

export default function ProjectHeader({ project }: { project: ProjectDetail }) {
  const [stage, setStage] = useState<Stage>(project.stage as Stage);
  const [pending, startTransition] = useTransition();
  const [promoting, setPromoting] = useState(false);
  const router = useRouter();

  function handleStageChange(next: Stage) {
    setStage(next);
    startTransition(() => {
      updateProjectStage(project.id, next);
    });
  }

  function handleDelete() {
    if (!confirm(`Delete "${project.title}"? This removes all its documents, notes and emails.`)) {
      return;
    }
    startTransition(() => {
      deleteProject(project.id);
    });
  }

  function handlePromote() {
    setPromoting(true);
    startTransition(async () => {
      const result = await promoteToPm(project.id);
      setPromoting(false);
      if (result?.pmProjectId) router.push(`/pm/projects/${result.pmProjectId}`);
    });
  }

  const colors = STAGE_COLORS[stage];

  return (
    <div className="mb-6">
      <Link
        href="/dashboard"
        className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft size={15} />
        Dashboard
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-slate-900">{project.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            {project.client && (
              <Link
                href={`/clients/${project.client.id}`}
                className="flex items-center gap-1 hover:text-slate-800"
              >
                <Building2 size={14} />
                {project.client.name}
              </Link>
            )}
            {project.submissionDeadline && (
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                Due {format(project.submissionDeadline, "MMM d, yyyy")}
              </span>
            )}
            {project.value !== null && (
              <span className="font-medium text-slate-700">
                {formatCurrency(project.value, project.currency)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {stage === "WON" &&
            (project.pmProject ? (
              <Link
                href={`/pm/projects/${project.pmProject.id}`}
                className="flex items-center gap-1.5 rounded-lg bg-gold px-3 py-2 text-sm font-medium text-charcoal transition hover:bg-gold/90"
              >
                <HardHat size={15} />
                View in PM
              </Link>
            ) : (
              <button
                onClick={handlePromote}
                disabled={promoting}
                className="flex items-center gap-1.5 rounded-lg bg-gold px-3 py-2 text-sm font-medium text-charcoal transition hover:bg-gold/90 disabled:opacity-60"
              >
                <HardHat size={15} />
                {promoting ? "Promoting…" : "Promote to PM"}
              </button>
            ))}
          <select
            value={stage}
            disabled={pending}
            onChange={(e) => handleStageChange(e.target.value as Stage)}
            className={`rounded-lg border-0 px-3 py-2 text-sm font-medium outline-none ring-1 ring-inset ring-slate-200 ${colors.bg} ${colors.text}`}
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABELS[s]}
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
