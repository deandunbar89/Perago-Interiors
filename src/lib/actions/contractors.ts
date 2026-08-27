"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Trade } from "@/lib/constants";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
}

export async function createContractor(_prevState: unknown, formData: FormData) {
  await requireAuth();

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Name is required" };

  const trade = (formData.get("trade") as Trade) || null;
  const phone = (formData.get("phone") as string) || null;
  const email = (formData.get("email") as string) || null;

  await prisma.contractor.create({ data: { name, trade, phone, email } });

  revalidatePath("/pm/contractors");
  return { success: true };
}

export async function deleteContractor(contractorId: string) {
  await requireAuth();
  await prisma.contractor.delete({ where: { id: contractorId } });
  revalidatePath("/pm/contractors");
}
