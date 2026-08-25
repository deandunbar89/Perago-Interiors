import { format } from "date-fns";
import {
  STAGE_LABELS,
  STAGE_COLORS,
  PROJECT_TYPE_LABELS,
  TEMPERATURE_LABELS,
  TEMPERATURE_COLORS,
  formatCurrency,
  type Stage,
  type ProjectType,
  type Temperature,
} from "@/lib/constants";
import type { ProjectRow } from "./types";

export type ColumnId =
  | "title"
  | "client"
  | "stage"
  | "projectType"
  | "temperature"
  | "value"
  | "location"
  | "reference"
  | "submissionDeadline"
  | "siteVisitDate"
  | "awardDate"
  | "owner";

export const COLUMN_LABELS: Record<ColumnId, string> = {
  title: "Project",
  client: "Client",
  stage: "Stage",
  projectType: "Type",
  temperature: "Temperature",
  value: "Value",
  location: "Location",
  reference: "Reference",
  submissionDeadline: "Submission Deadline",
  siteVisitDate: "Site Visit",
  awardDate: "Award Date",
  owner: "Owner",
};

export const DEFAULT_COLUMNS: ColumnId[] = [
  "title",
  "client",
  "stage",
  "projectType",
  "temperature",
  "value",
  "submissionDeadline",
  "owner",
];

export const ALL_COLUMNS: ColumnId[] = [
  "title",
  "client",
  "stage",
  "projectType",
  "temperature",
  "value",
  "location",
  "reference",
  "submissionDeadline",
  "siteVisitDate",
  "awardDate",
  "owner",
];

export type SortDirection = "asc" | "desc";
export type SortState = { column: ColumnId; direction: SortDirection };

/** The direction a column sorts to on its first click — newest/highest first for dates and
 * value, A-to-Z for everything else. */
export const DEFAULT_SORT_DIRECTION: Record<ColumnId, SortDirection> = {
  title: "asc",
  client: "asc",
  stage: "asc",
  projectType: "asc",
  temperature: "asc",
  value: "desc",
  location: "asc",
  reference: "asc",
  submissionDeadline: "desc",
  siteVisitDate: "desc",
  awardDate: "desc",
  owner: "asc",
};

function sortValue(col: ColumnId, project: ProjectRow): string | number | null {
  switch (col) {
    case "title":
      return project.title.toLowerCase();
    case "client":
      return project.client?.name?.toLowerCase() ?? null;
    case "stage":
      return STAGE_LABELS[project.stage as Stage];
    case "projectType":
      return project.projectType ? PROJECT_TYPE_LABELS[project.projectType as ProjectType] : null;
    case "temperature":
      return project.temperature ? TEMPERATURE_LABELS[project.temperature as Temperature] : null;
    case "value":
      return project.value;
    case "location":
      return project.location?.toLowerCase() ?? null;
    case "reference":
      return project.reference?.toLowerCase() ?? null;
    case "submissionDeadline":
      return project.submissionDeadline?.getTime() ?? null;
    case "siteVisitDate":
      return project.siteVisitDate?.getTime() ?? null;
    case "awardDate":
      return project.awardDate?.getTime() ?? null;
    case "owner":
      return project.owner?.name?.toLowerCase() ?? null;
    default:
      return null;
  }
}

/** Sorts by the given column, always sinking missing values to the bottom regardless of direction. */
export function sortProjects(projects: ProjectRow[], sort: SortState | null): ProjectRow[] {
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

function dateCell(date: Date | null) {
  return date ? format(date, "MMM d, yyyy") : <span className="text-slate-300">—</span>;
}

export function renderCell(col: ColumnId, project: ProjectRow) {
  switch (col) {
    case "title":
      return <span className="font-medium text-slate-900">{project.title}</span>;
    case "client":
      return project.client?.name || <span className="text-slate-300">—</span>;
    case "stage": {
      const colors = STAGE_COLORS[project.stage as Stage];
      return (
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${colors.bg} ${colors.text}`}>
          {STAGE_LABELS[project.stage as Stage]}
        </span>
      );
    }
    case "projectType":
      return project.projectType ? (
        PROJECT_TYPE_LABELS[project.projectType as ProjectType]
      ) : (
        <span className="text-slate-300">—</span>
      );
    case "temperature": {
      if (!project.temperature) return <span className="text-slate-300">—</span>;
      const colors = TEMPERATURE_COLORS[project.temperature as Temperature];
      return (
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${colors.bg} ${colors.text}`}>
          {TEMPERATURE_LABELS[project.temperature as Temperature]}
        </span>
      );
    }
    case "value":
      return formatCurrency(project.value, project.currency);
    case "location":
      return project.location ? (
        <span className="line-clamp-1">{project.location}</span>
      ) : (
        <span className="text-slate-300">—</span>
      );
    case "reference":
      return project.reference || <span className="text-slate-300">—</span>;
    case "submissionDeadline":
      return dateCell(project.submissionDeadline);
    case "siteVisitDate":
      return dateCell(project.siteVisitDate);
    case "awardDate":
      return dateCell(project.awardDate);
    case "owner":
      return project.owner?.name || <span className="text-slate-300">—</span>;
    default:
      return null;
  }
}
