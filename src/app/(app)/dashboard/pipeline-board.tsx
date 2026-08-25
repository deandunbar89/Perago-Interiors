"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Client, Project, User } from "@prisma/client";
import { Building2, Calendar } from "lucide-react";
import { STAGES, STAGE_LABELS, STAGE_COLORS, formatCurrency, type Stage } from "@/lib/constants";
import { updateProjectStage } from "@/lib/actions/projects";
import { format } from "date-fns";

type ProjectWithRelations = Project & { client: Client | null; owner: User | null };

export default function PipelineBoard({ projects }: { projects: ProjectWithRelations[] }) {
  const [items, setItems] = useState(projects);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<Stage | null>(null);
  const [, startTransition] = useTransition();

  function handleDrop(stage: Stage) {
    if (!dragId) return;
    const project = items.find((p) => p.id === dragId);
    setDragOverStage(null);
    if (!project || project.stage === stage) {
      setDragId(null);
      return;
    }

    setItems((prev) => prev.map((p) => (p.id === dragId ? { ...p, stage } : p)));
    startTransition(() => {
      updateProjectStage(dragId, stage);
    });
    setDragId(null);
  }

  return (
    <div className="grid grid-cols-1 gap-4 overflow-x-auto pb-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {STAGES.map((stage) => {
        const stageProjects = items.filter((p) => p.stage === stage);
        const colors = STAGE_COLORS[stage];
        return (
          <div
            key={stage}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStage(stage);
            }}
            onDragLeave={() => setDragOverStage((s) => (s === stage ? null : s))}
            onDrop={() => handleDrop(stage)}
            className={`flex min-h-[200px] flex-col rounded-xl border p-2 transition ${
              dragOverStage === stage
                ? "border-slate-400 bg-slate-100"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="mb-2 flex items-center justify-between px-1.5 pt-1">
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {STAGE_LABELS[stage]}
                </span>
              </div>
              <span className="text-xs font-medium text-slate-400">{stageProjects.length}</span>
            </div>

            <div className="flex flex-1 flex-col gap-2">
              {stageProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  draggable
                  onDragStart={() => setDragId(project.id)}
                  className="cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md active:cursor-grabbing"
                >
                  <p className="mb-1.5 line-clamp-2 text-sm font-medium text-slate-900">
                    {project.title}
                  </p>
                  {project.client && (
                    <p className="mb-1.5 flex items-center gap-1 text-xs text-slate-500">
                      <Building2 size={12} />
                      <span className="truncate">{project.client.name}</span>
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">
                      {formatCurrency(project.value, project.currency)}
                    </span>
                    {project.submissionDeadline && (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Calendar size={11} />
                        {format(project.submissionDeadline, "MMM d")}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
              {stageProjects.length === 0 && (
                <p className="px-1.5 py-6 text-center text-xs text-slate-400">No projects</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
