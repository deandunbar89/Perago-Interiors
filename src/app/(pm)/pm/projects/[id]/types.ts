import type { Client, Contact, Note, PmDocument, PmProject, Project, ScheduleItem, Subtask, User } from "@prisma/client";

export type PmProjectDetail = PmProject & {
  client: (Client & { contacts: Contact[] }) | null;
  linkedTender: Project | null;
  scheduleItems: ScheduleItem[];
  subtasks: Subtask[];
  notes: (Note & { author: User | null })[];
  pmDocuments: (PmDocument & { uploadedBy: User | null })[];
};
