import type { PmProject, Project, Subtask, Task, User } from "@prisma/client";

export type UnifiedTaskRow = Subtask & {
  task: Task | null;
  project: Project | null;
  pmProject: PmProject | null;
  assignee: User | null;
};

export type TeamMember = { id: string; name: string };

export { RANGES, RANGE_LABELS, type Range } from "@/lib/date-ranges";
