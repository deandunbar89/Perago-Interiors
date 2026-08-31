import { prisma } from "@/lib/prisma";

/** A user's @mention handle is their name with spaces stripped, lowercased — e.g. "John Smith" -> "johnsmith". */
export function mentionHandle(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "");
}

/** Scans free text for @handle tokens and resolves them against real users. Matches either
 * the full-name handle ("@deandunbar") or a first name alone ("@dean") when it's unique. */
export async function findMentionedUsers(text: string): Promise<{ id: string; name: string }[]> {
  const handles = [...text.matchAll(/@([a-z0-9]+)/gi)].map((m) => m[1].toLowerCase());
  if (handles.length === 0) return [];

  const users = await prisma.user.findMany({ select: { id: true, name: true } });

  const firstNameCounts = new Map<string, number>();
  for (const u of users) {
    const first = u.name.trim().split(/\s+/)[0]?.toLowerCase();
    if (first) firstNameCounts.set(first, (firstNameCounts.get(first) ?? 0) + 1);
  }

  const byHandle = new Map<string, { id: string; name: string }>();
  for (const u of users) {
    byHandle.set(mentionHandle(u.name), u);
    const first = u.name.trim().split(/\s+/)[0]?.toLowerCase();
    if (first && firstNameCounts.get(first) === 1) byHandle.set(first, u);
  }

  const found = new Map<string, { id: string; name: string }>();
  for (const handle of handles) {
    const user = byHandle.get(handle);
    if (user) found.set(user.id, user);
  }
  return Array.from(found.values());
}
