"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { clearCrmQuote, clearPmQuote, issueCrmQuote, issuePmQuote } from "@/lib/quotes";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

function parseValue(value: string | null | undefined) {
  if (!value) return null;
  const n = Number(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseDate(value: string | null | undefined) {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function refresh() {
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath("/deadlines");
  revalidatePath("/pm");
  revalidatePath("/reports");
}

export async function markCrmQuoteIssued(projectId: string, documentId: string, value?: string, date?: string) {
  const userId = await requireUserId();
  const result = await issueCrmQuote(projectId, documentId, { value: parseValue(value), at: parseDate(date), userId });
  revalidatePath(`/projects/${projectId}`);
  refresh();
  return result;
}

export async function unmarkCrmQuote(projectId: string, documentId: string) {
  await requireUserId();
  const result = await clearCrmQuote(projectId, documentId);
  revalidatePath(`/projects/${projectId}`);
  refresh();
  return result;
}

export async function markPmQuoteIssued(pmProjectId: string, documentId: string, value?: string, date?: string) {
  await requireUserId();
  const result = await issuePmQuote(pmProjectId, documentId, { value: parseValue(value), at: parseDate(date) });
  revalidatePath(`/pm/projects/${pmProjectId}`);
  refresh();
  return result;
}

export async function unmarkPmQuote(pmProjectId: string, documentId: string) {
  await requireUserId();
  const result = await clearPmQuote(pmProjectId, documentId);
  revalidatePath(`/pm/projects/${pmProjectId}`);
  refresh();
  return result;
}
