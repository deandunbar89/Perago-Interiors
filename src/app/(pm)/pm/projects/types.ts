import type { Client, PmProject, Project, ScheduleItem } from "@prisma/client";

export type PmProjectRow = PmProject & {
  client: Client | null;
  linkedTender: Project | null;
  scheduleItems: Pick<ScheduleItem, "percentComplete" | "status">[];
};
