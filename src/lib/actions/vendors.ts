"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Trade, VendorStatus, VendorType } from "@/lib/constants";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
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

export async function createVendor(_prevState: unknown, formData: FormData) {
  await requireAuth();

  const fields = readVendorFields(formData);
  if (!fields.name) return { error: "Name is required" };
  if (!fields.type) return { error: "Choose supplier or contractor" };

  await prisma.vendor.create({ data: fields });

  revalidatePath("/vendors");
  return { success: true };
}

export async function updateVendor(vendorId: string, _prevState: unknown, formData: FormData) {
  await requireAuth();

  const fields = readVendorFields(formData);
  if (!fields.name) return { error: "Name is required" };
  if (!fields.type) return { error: "Choose supplier or contractor" };

  await prisma.vendor.update({ where: { id: vendorId }, data: fields });

  revalidatePath("/vendors");
  return { success: true };
}

export async function updateVendorStatus(vendorId: string, status: VendorStatus) {
  await requireAuth();
  await prisma.vendor.update({ where: { id: vendorId }, data: { status } });
  revalidatePath("/vendors");
}

export async function deleteVendor(vendorId: string) {
  await requireAuth();
  await prisma.vendor.delete({ where: { id: vendorId } });
  revalidatePath("/vendors");
}
