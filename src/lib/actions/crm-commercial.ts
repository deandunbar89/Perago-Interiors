"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile, deleteUploadedFile } from "@/lib/storage";
import { mirrorToDrive, createCrmCommercialDriveTemplate } from "@/lib/google-drive";
import type { UploadMode } from "@/lib/constants";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function createCommercialSection(projectId: string, formData: FormData) {
  await requireUserId();

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Name is required" };
  const mode = (formData.get("mode") as UploadMode) || "MULTIPLE";

  const [maxSort, project] = await Promise.all([
    prisma.crmCommercialSection.aggregate({ where: { projectId }, _max: { sortOrder: true } }),
    prisma.project.findUnique({ where: { id: projectId }, select: { title: true } }),
  ]);

  try {
    await prisma.crmCommercialSection.create({
      data: { projectId, name, mode, sortOrder: (maxSort._max.sortOrder ?? -1) + 1 },
    });
  } catch {
    return { error: "A section with this name already exists" };
  }

  if (project) void createCrmCommercialDriveTemplate(project.title, [name]);

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function deleteCommercialSection(projectId: string, sectionId: string) {
  await requireUserId();

  const section = await prisma.crmCommercialSection.findUnique({
    where: { id: sectionId },
    include: { documents: true },
  });
  if (!section || section.projectId !== projectId) return;

  for (const doc of section.documents) {
    await deleteUploadedFile(projectId, doc.storedName);
  }
  await prisma.crmCommercialSection.delete({ where: { id: sectionId } });

  revalidatePath(`/projects/${projectId}`);
}

export async function uploadCommercialDocument(projectId: string, sectionId: string, formData: FormData) {
  const userId = await requireUserId();

  const [section, project] = await Promise.all([
    prisma.crmCommercialSection.findUnique({ where: { id: sectionId } }),
    prisma.project.findUnique({ where: { id: projectId }, select: { title: true } }),
  ]);
  if (!section || section.projectId !== projectId) return { error: "Section not found" };

  const files = (formData.getAll("files") as File[]).filter((f) => f && f.size > 0);
  if (files.length === 0) return { error: "Choose at least one file" };
  if (section.mode === "SINGLE" && files.length > 1) {
    return { error: "This section only keeps the latest file — choose one file to upload" };
  }
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) return { error: `${file.name} exceeds the 100MB limit` };
  }

  if (section.mode === "SINGLE") {
    const existing = await prisma.document.findMany({ where: { commercialSectionId: sectionId } });
    for (const doc of existing) await deleteUploadedFile(projectId, doc.storedName);
    await prisma.document.deleteMany({ where: { commercialSectionId: sectionId } });
  }

  for (const file of files) {
    const { storedName, size } = await saveUploadedFile(file, projectId);
    await prisma.document.create({
      data: {
        projectId,
        commercialSectionId: sectionId,
        originalName: file.name,
        storedName,
        mimeType: file.type || "application/octet-stream",
        size,
        uploadedById: userId,
      },
    });

    if (project) {
      const buffer = Buffer.from(await file.arrayBuffer());
      await mirrorToDrive(
        ["CRM Projects", project.title, "Commercial", section.name],
        file.name,
        file.type || "application/octet-stream",
        buffer
      );
    }
  }

  await prisma.activity.create({
    data: {
      projectId,
      userId,
      type: "DOCUMENT",
      message: `Uploaded ${files.length} file${files.length > 1 ? "s" : ""} to Commercial — ${section.name}`,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}
