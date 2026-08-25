"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function createClient(_prevState: unknown, formData: FormData) {
  await requireAuth();

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Company name is required" };

  const industry = (formData.get("industry") as string) || null;
  const website = (formData.get("website") as string) || null;
  const address = (formData.get("address") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  const client = await prisma.client.create({
    data: { name, industry, website, address, notes },
  });

  revalidatePath("/clients");
  redirect(`/clients/${client.id}`);
}

export async function updateClient(clientId: string, _prevState: unknown, formData: FormData) {
  await requireAuth();

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Company name is required" };

  await prisma.client.update({
    where: { id: clientId },
    data: {
      name,
      industry: (formData.get("industry") as string) || null,
      website: (formData.get("website") as string) || null,
      address: (formData.get("address") as string) || null,
      notes: (formData.get("notes") as string) || null,
    },
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}

export async function createContact(clientId: string, formData: FormData) {
  await requireAuth();

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Contact name is required" };

  await prisma.contact.create({
    data: {
      clientId,
      name,
      role: (formData.get("role") as string) || null,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      isPrimary: formData.get("isPrimary") === "on",
    },
  });

  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}

export async function deleteContact(clientId: string, contactId: string) {
  await requireAuth();
  await prisma.contact.delete({ where: { id: contactId } });
  revalidatePath(`/clients/${clientId}`);
}
