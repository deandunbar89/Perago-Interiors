import type {
  Activity,
  Client,
  Contact,
  Document,
  EmailLog,
  Note,
  PmProject,
  Project,
  Subtask,
  User,
} from "@prisma/client";

export type ProjectDetail = Project & {
  client: (Client & { contacts: Contact[] }) | null;
  owner: User | null;
  documents: (Document & { uploadedBy: User | null })[];
  notes: (Note & { author: User | null })[];
  emailLogs: (EmailLog & { loggedBy: User | null })[];
  activities: (Activity & { user: User | null })[];
  subtasks: Subtask[];
  pmProject: PmProject | null;
};
