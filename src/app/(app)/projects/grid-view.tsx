import Link from "next/link";
import { format } from "date-fns";
import { Building2, Calendar } from "lucide-react";
import {
  STAGE_LABELS,
  STAGE_COLORS,
  TEMPERATURE_LABELS,
  TEMPERATURE_COLORS,
  formatCurrency,
  type Stage,
  type Temperature,
} from "@/lib/constants";
import type { ProjectRow } from "./types";

export default function GridView({ projects }: { projects: ProjectRow[] }) {
  if (projects.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
        No projects match your filters.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {projects.map((project) => {
        const stageColors = STAGE_COLORS[project.stage as Stage];
        const tempColors = project.temperature
          ? TEMPERATURE_COLORS[project.temperature as Temperature]
          : null;
        return (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <p className="line-clamp-2 text-sm font-medium text-slate-900">{project.title}</p>
              {tempColors && (
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${tempColors.bg} ${tempColors.text}`}>
                  {TEMPERATURE_LABELS[project.temperature as Temperature]}
                </span>
              )}
            </div>
            {project.client && (
              <p className="mb-2 flex items-center gap-1 text-xs text-slate-500">
                <Building2 size={12} />
                <span className="truncate">{project.client.name}</span>
              </p>
            )}
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">
                {formatCurrency(project.value, project.currency)}
              </span>
              {project.submissionDeadline && (
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Calendar size={11} />
                  {format(project.submissionDeadline, "MMM d")}
                </span>
              )}
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${stageColors.bg} ${stageColors.text}`}>
              {STAGE_LABELS[project.stage as Stage]}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
