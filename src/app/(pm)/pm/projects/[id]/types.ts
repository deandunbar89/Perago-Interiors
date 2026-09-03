import type {
  Client,
  Contact,
  Note,
  PmDocSubsection,
  PmDocument,
  PmProject,
  PmProjectVendor,
  Project,
  ProjectReportEntry,
  ScheduleItem,
  Snag,
  Subtask,
  User,
  Vendor,
} from "@prisma/client";

export type PmProjectDetail = PmProject & {
  client: (Client & { contacts: Contact[] }) | null;
  linkedTender: Project | null;
  scheduleItems: ScheduleItem[];
  subtasks: Subtask[];
  notes: (Note & { author: User | null })[];
  pmDocuments: (PmDocument & { uploadedBy: User | null })[];
  docSubsections: PmDocSubsection[];
  snags: (Snag & { openPhoto: PmDocument; closedPhoto: PmDocument | null; vendor: Vendor | null })[];
  vendors: (PmProjectVendor & { vendor: Vendor; documents: PmDocument[] })[];
  reportEntries: (ProjectReportEntry & { createdBy: User | null })[];
};
