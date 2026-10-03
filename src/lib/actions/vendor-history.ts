"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

function parseRating(value: unknown): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
}

function revalidateVendor(vendorId: string) {
  revalidatePath("/vendors");
  revalidatePath(`/vendors/${vendorId}`);
}

export async function setVendorRating(vendorId: string, rating: number | null) {
  await requireUserId();
  await prisma.vendor.update({ where: { id: vendorId }, data: { rating: parseRating(rating) } });
  revalidateVendor(vendorId);
}

/** Logs a project this vendor has worked on with us — either a live PM project or any past one by name. */
export async function addVendorHistory(vendorId: string, formData: FormData) {
  const userId = await requireUserId();

  const pmProjectId = (formData.get("pmProjectId") as string) || null;
  let projectName = (formData.get("projectName") as string)?.trim() || "";

  if (pmProjectId) {
    const project = await prisma.pmProject.findUnique({ where: { id: pmProjectId }, select: { title: true } });
    if (!project) return { error: "That project no longer exists" };
    if (!projectName) projectName = project.title;
  }
  if (!projectName) return { error: "Choose a project or type its name" };

  const workedOnStr = formData.get("workedOn") as string;

  await prisma.vendorProjectHistory.create({
    data: {
      vendorId,
      pmProjectId,
      projectName,
      workedOn: workedOnStr ? new Date(workedOnStr) : null,
      scope: (formData.get("scope") as string)?.trim() || null,
      rating: parseRating(formData.get("rating")),
      notes: (formData.get("notes") as string)?.trim() || null,
      createdById: userId,
    },
  });

  revalidateVendor(vendorId);
  return { success: true };
}

export async function deleteVendorHistory(vendorId: string, entryId: string) {
  await requireUserId();
  const entry = await prisma.vendorProjectHistory.findUnique({ where: { id: entryId } });
  if (!entry || entry.vendorId !== vendorId) return;
  await prisma.vendorProjectHistory.delete({ where: { id: entryId } });
  revalidateVendor(vendorId);
}
