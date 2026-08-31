"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { AppSection } from "@/lib/constants";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Admin access required");
  }
}

export async function setUserSectionAccess(userId: string, section: AppSection, allowed: boolean) {
  await requireAdmin();

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { allowedSections: true, role: true } });
  if (!user || user.role === "ADMIN") return;

  const current = new Set(user.allowedSections);
  if (allowed) current.add(section);
  else current.delete(section);

  await prisma.user.update({ where: { id: userId }, data: { allowedSections: Array.from(current) } });
  revalidatePath("/settings");
}
