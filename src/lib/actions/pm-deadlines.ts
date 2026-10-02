"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { findMentionedUsers } from "@/lib/mentions";
import { notifyAssigned, notifyMentioned } from "@/lib/notify";
import { assertDeadlineAccess, getTaskViewer, tagOnDeadline } from "@/lib/task-access";

function revalidateDeadlinePaths() {
  revalidatePath("/pm/deadlines");
  revalidatePath("/pm/tasks");
  revalidatePath("/pm");
}

export async function createDeadline(_prevState: unknown, formData: FormData) {
  const viewer = await getTaskViewer();

  const title = (formData.get("title") as string)?.trim();
  if (!title) return { error: "Title is required" };

  const dueDate = formData.get("dueDate") ? new Date(formData.get("dueDate") as string) : null;
  const pmProjectId = (formData.get("pmProjectId") as string) || null;
  const note = (formData.get("note") as string)?.trim();

  const chosen = (formData.get("assigneeId") as string) || viewer.userId;
  const assigneeExists = await prisma.user.findUnique({ where: { id: chosen }, select: { id: true } });
  const assigneeId = assigneeExists ? chosen : viewer.userId;

  const deadline = await prisma.task.create({
    data: { title, dueDate, pmProjectId, scope: "PM", createdById: viewer.userId, assigneeId },
  });
  await notifyAssigned(
    assigneeId,
    { title: `Deadline assigned to you — ${title}`, link: `/pm/deadlines/${deadline.id}` },
    viewer.userId
  );

  if (note) {
    await prisma.taskNote.create({
      data: { taskId: deadline.id, authorId: viewer.userId, body: note },
    });
    const mentioned = await findMentionedUsers(note);
    await tagOnDeadline(deadline.id, mentioned.map((u) => u.id));
    await notifyMentioned(
      mentioned.map((u) => u.id),
      { title: `You were mentioned in "${title}"`, body: note, link: `/pm/deadlines/${deadline.id}` },
      viewer.userId
    );
  }

  revalidateDeadlinePaths();
  return { success: true };
}

export async function updateDeadlineStatus(deadlineId: string, status: "OPEN" | "DONE") {
  const viewer = await getTaskViewer();
  await assertDeadlineAccess(viewer, deadlineId);
  await prisma.task.update({ where: { id: deadlineId }, data: { status } });
  revalidateDeadlinePaths();
  revalidatePath(`/pm/deadlines/${deadlineId}`);
}

export async function updateDeadlineDueDate(deadlineId: string, dueDate: string | null) {
  const viewer = await getTaskViewer();
  await assertDeadlineAccess(viewer, deadlineId);
  await prisma.task.update({
    where: { id: deadlineId },
    data: { dueDate: dueDate ? new Date(dueDate) : null },
  });
  revalidateDeadlinePaths();
  revalidatePath(`/pm/deadlines/${deadlineId}`);
}

export async function deleteDeadline(deadlineId: string) {
  const viewer = await getTaskViewer();
  await assertDeadlineAccess(viewer, deadlineId);
  await prisma.task.delete({ where: { id: deadlineId } });
  revalidateDeadlinePaths();
}

export async function addDeadlineNote(deadlineId: string, formData: FormData) {
  const viewer = await getTaskViewer();
  await assertDeadlineAccess(viewer, deadlineId);

  const body = (formData.get("body") as string)?.trim();
  if (!body) return { error: "Note cannot be empty" };

  await prisma.taskNote.create({
    data: { taskId: deadlineId, authorId: viewer.userId, body },
  });

  const mentioned = await findMentionedUsers(body);
  const deadline = await prisma.task.findUnique({ where: { id: deadlineId }, select: { title: true } });
  await tagOnDeadline(deadlineId, mentioned.map((u) => u.id));
  await notifyMentioned(
    mentioned.map((u) => u.id),
    { title: `You were mentioned in "${deadline?.title ?? "a deadline"}"`, body, link: `/pm/deadlines/${deadlineId}` },
    viewer.userId
  );

  revalidatePath(`/pm/deadlines/${deadlineId}`);
  return { success: true };
}

export async function deleteDeadlineNote(deadlineId: string, noteId: string) {
  const viewer = await getTaskViewer();
  await assertDeadlineAccess(viewer, deadlineId);
  await prisma.taskNote.delete({ where: { id: noteId } });
  revalidatePath(`/pm/deadlines/${deadlineId}`);
}
