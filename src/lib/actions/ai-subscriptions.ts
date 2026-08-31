"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/crypto";
import type { AiSubscriptionStatus } from "@/lib/constants";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

function readFields(formData: FormData) {
  return {
    name: (formData.get("name") as string)?.trim(),
    url: (formData.get("url") as string) || null,
    username: (formData.get("username") as string) || null,
    plan: (formData.get("plan") as string) || null,
    cost: (formData.get("cost") as string) || null,
    renewalDate: formData.get("renewalDate") ? new Date(formData.get("renewalDate") as string) : null,
    notes: (formData.get("notes") as string) || null,
  };
}

export async function createAiSubscription(_prevState: unknown, formData: FormData) {
  await requireUserId();

  const fields = readFields(formData);
  if (!fields.name) return { error: "Name is required" };

  const password = (formData.get("password") as string) || "";

  await prisma.aiSubscription.create({
    data: {
      ...fields,
      passwordEnc: password ? encrypt(password) : null,
    },
  });

  revalidatePath("/ai");
  return { success: true };
}

export async function updateAiSubscription(id: string, _prevState: unknown, formData: FormData) {
  await requireUserId();

  const fields = readFields(formData);
  if (!fields.name) return { error: "Name is required" };

  const password = (formData.get("password") as string) || "";

  await prisma.aiSubscription.update({
    where: { id },
    data: {
      ...fields,
      // Blank password field means "keep the existing one" — only overwrite when a new value is typed.
      ...(password ? { passwordEnc: encrypt(password) } : {}),
    },
  });

  revalidatePath("/ai");
  return { success: true };
}

export async function updateAiSubscriptionStatus(id: string, status: AiSubscriptionStatus) {
  await requireUserId();
  await prisma.aiSubscription.update({ where: { id }, data: { status } });
  revalidatePath("/ai");
}

export async function deleteAiSubscription(id: string) {
  await requireUserId();
  await prisma.aiSubscription.delete({ where: { id } });
  revalidatePath("/ai");
}

export async function revealAiSubscriptionPassword(id: string): Promise<string | null> {
  await requireUserId();
  const sub = await prisma.aiSubscription.findUnique({ where: { id }, select: { passwordEnc: true } });
  if (!sub?.passwordEnc) return null;
  return decrypt(sub.passwordEnc);
}
