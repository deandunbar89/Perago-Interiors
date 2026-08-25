import type { Note, PmProject, Project, Subtask, Task, User } from "@prisma/client";

export type TaskDetail = Subtask & {
  task: Task | null;
  project: Project | null;
  pmProject: PmProject | null;
  notes: (Note & { author: User | null })[];
};
