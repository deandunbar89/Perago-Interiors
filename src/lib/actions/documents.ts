"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile, deleteUploadedFile } from "@/lib/storage";
import type { DocCategory } from "@/lib/constants";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export async function uploadDocument(projectId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const files = formData.getAll("files") as File[];
  const category = (formData.get("category") as DocCategory) || "OTHER";

  const validFiles = files.filter((f) => f && f.size > 0);
  if (validFiles.length === 0) return { error: "Choose at least one file" };

  for (const file of validFiles) {
    if (file.size > MAX_FILE_SIZE) {
      return { error: `${file.name} exceeds the 100MB limit` };
    }
  }

  for (const file of validFiles) {
    const { storedName, size } = await saveUploadedFile(file, projectId);
    await prisma.document.create({
      data: {
        projectId,
        category,
        originalName: file.name,
        storedName,
        mimeType: file.type || "application/octet-stream",
        size,
        uploadedById: session.user.id,
      },
    });
  }

  await prisma.activity.create({
    data: {
      projectId,
      userId: session.user.id,
      type: "DOCUMENT",
      message: `Uploaded ${validFiles.length} file${validFiles.length > 1 ? "s" : ""}`,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function deleteDocument(projectId: string, documentId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) return;

  await prisma.document.delete({ where: { id: documentId } });
  await deleteUploadedFile(projectId, doc.storedName);

  revalidatePath(`/projects/${projectId}`);
}
