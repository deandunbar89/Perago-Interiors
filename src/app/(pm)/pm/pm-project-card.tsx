import Link from "next/link";
import type { Client, PmProject, Project, ScheduleItem } from "@prisma/client";
import { Building2, Flag } from "lucide-react";
import { formatCurrency, PM_STATUS_LABELS, PM_STATUS_COLORS } from "@/lib/constants";

type PmProjectWithRelations = PmProject & {
  client: Client | null;
  linkedTender: Project | null;
  scheduleItems: Pick<ScheduleItem, "percentComplete" | "status">[];
};

export default function PmProjectCard({ project }: { project: PmProjectWithRelations }) {
  const colors = PM_STATUS_COLORS[project.status];
  const progress =
    project.scheduleItems.length > 0
      ? Math.round(
          project.scheduleItems.reduce((sum, s) => sum + s.percentComplete, 0) / project.scheduleItems.length
        )
      : null;

  return (
    <Link
      href={`/pm/projects/${project.id}`}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-sm font-medium text-slate-900">{project.title}</p>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${colors.bg} ${colors.text}`}>
          {PM_STATUS_LABELS[project.status]}
        </span>
      </div>
      {project.client && (
        <p className="mb-1.5 flex items-center gap-1 text-xs text-slate-500">
          <Building2 size={12} />
          <span className="truncate">{project.client.name}</span>
        </p>
      )}
      {project.linkedTender && (
        <p className="mb-1.5 flex items-center gap-1 text-xs text-slate-400">
          <Flag size={11} />
          From tender
        </p>
      )}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">
          {formatCurrency(project.value, project.currency)}
        </span>
      </div>
      {progress !== null && (
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-gold" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
    </Link>
  );
}
