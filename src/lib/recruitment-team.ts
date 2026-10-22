import { prisma } from "@/lib/prisma";

/** Everyone who can open Recruitment (admins, plus members with the section ticked) — the people a
 * recruitment task can be assigned to. */
export function getRecruitmentTeam() {
  return prisma.user.findMany({
    where: { OR: [{ role: "ADMIN" }, { allowedSections: { has: "RECRUITMENT" } }] },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
