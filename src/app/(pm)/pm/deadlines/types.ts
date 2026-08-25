import type { PmProject, Subtask, Task } from "@prisma/client";

export type DeadlineRow = Task & { pmProject: PmProject | null; subtasks: Subtask[] };

export { RANGES, RANGE_LABELS, type Range } from "@/lib/date-ranges";
