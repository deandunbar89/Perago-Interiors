import type { Project, Subtask, Task } from "@prisma/client";

export type TaskRow = Subtask & { task: Task | null; project: Project | null };
