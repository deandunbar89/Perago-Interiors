import type { TaskRow } from "./types";

export type ColumnId = "title" | "deadline" | "project" | "status" | "dueDate";

export const COLUMN_LABELS: Record<ColumnId, string> = {
  title: "Task",
  deadline: "Deadline",
  project: "Project",
  status: "Status",
  dueDate: "Close Date",
};

export const DEFAULT_COLUMNS: ColumnId[] = ["title", "project", "dueDate"];

export const ALL_COLUMNS: ColumnId[] = ["title", "deadline", "project", "status", "dueDate"];

export type SortDirection = "asc" | "desc";
export type SortState = { column: ColumnId; direction: SortDirection };

/** The direction a column sorts to on its first click — newest first for the close date,
 * A-to-Z for everything else. */
export const DEFAULT_SORT_DIRECTION: Record<ColumnId, SortDirection> = {
  title: "asc",
  deadline: "asc",
  project: "asc",
  status: "asc",
  dueDate: "desc",
};

function sortValue(col: ColumnId, task: TaskRow): string | number | null {
  switch (col) {
    case "title":
      return task.title.toLowerCase();
    case "deadline":
      return task.task?.title?.toLowerCase() ?? null;
    case "project":
      return task.pmProject?.title?.toLowerCase() ?? null;
    case "status":
      return task.status;
    case "dueDate":
      return task.dueDate?.getTime() ?? null;
    default:
      return null;
  }
}

/** Sorts by the given column, always sinking missing values to the bottom regardless of direction. */
export function sortTasks(tasks: TaskRow[], sort: SortState | null): TaskRow[] {
  if (!sort) return tasks;
  const mul = sort.direction === "asc" ? 1 : -1;
  return [...tasks].sort((a, b) => {
    const va = sortValue(sort.column, a);
    const vb = sortValue(sort.column, b);
    if (va === null && vb === null) return 0;
    if (va === null) return 1;
    if (vb === null) return -1;
    if (typeof va === "string" && typeof vb === "string") return va.localeCompare(vb) * mul;
    return ((va as number) - (vb as number)) * mul;
  });
}
