"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { findMentionedUsers } from "@/lib/mentions";
import { notifyAssigned, notifyMentioned } from "@/lib/notify";
import { assertSubtaskAccess, getTaskViewer, tagOnSubtask } from "@/lib/task-access";
import type { TaskScope } from "@prisma/client";

async function requireViewer() {
  return getTaskViewer();
}

function revalidateForScope(scope: TaskScope, deadlineId?: string | null) {
  revalidatePath("/my-tasks");
  if (scope === "CRM") {
    revalidatePath("/tasks");
    revalidatePath("/deadlines");
    revalidatePath("/dashboard");
    if (deadlineId) revalidatePath(`/deadlines/${deadlineId}`);
  } else {
    revalidatePath("/pm/tasks");
    revalidatePath("/pm/deadlines");
    revalidatePath("/pm");
    if (deadlineId) revalidatePath(`/pm/deadlines/${deadlineId}`);
  }
}

export async function updateTaskTitle(id: string, title: string) {
  const viewer = await requireViewer();
  await assertSubtaskAccess(viewer, id);
  const trimmed = title.trim();
  if (!trimmed) return;
  const row = await prisma.subtask.update({ where: { id }, data: { title: trimmed } });
  revalidateForScope(row.scope, row.taskId);
  revalidatePath(`/my-tasks/${id}`);
}

export async function createTaskNote(subtaskId: string, formData: FormData) {
  const viewer = await requireViewer();
  await assertSubtaskAccess(viewer, subtaskId);

  const body = (formData.get("body") as string)?.trim();
  if (!body) return { error: "Note cannot be empty" };

  await prisma.note.create({ data: { subtaskId, authorId: viewer.userId, body } });

  const mentioned = await findMentionedUsers(body);
  const subtask = await prisma.subtask.findUnique({ where: { id: subtaskId }, select: { title: true } });
  // Tagging someone with @name also lets them open the task — otherwise the link in their
  // notification would lead to a task they aren't allowed to see.
  await tagOnSubtask(subtaskId, mentioned.map((u) => u.id));
  await notifyMentioned(
    mentioned.map((u) => u.id),
    { title: `You were mentioned in "${subtask?.title ?? "a task"}"`, body, link: `/my-tasks/${subtaskId}` },
    viewer.userId
  );

  revalidatePath(`/my-tasks/${subtaskId}`);
  return { success: true };
}

/** Tags a team member on a task: they can now see it and get a notification. */
export async function tagTaskPerson(subtaskId: string, userId: string) {
  const viewer = await requireViewer();
  await assertSubtaskAccess(viewer, subtaskId);

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!target) return { error: "That team member no longer exists" };

  const subtask = await prisma.subtask.findUnique({ where: { id: subtaskId }, select: { title: true } });
  await tagOnSubtask(subtaskId, [userId]);
  await notifyMentioned(
    [userId],
    { title: `You were tagged on "${subtask?.title ?? "a task"}"`, link: `/my-tasks/${subtaskId}` },
    viewer.userId
  );

  revalidatePath(`/my-tasks/${subtaskId}`);
  return { success: true };
}

export async function untagTaskPerson(subtaskId: string, userId: string) {
  const viewer = await requireViewer();
  await assertSubtaskAccess(viewer, subtaskId);
  await prisma.subtask.update({ where: { id: subtaskId }, data: { watchers: { disconnect: { id: userId } } } });
  revalidatePath(`/my-tasks/${subtaskId}`);
}

export async function updateTaskNote(subtaskId: string, noteId: string, body: string) {
  const viewer = await requireViewer();
  await assertSubtaskAccess(viewer, subtaskId);
  const trimmed = body.trim();
  if (!trimmed) return { error: "Note cannot be empty" };

  await prisma.note.update({ where: { id: noteId }, data: { body: trimmed } });
  revalidatePath(`/my-tasks/${subtaskId}`);
  return { success: true };
}

