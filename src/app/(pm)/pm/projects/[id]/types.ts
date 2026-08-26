import type {
  Client,
  Contact,
  Note,
  PmDocSubsection,
  PmDocument,
  PmProject,
  Project,
  ScheduleItem,
  Snag,
  Subtask,
  User,
} from "@prisma/client";

export type PmProjectDetail = PmProject & {
  client: (Client & { contacts: Contact[] }) | null;
  linkedTender: Project | null;
  scheduleItems: ScheduleItem[];
  subtasks: Subtask[];
  notes: (Note & { author: User | null })[];
  pmDocuments: (PmDocument & { uploadedBy: User | null })[];
  docSubsections: PmDocSubsection[];
  snags: (Snag & { openPhoto: PmDocument; closedPhoto: PmDocument | null })[];
};
