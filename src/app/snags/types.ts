import type { PmDocument, PmProject, Snag, Vendor } from "@prisma/client";

export type GlobalSnag = Snag & {
  pmProject: Pick<PmProject, "id" | "title">;
  vendor: Vendor | null;
  openPhoto: PmDocument;
  closedPhoto: PmDocument | null;
};
