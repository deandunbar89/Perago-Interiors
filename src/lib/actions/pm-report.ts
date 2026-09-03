"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notifyAll } from "@/lib/notify";
import { REPORT_SECTION_LABELS, type ReportSection, type ReportPeriodType } from "@/lib/constants";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function createReportEntry(pmProjectId: string, formData: FormData) {
  const userId = await requireUserId();

  const section = formData.get("section") as ReportSection;
  const periodType = formData.get("periodType") as ReportPeriodType;
  const periodStart = formData.get("periodStart") as string;
  const content = (formData.get("content") as string)?.trim();

  if (!section || !periodType || !periodStart) return { error: "All fields are required" };
  if (!content) return { error: "Write something for this entry" };

  const project = await prisma.pmProject.findUnique({ where: { id: pmProjectId }, select: { title: true } });
  if (!project) return { error: "Project not found" };

  await prisma.projectReportEntry.create({
    data: {
      pmProjectId,
      section,
      periodType,
      periodStart: new Date(periodStart),
      content,
      createdById: userId,
    },
  });

  await notifyAll(
    "REPORTS",
    {
      title: `${REPORT_SECTION_LABELS[section]} report added — ${project.title}`,
      link: `/pm/projects/${pmProjectId}?tab=report`,
    },
    userId
  );

  revalidatePath(`/pm/projects/${pmProjectId}`);
  return { success: true };
}

export async function updateReportEntry(id: string, formData: FormData) {
  await requireUserId();

  const content = (formData.get("content") as string)?.trim();
  if (!content) return { error: "Write something for this entry" };

  const entry = await prisma.projectReportEntry.update({
    where: { id },
    data: { content },
  });

  revalidatePath(`/pm/projects/${entry.pmProjectId}`);
  return { success: true };
}

export async function deleteReportEntry(id: string) {
  await requireUserId();
  const entry = await prisma.projectReportEntry.delete({ where: { id } });
  revalidatePath(`/pm/projects/${entry.pmProjectId}`);
}
