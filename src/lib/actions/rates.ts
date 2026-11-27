"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cleanRate } from "@/lib/rates";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.name ?? session.user.email ?? null;
}

export async function addRate(_prev: unknown, formData: FormData) {
  const name = await requireUser();
  const get = (k: string) => String(formData.get(k) ?? "");
  const result = cleanRate(
    {
      trade: get("trade"),
      description: get("description"),
      unit: get("unit"),
      rate: Number(get("rate").replace(/[^0-9.]/g, "")),
      rateType: get("rateType"),
      source: get("source"),
      sourceType: get("sourceType"),
      sourceRef: get("sourceRef"),
      projectName: get("projectName"),
      quotedAt: get("quotedAt") || null,
      notes: get("notes"),
    },
    name
  );
  if ("error" in result) return { error: result.error };
  await prisma.rateItem.create({ data: result.data });
  revalidatePath("/rates");
  return { success: true };
}

export async function updateRateField(id: string, field: "rate" | "description" | "unit" | "notes", value: string) {
  await requireUser();
  if (field === "rate") {
    const n = Number(value.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(n)) return { error: "Rate must be a number" };
    await prisma.rateItem.update({ where: { id }, data: { rate: n } });
  } else {
    const v = value.trim();
    if (!v && field !== "notes") return { error: "Can't be empty" };
    await prisma.rateItem.update({ where: { id }, data: { [field]: v || null } });
  }
  revalidatePath("/rates");
  return { success: true };
}

export async function deleteRate(id: string) {
  await requireUser();
  await prisma.rateItem.delete({ where: { id } });
  revalidatePath("/rates");
}
