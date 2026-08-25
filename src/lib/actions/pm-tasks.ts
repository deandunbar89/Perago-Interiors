"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

function revalidateTaskPaths(deadlineId?: string | null) {
  revalidatePath("/pm/tasks");
  revalidatePath("/pm/deadlines");
  revalidatePath("/pm");
  if (deadlineId) revalidatePath(`/pm/deadlines/${deadlineId}`);
}

/** Adds a task scoped to one deadline — used on the deadline's own detail page. */
export async function createTaskForDeadline(deadlineId: string, formData: FormData) {
  const userId = await requireUserId();

  const title = (formData.get("title") as string)?.trim();
  if (!title) return { error: "Title is required" };

  const dueDate = formData.get("dueDate") ? new Date(formData.get("dueDate") as string) : null;

  await prisma.subtask.create({
    data: { taskId: deadlineId, title, dueDate, scope: "PM", createdById: userId },
  });

  revalidateTaskPaths(deadlineId);
  return { success: true };
}

/** Adds a task tied directly to a PM project — used on the project's own Tasks tab, with no deadline link. */
export async function createTaskForPmProject(pmProjectId: string, formData: FormData) {
  const userId = await requireUserId();

  const title = (formData.get("title") as string)?.trim();
  if (!title) return { error: "Title is required" };

  const dueDate = formData.get("dueDate") ? new Date(formData.get("dueDate") as string) : null;

  await prisma.subtask.create({
    data: { pmProjectId, title, dueDate, scope: "PM", createdById: userId },
  });

  revalidateTaskPaths();
  revalidatePath("/pm/projects");
  revalidatePath(`/pm/projects/${pmProjectId}`);
  return { success: true };
}

/** Adds a task from the flat Tasks list — optionally linked to a deadline and/or a PM project. */
export async function createTask(_prevState: unknown, formData: FormData) {
  const userId = await requireUserId();

  const title = (formData.get("title") as string)?.trim();
  if (!title) return { error: "Title is required" };

  const dueDate = formData.get("dueDate") ? new Date(formData.get("dueDate") as string) : null;
  const deadlineId = (formData.get("deadlineId") as string) || null;
  const pmProjectId = (formData.get("pmProjectId") as string) || null;

  await prisma.subtask.create({
    data: { taskId: deadlineId, pmProjectId, title, dueDate, scope: "PM", createdById: userId },
  });

  revalidateTaskPaths(deadlineId);
  return { success: true };
}

export async function updateTaskTitle(id: string, title: string) {
  await requireUserId();
  const trimmed = title.trim();
  if (!trimmed) return;
  const row = await prisma.subtask.update({ where: { id }, data: { title: trimmed } });
  revalidateTaskPaths(row.taskId);
}

export async function updateTaskStatus(id: string, status: "OPEN" | "DONE") {
  await requireUserId();
  const row = await prisma.subtask.update({ where: { id }, data: { status } });
  revalidateTaskPaths(row.taskId);
}

export async function updateTaskDueDate(id: string, dueDate: string | null) {
  await requireUserId();
  const row = await prisma.subtask.update({
    where: { id },
    data: { dueDate: dueDate ? new Date(dueDate) : null },
  });
  revalidateTaskPaths(row.taskId);
}

export async function deleteTask(id: string) {
  await requireUserId();
  const row = await prisma.subtask.delete({ where: { id } });
  revalidateTaskPaths(row.taskId);
}
