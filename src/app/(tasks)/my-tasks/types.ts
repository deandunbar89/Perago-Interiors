import type { Project, PmProject, Subtask, Task } from "@prisma/client";

export type UnifiedTaskRow = Subtask & {
  task: Task | null;
  project: Project | null;
  pmProject: PmProject | null;
};

export { RANGES, RANGE_LABELS, type Range } from "@/lib/date-ranges";
