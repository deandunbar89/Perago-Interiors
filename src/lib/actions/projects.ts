"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { syncProjectDates } from "@/lib/tasks-sync";
import { DOC_CATEGORIES, DOC_CATEGORY_LABELS, STAGE_LABELS, type Stage, type ProjectType, type Temperature } from "@/lib/constants";
import { createCrmProjectDriveTemplate } from "@/lib/google-drive";
import { notifyAll } from "@/lib/notify";

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

function readProjectFields(formData: FormData) {
  return {
    title: (formData.get("title") as string)?.trim(),
    reference: (formData.get("reference") as string) || null,
    projectType: ((formData.get("projectType") as string) || null) as ProjectType | null,
    temperature: ((formData.get("temperature") as string) || null) as Temperature | null,
    value: formData.get("value") ? Number(formData.get("value")) : null,
    currency: (formData.get("currency") as string) || "AED",
    location: (formData.get("location") as string) || null,
    description: (formData.get("description") as string) || null,
    contactName: (formData.get("contactName") as string) || null,
    contactEmail: (formData.get("contactEmail") as string) || null,
    contactPhone1: (formData.get("contactPhone1") as string) || null,
    contactPhone2: (formData.get("contactPhone2") as string) || null,
    submissionDeadline: formData.get("submissionDeadline")
      ? new Date(formData.get("submissionDeadline") as string)
      : null,
    siteVisitDate: formData.get("siteVisitDate")
      ? new Date(formData.get("siteVisitDate") as string)
      : null,
    awardDate: formData.get("awardDate") ? new Date(formData.get("awardDate") as string) : null,
  };
}

export async function createProject(_prevState: unknown, formData: FormData) {
  const userId = await requireUserId();

  const fields = readProjectFields(formData);
  if (!fields.title) return { error: "Title is required" };

  const clientId = await resolveClientId(formData);

  const project = await prisma.project.create({
    data: {
      ...fields,
      clientId,
      ownerId: userId,
    },
  });

  await prisma.activity.create({
    data: {
      projectId: project.id,
      userId,
      type: "CREATED",
      message: `Project created`,
    },
  });

  await syncProjectDates(project.id);
  void createCrmProjectDriveTemplate(project.title, DOC_CATEGORIES.map((c) => DOC_CATEGORY_LABELS[c]));
  await notifyAll("CRM", { title: `New tender — ${project.title}`, link: `/projects/${project.id}` }, userId);

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath("/tasks");
  revalidatePath("/deadlines");
  redirect(`/projects/${project.id}`);
}

export async function updateProjectStage(projectId: string, stage: Stage) {
  const userId = await requireUserId();

  const project = await prisma.project.update({
    where: { id: projectId },
    data: { stage },
  });

  await prisma.activity.create({
    data: {
      projectId,
      userId,
      type: "STAGE_CHANGE",
      message: `Stage changed to ${STAGE_LABELS[stage]}`,
    },
  });

  if (stage === "WON" || stage === "LOST") {
    await notifyAll(
      "CRM",
      { title: `Tender ${STAGE_LABELS[stage].toLowerCase()} — ${project.title}`, link: `/projects/${projectId}` },
      userId
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  return project;
}

export async function updateProject(projectId: string, _prevState: unknown, formData: FormData) {
  const userId = await requireUserId();

  const fields = readProjectFields(formData);
  if (!fields.title) return { error: "Title is required" };

  const clientId = await resolveClientId(formData);

  await prisma.project.update({
    where: { id: projectId },
    data: {
      ...fields,
      clientId,
    },
  });

  await prisma.activity.create({
    data: {
      projectId,
      userId,
      type: "UPDATED",
      message: `Project details updated`,
    },
  });

  await syncProjectDates(projectId);

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/tasks");
  revalidatePath("/deadlines");
  return { success: true };
}

export async function deleteProject(projectId: string) {
  await requireUserId();
  await prisma.project.delete({ where: { id: projectId } });
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath("/tasks");
  revalidatePath("/deadlines");
  redirect("/dashboard");
}

export async function quickCreateProjectForClient(clientId: string, formData: FormData) {
  const userId = await requireUserId();

  const title = (formData.get("title") as string)?.trim();
  if (!title) return { error: "Project title is required" };

  const value = formData.get("value") ? Number(formData.get("value")) : null;
  const submissionDeadline = formData.get("submissionDeadline")
    ? new Date(formData.get("submissionDeadline") as string)
    : null;

  const project = await prisma.project.create({
    data: {
      title,
      clientId,
      value,
      submissionDeadline,
      ownerId: userId,
    },
  });

  await prisma.activity.create({
    data: {
      projectId: project.id,
      userId,
      type: "CREATED",
      message: `Project created`,
    },
  });

  await syncProjectDates(project.id);
  void createCrmProjectDriveTemplate(project.title, DOC_CATEGORIES.map((c) => DOC_CATEGORY_LABELS[c]));
  await notifyAll("CRM", { title: `New tender — ${project.title}`, link: `/projects/${project.id}` }, userId);

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath("/tasks");
  revalidatePath("/deadlines");
  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}
