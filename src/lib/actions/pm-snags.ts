"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile, deleteUploadedFile } from "@/lib/storage";
import { notifyAll } from "@/lib/notify";
import type { SnagCategory, SnagPriority, Trade } from "@/lib/constants";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export async function createSnag(pmProjectId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const description = (formData.get("description") as string)?.trim();
  if (!description) return { error: "Describe the snag" };

  const photo = formData.get("photo") as File | null;
  if (!photo || photo.size === 0) return { error: "A photo is required to raise a snag" };
  if (photo.size > MAX_FILE_SIZE) return { error: "Photo exceeds the 100MB limit" };

  const priority = (formData.get("priority") as SnagPriority) || "MEDIUM";
  const category = (formData.get("category") as SnagCategory) || "SNAG";
  const trade = (formData.get("trade") as Trade) || null;
  const location = (formData.get("location") as string)?.trim() || null;
  const vendorId = (formData.get("vendorId") as string) || null;

  const { storedName, size } = await saveUploadedFile(photo, `pm-${pmProjectId}`);
  const openPhoto = await prisma.pmDocument.create({
    data: {
      pmProjectId,
      category: "SITE_WORKS",
      originalName: photo.name,
      storedName,
      mimeType: photo.type || "application/octet-stream",
      size,
      uploadedById: session.user.id,
    },
  });

  await prisma.snag.create({
    data: {
      pmProjectId,
      description,
      priority,
      category,
      trade,
      location,
      vendorId,
      openPhotoId: openPhoto.id,
      createdById: session.user.id,
    },
  });

  const project = await prisma.pmProject.findUnique({ where: { id: pmProjectId }, select: { title: true } });
  await notifyAll(
    "SNAGS",
    {
      title: `New snag raised — ${project?.title ?? "a project"}`,
      body: description,
      link: `/pm/projects/${pmProjectId}?tab=snags`,
    },
    session.user.id
  );

  revalidatePath(`/pm/projects/${pmProjectId}`);
  revalidatePath("/snags");
  return { success: true };
}

export async function closeSnag(pmProjectId: string, snagId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const photo = formData.get("photo") as File | null;
  if (!photo || photo.size === 0) return { error: "A photo of the closed snag is required" };
  if (photo.size > MAX_FILE_SIZE) return { error: "Photo exceeds the 100MB limit" };

  const { storedName, size } = await saveUploadedFile(photo, `pm-${pmProjectId}`);
  const closedPhoto = await prisma.pmDocument.create({
    data: {
      pmProjectId,
      category: "SITE_WORKS",
      originalName: photo.name,
      storedName,
      mimeType: photo.type || "application/octet-stream",
      size,
      uploadedById: session.user.id,
    },
  });

  const snag = await prisma.snag.update({
    where: { id: snagId },
    data: { status: "CLOSED", closedAt: new Date(), closedPhotoId: closedPhoto.id },
  });

  const project = await prisma.pmProject.findUnique({ where: { id: pmProjectId }, select: { title: true } });
  await notifyAll(
    "SNAGS",
    {
      title: `Snag closed — ${project?.title ?? "a project"}`,
      body: snag.description,
      link: `/pm/projects/${pmProjectId}?tab=snags`,
    },
    session.user.id
  );

  revalidatePath(`/pm/projects/${pmProjectId}`);
  revalidatePath("/snags");
  return { success: true };
}

export async function deleteSnag(pmProjectId: string, snagId: string) {
  await requireAuth();

  const snag = await prisma.snag.findUnique({
    where: { id: snagId },
    include: { openPhoto: true, closedPhoto: true },
  });
  if (!snag || snag.pmProjectId !== pmProjectId) return;

  await prisma.snag.delete({ where: { id: snagId } });
  await prisma.pmDocument.deleteMany({
    where: { id: { in: [snag.openPhotoId, snag.closedPhotoId].filter((id): id is string => !!id) } },
  });

  await deleteUploadedFile(`pm-${pmProjectId}`, snag.openPhoto.storedName);
  if (snag.closedPhoto) await deleteUploadedFile(`pm-${pmProjectId}`, snag.closedPhoto.storedName);

  revalidatePath(`/pm/projects/${pmProjectId}`);
  revalidatePath("/snags");
}

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
}
