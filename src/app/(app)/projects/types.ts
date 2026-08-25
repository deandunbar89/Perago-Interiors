import type { Client, Project, User } from "@prisma/client";

export type ProjectRow = Project & { client: Client | null; owner: User | null };
