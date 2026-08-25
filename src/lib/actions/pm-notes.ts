"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function createPmNote(pmProjectId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const body = (formData.get("body") as string)?.trim();
  if (!body) return { error: "Note cannot be empty" };

  await prisma.note.create({
    data: { pmProjectId, authorId: session.user.id, body },
  });

  revalidatePath(`/pm/projects/${pmProjectId}`);
  return { success: true };
}

export async function updatePmNote(pmProjectId: string, noteId: string, body: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const trimmed = body.trim();
  if (!trimmed) return { error: "Note cannot be empty" };

  await prisma.note.update({ where: { id: noteId }, data: { body: trimmed } });
  revalidatePath(`/pm/projects/${pmProjectId}`);
  return { success: true };
}

export async function deletePmNote(pmProjectId: string, noteId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  await prisma.note.delete({ where: { id: noteId } });
  revalidatePath(`/pm/projects/${pmProjectId}`);
}
