"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function createScheduleItem(pmProjectId: string, formData: FormData) {
  await requireUserId();

  const title = (formData.get("title") as string)?.trim();
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  if (!title) return { error: "Title is required" };
  if (!startDate || !endDate) return { error: "Start and end dates are required" };
  if (new Date(endDate) < new Date(startDate)) return { error: "End date can't be before start date" };

  const last = await prisma.scheduleItem.findFirst({
    where: { pmProjectId },
    orderBy: { sortOrder: "desc" },
  });

  await prisma.scheduleItem.create({
    data: {
      pmProjectId,
      title,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
  });

  revalidatePath(`/pm/projects/${pmProjectId}`);
  return { success: true };
}

export async function updateScheduleItem(pmProjectId: string, itemId: string, formData: FormData) {
  await requireUserId();

  const title = (formData.get("title") as string)?.trim();
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const percentComplete = Number(formData.get("percentComplete") ?? 0);
  const status = (formData.get("status") as string) || "NOT_STARTED";
  if (!title) return { error: "Title is required" };
  if (!startDate || !endDate) return { error: "Start and end dates are required" };
  if (new Date(endDate) < new Date(startDate)) return { error: "End date can't be before start date" };

  await prisma.scheduleItem.update({
    where: { id: itemId },
    data: {
      title,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      percentComplete: Math.max(0, Math.min(100, percentComplete)),
      status: status as "NOT_STARTED" | "IN_PROGRESS" | "DONE",
    },
  });

  revalidatePath(`/pm/projects/${pmProjectId}`);
  return { success: true };
}

export async function updateScheduleItemProgress(
  pmProjectId: string,
  itemId: string,
  status: "NOT_STARTED" | "IN_PROGRESS" | "DONE"
) {
  await requireUserId();
  const percentComplete = status === "DONE" ? 100 : status === "NOT_STARTED" ? 0 : undefined;
  await prisma.scheduleItem.update({
    where: { id: itemId },
    data: { status, ...(percentComplete !== undefined ? { percentComplete } : {}) },
  });
  revalidatePath(`/pm/projects/${pmProjectId}`);
}

export async function deleteScheduleItem(pmProjectId: string, itemId: string) {
  await requireUserId();
  await prisma.scheduleItem.delete({ where: { id: itemId } });
  revalidatePath(`/pm/projects/${pmProjectId}`);
}
