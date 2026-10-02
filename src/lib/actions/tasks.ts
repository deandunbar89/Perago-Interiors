"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { notifyAssigned } from "@/lib/notify";
import { assertSubtaskAccess, getTaskViewer } from "@/lib/task-access";

type Viewer = Awaited<ReturnType<typeof getTaskViewer>>;

/** Picks who a new task belongs to: the chosen team member if one was sent, otherwise the creator. */
async function resolveAssignee(viewer: Viewer, formData: FormData) {
  const chosen = (formData.get("assigneeId") as string) || viewer.userId;
  const exists = await prisma.user.findUnique({ where: { id: chosen }, select: { id: true } });
  return exists ? chosen : viewer.userId;
}

function revalidateTaskPaths(deadlineId?: string | null) {
  revalidatePath("/tasks");
  revalidatePath("/my-tasks");
  revalidatePath("/deadlines");
  revalidatePath("/dashboard");
  if (deadlineId) revalidatePath(`/deadlines/${deadlineId}`);
}

/** Adds a task scoped to one deadline — used on the deadline's own detail page. */
export async function createTaskForDeadline(deadlineId: string, formData: FormData) {
  const viewer = await getTaskViewer();

  const title = (formData.get("title") as string)?.trim();
  if (!title) return { error: "Title is required" };

  const dueDate = formData.get("dueDate") ? new Date(formData.get("dueDate") as string) : null;
  const assigneeId = await resolveAssignee(viewer, formData);

  const created = await prisma.subtask.create({
    data: { taskId: deadlineId, title, dueDate, createdById: viewer.userId, assigneeId },
  });
  await notifyAssigned(assigneeId, { title: `New task assigned to you — ${title}`, link: `/my-tasks/${created.id}` }, viewer.userId);

  revalidateTaskPaths(deadlineId);
  return { success: true };
}

/** Adds a task tied directly to a project — used on the project's own Tasks tab, with no deadline link. */
export async function createTaskForProject(projectId: string, formData: FormData) {
  const viewer = await getTaskViewer();

  const title = (formData.get("title") as string)?.trim();
  if (!title) return { error: "Title is required" };

  const dueDate = formData.get("dueDate") ? new Date(formData.get("dueDate") as string) : null;
  const assigneeId = await resolveAssignee(viewer, formData);

  const created = await prisma.subtask.create({
    data: { projectId, title, dueDate, createdById: viewer.userId, assigneeId },
  });
  await notifyAssigned(assigneeId, { title: `New task assigned to you — ${title}`, link: `/my-tasks/${created.id}` }, viewer.userId);

  revalidateTaskPaths();
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

/** Adds a task from the flat Tasks list — optionally linked to a deadline and/or a project. */
export async function createTask(_prevState: unknown, formData: FormData) {
  const viewer = await getTaskViewer();

  const title = (formData.get("title") as string)?.trim();
  if (!title) return { error: "Title is required" };

  const dueDate = formData.get("dueDate") ? new Date(formData.get("dueDate") as string) : null;
  const deadlineId = (formData.get("deadlineId") as string) || null;
  const projectId = (formData.get("projectId") as string) || null;
  const assigneeId = await resolveAssignee(viewer, formData);

  const created = await prisma.subtask.create({
    data: { taskId: deadlineId, projectId, title, dueDate, createdById: viewer.userId, assigneeId },
  });
  await notifyAssigned(assigneeId, { title: `New task assigned to you — ${title}`, link: `/my-tasks/${created.id}` }, viewer.userId);

  revalidateTaskPaths(deadlineId);
  return { success: true };
}

export async function updateTaskStatus(id: string, status: "OPEN" | "DONE") {
  const viewer = await getTaskViewer();
  await assertSubtaskAccess(viewer, id);
  const row = await prisma.subtask.update({ where: { id }, data: { status } });
  revalidateTaskPaths(row.taskId);
}

export async function updateTaskDueDate(id: string, dueDate: string | null) {
  const viewer = await getTaskViewer();
  await assertSubtaskAccess(viewer, id);
  const row = await prisma.subtask.update({
    where: { id },
    data: { dueDate: dueDate ? new Date(dueDate) : null },
  });
  revalidateTaskPaths(row.taskId);
}

export async function deleteTask(id: string) {
  const viewer = await getTaskViewer();
  await assertSubtaskAccess(viewer, id);
  const row = await prisma.subtask.delete({ where: { id } });
  revalidateTaskPaths(row.taskId);
}
