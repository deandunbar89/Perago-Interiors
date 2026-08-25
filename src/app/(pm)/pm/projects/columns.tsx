import { format } from "date-fns";
import { PM_STATUS_LABELS, PM_STATUS_COLORS, formatCurrency, type PmStatus } from "@/lib/constants";
import type { PmProjectRow } from "./types";

export type ColumnId =
  | "title"
  | "client"
  | "status"
  | "value"
  | "progress"
  | "startDate"
  | "targetEndDate"
  | "location";

export const COLUMN_LABELS: Record<ColumnId, string> = {
  title: "Project",
  client: "Client",
  status: "Status",
  value: "Value",
  progress: "Progress",
  startDate: "Start Date",
  targetEndDate: "Target Completion",
  location: "Location",
};

export const DEFAULT_COLUMNS: ColumnId[] = ["title", "client", "status", "value", "progress", "targetEndDate"];

export const ALL_COLUMNS: ColumnId[] = [
  "title",
  "client",
  "status",
  "value",
  "progress",
  "startDate",
  "targetEndDate",
  "location",
];

function dateCell(date: Date | null) {
  return date ? format(date, "MMM d, yyyy") : <span className="text-slate-300">—</span>;
}

function getProgress(project: PmProjectRow): number | null {
  if (project.scheduleItems.length === 0) return null;
  return Math.round(
    project.scheduleItems.reduce((sum, s) => sum + s.percentComplete, 0) / project.scheduleItems.length
  );
}

export function renderCell(col: ColumnId, project: PmProjectRow) {
  switch (col) {
    case "title":
      return <span className="font-medium text-slate-900">{project.title}</span>;
    case "client":
      return project.client?.name || <span className="text-slate-300">—</span>;
    case "status": {
      const colors = PM_STATUS_COLORS[project.status as PmStatus];
      return (
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${colors.bg} ${colors.text}`}>
          {PM_STATUS_LABELS[project.status as PmStatus]}
        </span>
      );
    }
    case "value":
      return formatCurrency(project.value, project.currency);
    case "progress": {
      const p = getProgress(project);
      return p === null ? <span className="text-slate-300">—</span> : `${p}%`;
    }
    case "startDate":
      return dateCell(project.startDate);
    case "targetEndDate":
      return dateCell(project.targetEndDate);
    case "location":
      return project.location ? (
        <span className="line-clamp-1">{project.location}</span>
      ) : (
        <span className="text-slate-300">—</span>
      );
    default:
      return null;
  }
}

export type SortDirection = "asc" | "desc";
export type SortState = { column: ColumnId; direction: SortDirection };

/** The direction a column sorts to on its first click — newest/highest first for dates,
 * value and progress; A-to-Z for everything else. */
export const DEFAULT_SORT_DIRECTION: Record<ColumnId, SortDirection> = {
  title: "asc",
  client: "asc",
  status: "asc",
  value: "desc",
  progress: "desc",
  startDate: "desc",
  targetEndDate: "desc",
  location: "asc",
};

function sortValue(col: ColumnId, project: PmProjectRow): string | number | null {
  switch (col) {
    case "title":
      return project.title.toLowerCase();
    case "client":
      return project.client?.name?.toLowerCase() ?? null;
    case "status":
      return PM_STATUS_LABELS[project.status as PmStatus];
    case "value":
      return project.value;
    case "progress":
      return getProgress(project);
    case "startDate":
      return project.startDate?.getTime() ?? null;
    case "targetEndDate":
      return project.targetEndDate?.getTime() ?? null;
    case "location":
      return project.location?.toLowerCase() ?? null;
    default:
      return null;
  }
}

/** Sorts by the given column, always sinking missing values to the bottom regardless of direction. */
export function sortPmProjects(projects: PmProjectRow[], sort: SortState | null): PmProjectRow[] {
  if (!sort) return projects;
  const mul = sort.direction === "asc" ? 1 : -1;
  return [...projects].sort((a, b) => {
    const va = sortValue(sort.column, a);
    const vb = sortValue(sort.column, b);
    if (va === null && vb === null) return 0;
    if (va === null) return 1;
    if (vb === null) return -1;
    if (typeof va === "string" && typeof vb === "string") return va.localeCompare(vb) * mul;
    return ((va as number) - (vb as number)) * mul;
  });
}
