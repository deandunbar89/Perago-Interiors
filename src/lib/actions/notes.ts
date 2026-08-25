"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function createNote(projectId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const body = (formData.get("body") as string)?.trim();
  if (!body) return { error: "Note cannot be empty" };

  await prisma.note.create({
    data: { projectId, authorId: session.user.id, body },
  });

  await prisma.activity.create({
    data: {
      projectId,
      userId: session.user.id,
      type: "NOTE",
      message: "Added a note",
    },
  });

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function deleteNote(projectId: string, noteId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  await prisma.note.delete({ where: { id: noteId } });
  revalidatePath(`/projects/${projectId}`);
}
