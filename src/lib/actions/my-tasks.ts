"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { TaskScope } from "@prisma/client";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
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
  await requireUserId();
  const trimmed = title.trim();
  if (!trimmed) return;
  const row = await prisma.subtask.update({ where: { id }, data: { title: trimmed } });
  revalidateForScope(row.scope, row.taskId);
  revalidatePath(`/my-tasks/${id}`);
}

export async function createTaskNote(subtaskId: string, formData: FormData) {
  const userId = await requireUserId();

  const body = (formData.get("body") as string)?.trim();
  if (!body) return { error: "Note cannot be empty" };

  await prisma.note.create({ data: { subtaskId, authorId: userId, body } });
  revalidatePath(`/my-tasks/${subtaskId}`);
  return { success: true };
}

export async function updateTaskNote(subtaskId: string, noteId: string, body: string) {
  await requireUserId();
  const trimmed = body.trim();
  if (!trimmed) return { error: "Note cannot be empty" };

  await prisma.note.update({ where: { id: noteId }, data: { body: trimmed } });
  revalidatePath(`/my-tasks/${subtaskId}`);
  return { success: true };
}

export async function deleteTaskNote(subtaskId: string, noteId: string) {
  await requireUserId();
  await prisma.note.delete({ where: { id: noteId } });
  revalidatePath(`/my-tasks/${subtaskId}`);
}

/** Adds a task from the unified My Tasks page — always filed under a specific CRM tender or PM project. */
export async function createTask(_prevState: unknown, formData: FormData) {
  const userId = await requireUserId();

  const title = (formData.get("title") as string)?.trim();
  if (!title) return { error: "Title is required" };

  const target = (formData.get("target") as string) || "";
  const dueDate = formData.get("dueDate") ? new Date(formData.get("dueDate") as string) : null;

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

  await prisma.subtask.create({
    data: { title, dueDate, projectId, pmProjectId, scope, createdById: userId },
  });

  revalidateForScope(scope);
  return { success: true };
}

export async function updateTaskStatus(id: string, status: "OPEN" | "DONE") {
  await requireUserId();
  const row = await prisma.subtask.update({ where: { id }, data: { status } });
  revalidateForScope(row.scope, row.taskId);
  revalidatePath(`/my-tasks/${id}`);
}

export async function updateTaskDueDate(id: string, dueDate: string | null) {
  await requireUserId();
  const row = await prisma.subtask.update({
    where: { id },
    data: { dueDate: dueDate ? new Date(dueDate) : null },
  });
  revalidateForScope(row.scope, row.taskId);
  revalidatePath(`/my-tasks/${id}`);
}

export async function deleteTask(id: string) {
  await requireUserId();
  const row = await prisma.subtask.delete({ where: { id } });
  revalidateForScope(row.scope, row.taskId);
}
