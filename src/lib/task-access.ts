import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type TaskViewer = { userId: string; isAdmin: boolean };

export async function getTaskViewer(): Promise<TaskViewer> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return { userId: session.user.id, isAdmin: session.user.role === "ADMIN" };
}

/** Prisma `where` fragment limiting tasks/deadlines to what this person may see: admins see
 * everything; members only see items assigned to them, created by them, or that they've been
 * tagged on. Works for both Task (deadlines) and Subtask (tasks) — same field names. */
export function taskVisibility(viewer: TaskViewer) {
  if (viewer.isAdmin) return {};
  return {
    OR: [
      { assigneeId: viewer.userId },
      { createdById: viewer.userId },
      { watchers: { some: { id: viewer.userId } } },
    ],
  };
}

type Ownership = { assigneeId: string | null; createdById: string | null; watchers: { id: string }[] };

export function canAccessTask(viewer: TaskViewer, task: Ownership) {
  return (
    viewer.isAdmin ||
    task.assigneeId === viewer.userId ||
    task.createdById === viewer.userId ||
    task.watchers.some((w) => w.id === viewer.userId)
  );
}

const ownershipSelect = { assigneeId: true, createdById: true, watchers: { select: { id: true } } } as const;

/** For tasks being updated/deleted by id: throws unless the viewer may touch it, so a member
 * can't edit someone else's task by guessing an id. */
export async function assertSubtaskAccess(viewer: TaskViewer, id: string) {
  const row = await prisma.subtask.findUnique({ where: { id }, select: ownershipSelect });
  if (!row || !canAccessTask(viewer, row)) throw new Error("Task not found");
}

export async function assertDeadlineAccess(viewer: TaskViewer, id: string) {
  const row = await prisma.task.findUnique({ where: { id }, select: ownershipSelect });
  if (!row || !canAccessTask(viewer, row)) throw new Error("Deadline not found");
}

/** Tags people on a task so they can see it (and get notified separately by the caller). */
export async function tagOnSubtask(id: string, userIds: string[]) {
  if (userIds.length === 0) return;
  await prisma.subtask.update({ where: { id }, data: { watchers: { connect: userIds.map((u) => ({ id: u })) } } });
}

export async function tagOnDeadline(id: string, userIds: string[]) {
  if (userIds.length === 0) return;
  await prisma.task.update({ where: { id }, data: { watchers: { connect: userIds.map((u) => ({ id: u })) } } });
}
