"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile, deleteUploadedFile } from "@/lib/storage";
import { mirrorToDrive } from "@/lib/google-drive";
import { notifyAll } from "@/lib/notify";
import { ORDER_TYPE_LABELS, PAYMENT_DIRECTION_LABELS, type OrderType, type PaymentDirection } from "@/lib/constants";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

async function saveAttachment(
  pmProjectId: string,
  projectTitle: string,
  driveLabel: string,
  file: File | null,
  userId: string
) {
  if (!file || file.size === 0) return undefined;
  if (file.size > MAX_FILE_SIZE) throw new Error(`${file.name} exceeds the 100MB limit`);

  const { storedName, size } = await saveUploadedFile(file, `pm-${pmProjectId}`);
  const doc = await prisma.pmDocument.create({
    data: {
      pmProjectId,
      category: "COMMERCIAL",
      originalName: file.name,
      storedName,
      mimeType: file.type || "application/octet-stream",
      size,
      uploadedById: userId,
    },
  });

  const buffer = Buffer.from(await file.arrayBuffer());
  await mirrorToDrive(["PM Projects", projectTitle, "Finance", driveLabel], file.name, file.type || "application/octet-stream", buffer);

  return doc.id;
}

export async function createOrder(pmProjectId: string, formData: FormData) {
  const userId = await requireUserId();

  const project = await prisma.pmProject.findUnique({ where: { id: pmProjectId }, select: { title: true } });
  if (!project) return { error: "Project not found" };

  const type = formData.get("type") as OrderType;
  const value = parseFloat(formData.get("value") as string);
  if (!type) return { error: "Choose an order type" };
  if (!value || value <= 0) return { error: "Enter a value greater than zero" };

  const vendorId = (formData.get("vendorId") as string) || null;
  const reference = (formData.get("reference") as string) || null;
  const description = (formData.get("description") as string) || null;
  const orderDateStr = formData.get("orderDate") as string;
  const currency = (formData.get("currency") as string) || "AED";

  let documentId: string | undefined;
  try {
    documentId = await saveAttachment(
      pmProjectId,
      project.title,
      ORDER_TYPE_LABELS[type],
      formData.get("document") as File | null,
      userId
    );
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload failed" };
  }

  await prisma.projectOrder.create({
    data: {
      pmProjectId,
      vendorId,
      type,
      reference,
      description,
      value,
      currency,
      orderDate: orderDateStr ? new Date(orderDateStr) : null,
      documentId,
      createdById: userId,
    },
  });

  revalidatePath(`/pm/projects/${pmProjectId}`);
  return { success: true };
}

export async function deleteOrder(pmProjectId: string, orderId: string) {
  await requireUserId();

  const order = await prisma.projectOrder.findUnique({ where: { id: orderId }, include: { document: true } });
  if (!order || order.pmProjectId !== pmProjectId) return;

  await prisma.projectOrder.delete({ where: { id: orderId } });
  if (order.document) {
    await prisma.pmDocument.delete({ where: { id: order.document.id } }).catch(() => {});
    await deleteUploadedFile(`pm-${pmProjectId}`, order.document.storedName);
  }

  revalidatePath(`/pm/projects/${pmProjectId}`);
}

export async function createPayment(pmProjectId: string, formData: FormData) {
  const userId = await requireUserId();

  const project = await prisma.pmProject.findUnique({ where: { id: pmProjectId }, select: { title: true } });
  if (!project) return { error: "Project not found" };

  const direction = formData.get("direction") as PaymentDirection;
  const amount = parseFloat(formData.get("amount") as string);
  const paidDateStr = formData.get("paidDate") as string;
  if (!direction) return { error: "Choose received or paid" };
  if (!amount || amount <= 0) return { error: "Enter an amount greater than zero" };
  if (!paidDateStr) return { error: "Choose a date" };

  const orderId = (formData.get("orderId") as string) || null;
  const vendorId = (formData.get("vendorId") as string) || null;
  const reference = (formData.get("reference") as string) || null;
  const currency = (formData.get("currency") as string) || "AED";

  let documentId: string | undefined;
  try {
    documentId = await saveAttachment(
      pmProjectId,
      project.title,
      PAYMENT_DIRECTION_LABELS[direction],
      formData.get("document") as File | null,
      userId
    );
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload failed" };
  }

  await prisma.projectPayment.create({
    data: {
      pmProjectId,
      direction,
      orderId,
      vendorId,
      amount,
      currency,
      reference,
      paidDate: new Date(paidDateStr),
      documentId,
      createdById: userId,
    },
  });

  await notifyAll(
    "FINANCE",
    {
      title: `${PAYMENT_DIRECTION_LABELS[direction]} — ${project.title} (${currency} ${amount.toLocaleString()})`,
      link: `/pm/projects/${pmProjectId}?tab=finance`,
    },
    userId
  );

  revalidatePath(`/pm/projects/${pmProjectId}`);
  return { success: true };
}

export async function deletePayment(pmProjectId: string, paymentId: string) {
  await requireUserId();

  const payment = await prisma.projectPayment.findUnique({ where: { id: paymentId }, include: { document: true } });
  if (!payment || payment.pmProjectId !== pmProjectId) return;

  await prisma.projectPayment.delete({ where: { id: paymentId } });
  if (payment.document) {
    await prisma.pmDocument.delete({ where: { id: payment.document.id } }).catch(() => {});
    await deleteUploadedFile(`pm-${pmProjectId}`, payment.document.storedName);
  }

  revalidatePath(`/pm/projects/${pmProjectId}`);
}
