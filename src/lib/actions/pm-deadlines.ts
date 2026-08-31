"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { findMentionedUsers } from "@/lib/mentions";
import { notifyMentioned } from "@/lib/notify";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

function revalidateDeadlinePaths() {
  revalidatePath("/pm/deadlines");
  revalidatePath("/pm/tasks");
  revalidatePath("/pm");
}

export async function createDeadline(_prevState: unknown, formData: FormData) {
  const userId = await requireUserId();

  const title = (formData.get("title") as string)?.trim();
  if (!title) return { error: "Title is required" };

  const dueDate = formData.get("dueDate") ? new Date(formData.get("dueDate") as string) : null;
  const pmProjectId = (formData.get("pmProjectId") as string) || null;
  const note = (formData.get("note") as string)?.trim();

  const deadline = await prisma.task.create({
    data: { title, dueDate, pmProjectId, scope: "PM", createdById: userId },
  });

  if (note) {
    await prisma.taskNote.create({
      data: { taskId: deadline.id, authorId: userId, body: note },
    });
    const mentioned = await findMentionedUsers(note);
    await notifyMentioned(
      mentioned.map((u) => u.id),
      { title: `You were mentioned in "${title}"`, body: note, link: `/pm/deadlines/${deadline.id}` },
      userId
    );
  }

  revalidateDeadlinePaths();
  return { success: true };
}

export async function updateDeadlineStatus(deadlineId: string, status: "OPEN" | "DONE") {
  await requireUserId();
  await prisma.task.update({ where: { id: deadlineId }, data: { status } });
  revalidateDeadlinePaths();
  revalidatePath(`/pm/deadlines/${deadlineId}`);
}

export async function updateDeadlineDueDate(deadlineId: string, dueDate: string | null) {
  await requireUserId();
  await prisma.task.update({
    where: { id: deadlineId },
    data: { dueDate: dueDate ? new Date(dueDate) : null },
  });
  revalidateDeadlinePaths();
  revalidatePath(`/pm/deadlines/${deadlineId}`);
}

export async function deleteDeadline(deadlineId: string) {
  await requireUserId();
  await prisma.task.delete({ where: { id: deadlineId } });
  revalidateDeadlinePaths();
}

export async function addDeadlineNote(deadlineId: string, formData: FormData) {
  const userId = await requireUserId();

  const body = (formData.get("body") as string)?.trim();
  if (!body) return { error: "Note cannot be empty" };

  await prisma.taskNote.create({
    data: { taskId: deadlineId, authorId: userId, body },
  });

  const mentioned = await findMentionedUsers(body);
  const deadline = await prisma.task.findUnique({ where: { id: deadlineId }, select: { title: true } });
  await notifyMentioned(
    mentioned.map((u) => u.id),
    { title: `You were mentioned in "${deadline?.title ?? "a deadline"}"`, body, link: `/pm/deadlines/${deadlineId}` },
    userId
  );

  revalidatePath(`/pm/deadlines/${deadlineId}`);
  return { success: true };
}

export async function deleteDeadlineNote(deadlineId: string, noteId: string) {
  await requireUserId();
  await prisma.taskNote.delete({ where: { id: noteId } });
  revalidatePath(`/pm/deadlines/${deadlineId}`);
}
