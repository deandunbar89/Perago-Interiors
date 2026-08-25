import type { Project, Subtask, Task } from "@prisma/client";

export type DeadlineRow = Task & { project: Project | null; subtasks: Subtask[] };

export { RANGES, RANGE_LABELS, type Range } from "@/lib/date-ranges";
