"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { syncPmProjectDates } from "@/lib/tasks-sync";
import { DEFAULT_PM_SUBSECTIONS } from "@/lib/constants";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

async function resolveClientId(formData: FormData) {
  const newClientName = (formData.get("newClientName") as string)?.trim();
  if (newClientName) {
    const client = await prisma.client.create({ data: { name: newClientName } });
    return client.id;
  }
  return (formData.get("clientId") as string) || null;
}

export async function createPmProject(_prevState: unknown, formData: FormData) {
  const userId = await requireUserId();

  const title = (formData.get("title") as string)?.trim();
  if (!title) return { error: "Title is required" };

  const clientId = await resolveClientId(formData);
  const value = formData.get("value") ? Number(formData.get("value")) : null;
  const currency = (formData.get("currency") as string) || "AED";
  const location = (formData.get("location") as string) || null;
  const description = (formData.get("description") as string) || null;
  const startDate = formData.get("startDate") ? new Date(formData.get("startDate") as string) : null;
  const targetEndDate = formData.get("targetEndDate")
    ? new Date(formData.get("targetEndDate") as string)
    : null;

  const pmProject = await prisma.pmProject.create({
    data: { title, clientId, value, currency, location, description, startDate, targetEndDate, ownerId: userId },
  });

  await prisma.pmDocSubsection.createMany({
    data: DEFAULT_PM_SUBSECTIONS.map((s, i) => ({ ...s, pmProjectId: pmProject.id, sortOrder: i })),
  });

  await syncPmProjectDates(pmProject.id);

  revalidatePath("/pm");
  revalidatePath("/pm/projects");
  revalidatePath("/pm/deadlines");
  redirect(`/pm/projects/${pmProject.id}`);
}

/** Creates a PM project from an already-Won CRM tender, carrying over the key details. */
export async function promoteToPm(tenderProjectId: string) {
  const userId = await requireUserId();

  const tender = await prisma.project.findUnique({ where: { id: tenderProjectId } });
  if (!tender) throw new Error("Tender not found");
  if (tender.stage !== "WON") throw new Error("Only Won tenders can be promoted to a PM project");

  const existing = await prisma.pmProject.findUnique({ where: { linkedTenderId: tenderProjectId } });
  if (existing) return { pmProjectId: existing.id };

  const pmProject = await prisma.pmProject.create({
    data: {
      title: tender.title,
      clientId: tender.clientId,
      value: tender.value,
      currency: tender.currency,
      location: tender.location,
      description: tender.description,
      startDate: tender.awardDate,
      linkedTenderId: tender.id,
      ownerId: userId,
    },
  });

  await prisma.pmDocSubsection.createMany({
    data: DEFAULT_PM_SUBSECTIONS.map((s, i) => ({ ...s, pmProjectId: pmProject.id, sortOrder: i })),
  });

  revalidatePath("/pm");
  revalidatePath("/pm/projects");
  revalidatePath(`/projects/${tenderProjectId}`);
  return { pmProjectId: pmProject.id };
}

export async function updatePmProject(pmProjectId: string, _prevState: unknown, formData: FormData) {
  await requireUserId();

  const title = (formData.get("title") as string)?.trim();
  if (!title) return { error: "Title is required" };

  const clientId = await resolveClientId(formData);
  const value = formData.get("value") ? Number(formData.get("value")) : null;
  const currency = (formData.get("currency") as string) || "AED";
  const location = (formData.get("location") as string) || null;
  const description = (formData.get("description") as string) || null;
  const startDate = formData.get("startDate") ? new Date(formData.get("startDate") as string) : null;
  const targetEndDate = formData.get("targetEndDate")
    ? new Date(formData.get("targetEndDate") as string)
    : null;

  await prisma.pmProject.update({
    where: { id: pmProjectId },
    data: { title, clientId, value, currency, location, description, startDate, targetEndDate },
  });

  await syncPmProjectDates(pmProjectId);

  revalidatePath("/pm");
  revalidatePath("/pm/projects");
  revalidatePath("/pm/deadlines");
  revalidatePath(`/pm/projects/${pmProjectId}`);
  return { success: true };
}

export async function updatePmProjectStatus(pmProjectId: string, status: "ACTIVE" | "ON_HOLD" | "COMPLETE") {
  await requireUserId();
  await prisma.pmProject.update({ where: { id: pmProjectId }, data: { status } });
  revalidatePath("/pm");
  revalidatePath("/pm/projects");
  revalidatePath(`/pm/projects/${pmProjectId}`);
}

export async function deletePmProject(pmProjectId: string) {
  await requireUserId();
  await prisma.pmProject.delete({ where: { id: pmProjectId } });
  revalidatePath("/pm");
  revalidatePath("/pm/projects");
  redirect("/pm/projects");
}
