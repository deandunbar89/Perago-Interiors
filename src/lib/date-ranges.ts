import { addDays, addWeeks, endOfWeek, isTomorrow, isToday, startOfDay, startOfToday } from "date-fns";

export const RANGES = [
  "overdue",
  "today",
  "tomorrow",
  "week",
  "7days",
  "14days",
  "all",
] as const;

export type Range = (typeof RANGES)[number];

export const RANGE_LABELS: Record<Range, string> = {
  overdue: "Overdue",
  today: "Due Today",
  tomorrow: "Due Tomorrow",
  week: "This Week",
  "7days": "Next 7 Days",
  "14days": "Next 14 Days",
  all: "All",
};

export type DueItem = { dueDate: Date | null; status: "OPEN" | "DONE" };

export function matchesRange(item: DueItem, range: Range): boolean {
  if (range === "all") return true;
  if (!item.dueDate) return false;

  const due = startOfDay(item.dueDate);
  const today = startOfToday();

  switch (range) {
    case "overdue":
      return due < today && item.status === "OPEN";
    case "today":
      return isToday(due);
    case "tomorrow":
      return isTomorrow(due);
    case "week":
      return due >= today && due <= endOfWeek(today, { weekStartsOn: 1 });
    case "7days":
      return due >= today && due <= addDays(today, 7);
    case "14days":
      return due >= today && due <= addDays(today, 14);
    default:
      return true;
  }
}

/** Ascending by due date, with items that have no due date sorted last. */
export function sortByDueDate<T extends DueItem>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.getTime() - b.dueDate.getTime();
  });
}

// --- Kanban-by-due-date buckets ---

export const BUCKETS = ["overdue", "today", "week", "nextWeek", "later", "noDate"] as const;

export type Bucket = (typeof BUCKETS)[number];

export const BUCKET_LABELS: Record<Bucket, string> = {
  overdue: "Overdue",
  today: "Due Today",
  week: "Due This Week",
  nextWeek: "Due Next Week",
  later: "Later",
  noDate: "No Date",
};

/** Buckets a card can be dropped into — the rest (Overdue, Later) are populated automatically. */
export const DROPPABLE_BUCKETS: Bucket[] = ["today", "week", "nextWeek", "noDate"];

export function getBucket(item: DueItem): Bucket {
  if (!item.dueDate) return "noDate";
  const due = startOfDay(item.dueDate);
  const today = startOfToday();
  if (due < today) return "overdue";
  if (isToday(due)) return "today";
  if (due <= endOfWeek(today, { weekStartsOn: 1 })) return "week";
  if (due <= endOfWeek(addWeeks(today, 1), { weekStartsOn: 1 })) return "nextWeek";
  return "later";
}

/** The representative date to assign when a card is dropped into a bucket. */
export function bucketToDate(bucket: Bucket): Date | null {
  const today = startOfToday();
  switch (bucket) {
    case "today":
      return today;
    case "week":
      return endOfWeek(today, { weekStartsOn: 1 });
    case "nextWeek":
      return endOfWeek(addWeeks(today, 1), { weekStartsOn: 1 });
    default:
      return null;
  }
}
