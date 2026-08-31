"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@/lib/constants";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function getMyNotifications() {
  const userId = await requireUserId();

  const [notifications, unreadCount, user] = await Promise.all([
    prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.notification.count({ where: { recipientId: userId, read: false } }),
    prisma.user.findUnique({ where: { id: userId }, select: { mutedNotificationTypes: true } }),
  ]);

  return { notifications, unreadCount, mutedTypes: user?.mutedNotificationTypes ?? [] };
}

export async function markNotificationRead(id: string) {
  const userId = await requireUserId();
  await prisma.notification.updateMany({ where: { id, recipientId: userId }, data: { read: true } });
}

export async function markAllNotificationsRead() {
  const userId = await requireUserId();
  await prisma.notification.updateMany({ where: { recipientId: userId, read: false }, data: { read: true } });
}

/** Self-service — a user's own notification preferences, not admin-controlled. */
export async function setNotificationPreference(type: NotificationType, enabled: boolean) {
  const userId = await requireUserId();

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { mutedNotificationTypes: true } });
  const muted = new Set(user?.mutedNotificationTypes ?? []);
  if (enabled) muted.delete(type);
  else muted.add(type);

  await prisma.user.update({ where: { id: userId }, data: { mutedNotificationTypes: Array.from(muted) } });
  revalidatePath("/", "layout");
}
