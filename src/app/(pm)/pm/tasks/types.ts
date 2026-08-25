import type { PmProject, Subtask, Task } from "@prisma/client";

export type TaskRow = Subtask & { task: Task | null; pmProject: PmProject | null };