export async function deleteTaskNote(subtaskId: string, noteId: string) {
  const viewer = await requireViewer();
  await assertSubtaskAccess(viewer, subtaskId);
  await prisma.note.delete({ where: { id: noteId } });
  revalidatePath(`/my-tasks/${subtaskId}`);
}

/** Adds a task from the unified My Tasks page — always filed under a specific CRM tender or PM project. */
export async function createTask(_prevState: unknown, formData: FormData) {
  const viewer = await requireViewer();

  const title = (formData.get("title") as string)?.trim();
  if (!title) return { error: "Title is required" };

  const target = (formData.get("target") as string) || "";
  const dueDate = formData.get("dueDate") ? new Date(formData.get("dueDate") as string) : null;
  const assigneeId = (formData.get("assigneeId") as string) || viewer.userId;

  const assignee = await prisma.user.findUnique({ where: { id: assigneeId }, select: { id: true } });
  if (!assignee) return { error: "That team member no longer exists" };

  let projectId: string | null = null;
  let pmProjectId: string | null = null;
  let scope: TaskScope;

  if (target.startsWith("crm:")) {
    projectId = target.slice(4);
    scope = "CRM";
  } else if (target.startsWith("pm:")) {
    pmProjectId = target.slice(3);
    scope = "PM";
  } else {
    return { error: "Choose which tender or project this belongs to" };
  }

  const created = await prisma.subtask.create({
    data: { title, dueDate, projectId, pmProjectId, scope, createdById: viewer.userId, assigneeId },
  });

  await notifyAssigned(
    assigneeId,
    { title: `New task assigned to you — ${title}`, link: `/my-tasks/${created.id}` },
    viewer.userId
  );

  // "@name" typed into the title tags that person too (assignee already got their own notification).
  const mentionedIds = (await findMentionedUsers(title)).map((u) => u.id).filter((id) => id !== assigneeId);
  await tagOnSubtask(created.id, mentionedIds);
  await notifyMentioned(
    mentionedIds,
    { title: `You were mentioned in "${title}"`, link: `/my-tasks/${created.id}` },
    viewer.userId
  );

  revalidateForScope(scope);
  return { success: true };
}

export async function updateTaskAssignee(id: string, assigneeId: string) {
  const viewer = await requireViewer();
  await assertSubtaskAccess(viewer, id);

  const assignee = await prisma.user.findUnique({ where: { id: assigneeId }, select: { id: true } });
  if (!assignee) return { error: "That team member no longer exists" };

  const row = await prisma.subtask.update({ where: { id }, data: { assigneeId } });
  await notifyAssigned(
    assigneeId,
    { title: `Task assigned to you — ${row.title}`, link: `/my-tasks/${id}` },
    viewer.userId
  );

  revalidateForScope(row.scope, row.taskId);
  revalidatePath(`/my-tasks/${id}`);
  return { success: true };
}

export async function updateTaskStatus(id: string, status: "OPEN" | "DONE") {
  const viewer = await requireViewer();
  await assertSubtaskAccess(viewer, id);
  const row = await prisma.subtask.update({ where: { id }, data: { status } });
  revalidateForScope(row.scope, row.taskId);
  revalidatePath(`/my-tasks/${id}`);
}

export async function updateTaskDueDate(id: string, dueDate: string | null) {
  const viewer = await requireViewer();
  await assertSubtaskAccess(viewer, id);
  const row = await prisma.subtask.update({
    where: { id },
    data: { dueDate: dueDate ? new Date(dueDate) : null },
  });
  revalidateForScope(row.scope, row.taskId);
  revalidatePath(`/my-tasks/${id}`);
}

export async function deleteTask(id: string) {
  const viewer = await requireViewer();
  await assertSubtaskAccess(viewer, id);
  const row = await prisma.subtask.delete({ where: { id } });
  revalidateForScope(row.scope, row.taskId);
}
