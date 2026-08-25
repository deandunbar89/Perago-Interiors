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
  revalidatePath("/tasks");
  revalidatePath("/deadlines");
  revalidatePath("/dashboard");
  if (deadlineId) revalidatePath(`/deadlines/${deadlineId}`);
}

/** Adds a task scoped to one deadline — used on the deadline's own detail page. */
export async function createTaskForDeadline(deadlineId: string, formData: FormData) {
  const userId = await requireUserId();

  const title = (formData.get("title") as string)?.trim();
  if (!title) return { error: "Title is required" };

  const dueDate = formData.get("dueDate") ? new Date(formData.get("dueDate") as string) : null;

  await prisma.subtask.create({
    data: { taskId: deadlineId, title, dueDate, createdById: userId },
  });

  revalidateTaskPaths(deadlineId);
  return { success: true };
}

/** Adds a task tied directly to a project — used on the project's own Tasks tab, with no deadline link. */
export async function createTaskForProject(projectId: string, formData: FormData) {
  const userId = await requireUserId();

  const title = (formData.get("title") as string)?.trim();
  if (!title) return { error: "Title is required" };

  const dueDate = formData.get("dueDate") ? new Date(formData.get("dueDate") as string) : null;

  await prisma.subtask.create({
    data: { projectId, title, dueDate, createdById: userId },
  });

  revalidateTaskPaths();
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

/** Adds a task from the flat Tasks list — optionally linked to a deadline and/or a project. */
export async function createTask(_prevState: unknown, formData: FormData) {
  const userId = await requireUserId();

  const title = (formData.get("title") as string)?.trim();
  if (!title) return { error: "Title is required" };

  const dueDate = formData.get("dueDate") ? new Date(formData.get("dueDate") as string) : null;
  const deadlineId = (formData.get("deadlineId") as string) || null;
  const projectId = (formData.get("projectId") as string) || null;

  await prisma.subtask.create({
    data: { taskId: deadlineId, projectId, title, dueDate, createdById: userId },
  });

  revalidateTaskPaths(deadlineId);
  return { success: true };
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
