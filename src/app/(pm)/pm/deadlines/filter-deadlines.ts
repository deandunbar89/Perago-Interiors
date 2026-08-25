import { matchesRange, type Range } from "@/lib/date-ranges";
import type { DeadlineRow } from "./types";

export { matchesRange, sortByDueDate, RANGES, RANGE_LABELS, type Range } from "@/lib/date-ranges";

/** A deadline "belongs" in a range view if it matches directly, or any of its open tasks do. */
export function deadlineGroupMatchesRange(deadline: DeadlineRow, range: Range): boolean {
  if (matchesRange(deadline, range)) return true;
  return deadline.subtasks.some((s) => s.status === "OPEN" && matchesRange(s, range));
}

/** Earliest relevant due date for sorting a deadline group: its own, or its soonest open task's. */
export function earliestDueDate(deadline: DeadlineRow): Date | null {
  const candidates = [
    deadline.dueDate,
    ...deadline.subtasks.filter((s) => s.status === "OPEN").map((s) => s.dueDate),
  ]
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime());
  return candidates[0] ?? null;
}
