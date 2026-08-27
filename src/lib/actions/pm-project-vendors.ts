"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile, deleteUploadedFile } from "@/lib/storage";
import { mirrorToDrive } from "@/lib/google-drive";
import { VENDOR_DOC_TYPE_LABELS, type VendorDocType } from "@/lib/constants";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
}

export async function addVendorToProject(pmProjectId: string, vendorId: string) {
  await requireAuth();
  try {
    await prisma.pmProjectVendor.create({ data: { pmProjectId, vendorId } });
  } catch {
    return { error: "That vendor is already on this project" };
  }
  revalidatePath(`/pm/projects/${pmProjectId}`);
  return { success: true };
}

export async function updateProjectVendorScope(pmProjectId: string, pmProjectVendorId: string, formData: FormData) {
  await requireAuth();
  const scope = (formData.get("scope") as string) || null;
  await prisma.pmProjectVendor.update({ where: { id: pmProjectVendorId }, data: { scope } });
  revalidatePath(`/pm/projects/${pmProjectId}`);
  return { success: true };
}

export async function removeVendorFromProject(pmProjectId: string, pmProjectVendorId: string) {
  await requireAuth();

  const entry = await prisma.pmProjectVendor.findUnique({
    where: { id: pmProjectVendorId },
    include: { documents: true },
  });
  if (!entry || entry.pmProjectId !== pmProjectId) return;

  for (const doc of entry.documents) {
    await deleteUploadedFile(`pm-${pmProjectId}`, doc.storedName);
  }
  await prisma.pmProjectVendor.delete({ where: { id: pmProjectVendorId } });

  revalidatePath(`/pm/projects/${pmProjectId}`);
}

export async function uploadVendorDocument(
  pmProjectId: string,
  pmProjectVendorId: string,
  vendorDocType: VendorDocType,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const entry = await prisma.pmProjectVendor.findUnique({
    where: { id: pmProjectVendorId },
    include: { vendor: true, pmProject: { select: { title: true } } },
  });
  if (!entry || entry.pmProjectId !== pmProjectId) return { error: "Vendor not found on this project" };

  const files = formData.getAll("files") as File[];
  const validFiles = files.filter((f) => f && f.size > 0);
  if (validFiles.length === 0) return { error: "Choose at least one file" };

  for (const file of validFiles) {
    if (file.size > MAX_FILE_SIZE) return { error: `${file.name} exceeds the 100MB limit` };
  }

  for (const file of validFiles) {
    const { storedName, size } = await saveUploadedFile(file, `pm-${pmProjectId}`);
    await prisma.pmDocument.create({
      data: {
        pmProjectId,
        category: "COMMERCIAL",
        pmProjectVendorId,
        vendorDocType,
        originalName: file.name,
        storedName,
        mimeType: file.type || "application/octet-stream",
        size,
        uploadedById: session.user.id,
      },
    });

    const buffer = Buffer.from(await file.arrayBuffer());
    await mirrorToDrive(
      ["PM Projects", entry.pmProject.title, "Vendors", entry.vendor.name, VENDOR_DOC_TYPE_LABELS[vendorDocType]],
      file.name,
      file.type || "application/octet-stream",
      buffer
    );
  }

  revalidatePath(`/pm/projects/${pmProjectId}`);
  return { success: true };
}

export async function deleteVendorDocument(pmProjectId: string, documentId: string) {
  await requireAuth();

  const doc = await prisma.pmDocument.findUnique({ where: { id: documentId } });
  if (!doc) return;

  await prisma.pmDocument.delete({ where: { id: documentId } });
  await deleteUploadedFile(`pm-${pmProjectId}`, doc.storedName);

  revalidatePath(`/pm/projects/${pmProjectId}`);
}
