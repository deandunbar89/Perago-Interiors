"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile, deleteUploadedFile } from "@/lib/storage";
import type { PmDocCategory } from "@/lib/constants";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export async function uploadPmDocument(pmProjectId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const files = formData.getAll("files") as File[];
  const category = formData.get("category") as PmDocCategory;

  const validFiles = files.filter((f) => f && f.size > 0);
  if (validFiles.length === 0) return { error: "Choose at least one file" };

  for (const file of validFiles) {
    if (file.size > MAX_FILE_SIZE) {
      return { error: `${file.name} exceeds the 100MB limit` };
    }
  }

  for (const file of validFiles) {
    const { storedName, size } = await saveUploadedFile(file, `pm-${pmProjectId}`);
    await prisma.pmDocument.create({
      data: {
        pmProjectId,
        category,
        originalName: file.name,
        storedName,
        mimeType: file.type || "application/octet-stream",
        size,
        uploadedById: session.user.id,
      },
    });
  }

  revalidatePath(`/pm/projects/${pmProjectId}`);
  return { success: true };
}

export async function deletePmDocument(pmProjectId: string, documentId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const doc = await prisma.pmDocument.findUnique({ where: { id: documentId } });
  if (!doc) return;

  await prisma.pmDocument.delete({ where: { id: documentId } });
  await deleteUploadedFile(`pm-${pmProjectId}`, doc.storedName);

  revalidatePath(`/pm/projects/${pmProjectId}`);
}
