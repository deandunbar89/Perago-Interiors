import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { APP_SECTIONS, type AppSection } from "@/lib/constants";

export type Access = { role: string; sections: AppSection[] };

/** Full access for admins, otherwise the member's allow-list from the database (source of
 * truth is read fresh on every request, not cached in the session, so a permission change
 * takes effect immediately rather than waiting for the employee to log back in). */
export async function getAccess(): Promise<Access> {
  const session = await auth();
  if (!session?.user?.id) return { role: "MEMBER", sections: [] };
  if (session.user.role === "ADMIN") return { role: "ADMIN", sections: [...APP_SECTIONS] };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { allowedSections: true },
  });
  return { role: "MEMBER", sections: (user?.allowedSections ?? []) as AppSection[] };
}

export async function requireSectionAccess(section: AppSection) {
  const access = await getAccess();
  if (!access.sections.includes(section)) {
    redirect(`/?denied=${section}`);
  }
  return access;
}
