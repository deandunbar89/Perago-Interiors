import type { AiSubscriptionStatus } from "@/lib/constants";

export type AiSubscriptionRow = {
  id: string;
  name: string;
  url: string | null;
  username: string | null;
  plan: string | null;
  cost: string | null;
  renewalDate: Date | null;
  notes: string | null;
  status: AiSubscriptionStatus;
  createdAt: Date;
  updatedAt: Date;
  hasPassword: boolean;
};
