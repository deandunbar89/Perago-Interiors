"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function createEmailLog(projectId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const subject = (formData.get("subject") as string)?.trim();
  const fromAddr = (formData.get("fromAddr") as string)?.trim();
  const toAddr = (formData.get("toAddr") as string)?.trim();
  if (!subject || !fromAddr || !toAddr) {
    return { error: "Subject, from and to are required" };
  }

  const direction = (formData.get("direction") as string) || "outgoing";
  const body = (formData.get("body") as string) || null;
  const sentAtRaw = formData.get("sentAt") as string;
  const sentAt = sentAtRaw ? new Date(sentAtRaw) : new Date();

  await prisma.emailLog.create({
    data: {
      projectId,
      subject,
      fromAddr,
      toAddr,
      direction,
      body,
      sentAt,
      loggedById: session.user.id,
    },
  });

  await prisma.activity.create({
    data: {
      projectId,
      userId: session.user.id,
      type: "EMAIL",
      message: `Logged email: ${subject}`,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function deleteEmailLog(projectId: string, emailId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  await prisma.emailLog.delete({ where: { id: emailId } });
  revalidatePath(`/projects/${projectId}`);
}
