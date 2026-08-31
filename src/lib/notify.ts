import { prisma } from "@/lib/prisma";
import type { AppSection } from "@/lib/constants";

type NotifyPayload = { title: string; body?: string; link: string };

/** Notifies every user who can currently open the given section (admins always can),
 * skipping whoever has muted that category, and the actor who triggered it. */
export async function notifyAll(section: AppSection, payload: NotifyPayload, actorUserId?: string) {
  const users = await prisma.user.findMany({
    select: { id: true, role: true, allowedSections: true, mutedNotificationTypes: true },
  });

  const recipients = users.filter((u) => {
    if (u.id === actorUserId) return false;
    if (u.mutedNotificationTypes.includes(section)) return false;
    return u.role === "ADMIN" || u.allowedSections.includes(section);
  });
  if (recipients.length === 0) return;

  await prisma.notification.createMany({
    data: recipients.map((r) => ({
      recipientId: r.id,
      type: section,
      title: payload.title,
      body: payload.body,
      link: payload.link,
    })),
  });
}

/** Notifies specific users directly (used for @mentions), regardless of section access —
 * a mention is a direct address, not a broadcast about a section's activity. */
export async function notifyMentioned(userIds: string[], payload: NotifyPayload, actorUserId?: string) {
  if (userIds.length === 0) return;

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, mutedNotificationTypes: true },
  });
  const recipients = users.filter((u) => u.id !== actorUserId && !u.mutedNotificationTypes.includes("MENTION"));
  if (recipients.length === 0) return;

  await prisma.notification.createMany({
    data: recipients.map((r) => ({
      recipientId: r.id,
      type: "MENTION" as const,
      title: payload.title,
      body: payload.body,
      link: payload.link,
    })),
  });
}
