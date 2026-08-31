"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile, deleteUploadedFile } from "@/lib/storage";
import { mirrorToDrive } from "@/lib/google-drive";
import { notifyAll } from "@/lib/notify";
import type { Trade, VendorStatus, VendorType } from "@/lib/constants";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const VENDOR_DOC_FOLDER = "vendor-documents";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

function readVendorFields(formData: FormData) {
  return {
    name: (formData.get("name") as string)?.trim(),
    type: formData.get("type") as VendorType,
    trade: ((formData.get("trade") as string) || null) as Trade | null,
    contactName: (formData.get("contactName") as string) || null,
    phone: (formData.get("phone") as string) || null,
    email: (formData.get("email") as string) || null,
    address: (formData.get("address") as string) || null,
    website: (formData.get("website") as string) || null,
    trnNumber: (formData.get("trnNumber") as string) || null,
    notes: (formData.get("notes") as string) || null,
  };
}

/** Saves an optional file upload for a fixed vendor "slot" (trade license / TRN cert),
 * replacing whatever was there before, and mirroring the copy to Drive. Returns the new
 * VendorDocument id, or undefined if no file was chosen. */
async function saveVendorSlotDoc(
  userId: string,
  vendorName: string,
  driveLabel: string,
  file: File | null,
  existingDocId: string | null,
  existingStoredName: string | null
) {
  if (!file || file.size === 0) return undefined;
  if (file.size > MAX_FILE_SIZE) throw new Error(`${file.name} exceeds the 100MB limit`);

  if (existingDocId) {
    await prisma.vendorDocument.delete({ where: { id: existingDocId } });
    if (existingStoredName) await deleteUploadedFile(VENDOR_DOC_FOLDER, existingStoredName);
  }

  const { storedName, size } = await saveUploadedFile(file, VENDOR_DOC_FOLDER);
  const doc = await prisma.vendorDocument.create({
    data: {
      originalName: file.name,
      storedName,
      mimeType: file.type || "application/octet-stream",
      size,
      uploadedById: userId,
    },
  });

  const buffer = Buffer.from(await file.arrayBuffer());
  await mirrorToDrive(["Vendors", vendorName, driveLabel], file.name, file.type || "application/octet-stream", buffer);

  return doc.id;
}

export async function createVendor(_prevState: unknown, formData: FormData) {
  const userId = await requireUserId();

  const fields = readVendorFields(formData);
  if (!fields.name) return { error: "Name is required" };
  if (!fields.type) return { error: "Choose supplier or contractor" };

  const vendor = await prisma.vendor.create({ data: fields });

  try {
    const tradeLicenseDocId = await saveVendorSlotDoc(
      userId,
      fields.name,
      "Trade License",
      formData.get("tradeLicense") as File | null,
      null,
      null
    );
    const trnCertDocId = await saveVendorSlotDoc(
      userId,
      fields.name,
      "TRN Certificate",
      formData.get("trnCert") as File | null,
      null,
      null
    );
    if (tradeLicenseDocId || trnCertDocId) {
      await prisma.vendor.update({
        where: { id: vendor.id },
        data: { tradeLicenseDocId, trnCertDocId },
      });
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload failed" };
  }

  await notifyAll("VENDORS", { title: `New vendor added — ${vendor.name}`, link: "/vendors" }, userId);

  revalidatePath("/vendors");
  return { success: true };
}

export async function updateVendor(vendorId: string, _prevState: unknown, formData: FormData) {
  const userId = await requireUserId();

  const fields = readVendorFields(formData);
  if (!fields.name) return { error: "Name is required" };
  if (!fields.type) return { error: "Choose supplier or contractor" };

  const existing = await prisma.vendor.findUnique({
    where: { id: vendorId },
    include: { tradeLicenseDoc: true, trnCertDoc: true },
  });
  if (!existing) return { error: "Vendor not found" };

  try {
    const tradeLicenseDocId = await saveVendorSlotDoc(
      userId,
      fields.name,
      "Trade License",
      formData.get("tradeLicense") as File | null,
      existing.tradeLicenseDocId,
      existing.tradeLicenseDoc?.storedName ?? null
    );
    const trnCertDocId = await saveVendorSlotDoc(
      userId,
      fields.name,
      "TRN Certificate",
      formData.get("trnCert") as File | null,
      existing.trnCertDocId,
      existing.trnCertDoc?.storedName ?? null
    );

    await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        ...fields,
        ...(tradeLicenseDocId ? { tradeLicenseDocId } : {}),
        ...(trnCertDocId ? { trnCertDocId } : {}),
      },
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload failed" };
  }

  revalidatePath("/vendors");
  return { success: true };
}

export async function updateVendorStatus(vendorId: string, status: VendorStatus) {
  await requireUserId();
  await prisma.vendor.update({ where: { id: vendorId }, data: { status } });
  revalidatePath("/vendors");
}

export async function deleteVendor(vendorId: string) {
  await requireUserId();

  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    include: { tradeLicenseDoc: true, trnCertDoc: true },
  });
  if (!vendor) return;

  await prisma.vendor.delete({ where: { id: vendorId } });

  if (vendor.tradeLicenseDoc) {
    await prisma.vendorDocument.delete({ where: { id: vendor.tradeLicenseDoc.id } }).catch(() => {});
    await deleteUploadedFile(VENDOR_DOC_FOLDER, vendor.tradeLicenseDoc.storedName);
  }
  if (vendor.trnCertDoc) {
    await prisma.vendorDocument.delete({ where: { id: vendor.trnCertDoc.id } }).catch(() => {});
    await deleteUploadedFile(VENDOR_DOC_FOLDER, vendor.trnCertDoc.storedName);
  }

  revalidatePath("/vendors");
}
