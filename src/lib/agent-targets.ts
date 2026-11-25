import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type Target = { projectId: string | null; pmProjectId: string | null; scope: "CRM" | "PM" };

/** "crm:<tenderId>" or "pm:<projectId>" → the ids to file against, checked to exist. */
export async function resolveTarget(target: unknown, required: boolean): Promise<Target | string> {
  if (target === undefined || target === null || target === "") {
    return required ? "target is required: \"crm:<tenderId>\" or \"pm:<projectId>\"" : { projectId: null, pmProjectId: null, scope: "CRM" };
  }
  if (typeof target !== "string") return "target must be a string";

  if (target.startsWith("crm:")) {
    const id = target.slice(4);
    const found = await prisma.project.findUnique({ where: { id }, select: { id: true } });
    return found ? { projectId: id, pmProjectId: null, scope: "CRM" } : `No tender with id ${id}`;
  }
  if (target.startsWith("pm:")) {
    const id = target.slice(3);
    const found = await prisma.pmProject.findUnique({ where: { id }, select: { id: true } });
    return found ? { projectId: null, pmProjectId: id, scope: "PM" } : `No PM project with id ${id}`;
  }
  return "target must start with \"crm:\" or \"pm:\"";
}

/** An assignee given by email or user id; falls back to the owner (Dean) when not given. */
export async function resolveAssignee(value: unknown, fallbackUserId: string): Promise<string | { error: string }> {
  if (value === undefined || value === null || value === "") return fallbackUserId;
  if (typeof value !== "string") return { error: "assignee must be an email or user id" };
  const user = await prisma.user.findFirst({
    where: { OR: [{ id: value }, { email: { equals: value, mode: "insensitive" } }] },
    select: { id: true },
  });
  return user ? user.id : { error: `No team member matches "${value}"` };
}

export function revalidateTaskPages() {
  for (const path of ["/my-tasks", "/tasks", "/deadlines", "/dashboard", "/pm", "/pm/tasks", "/pm/deadlines"]) {
    revalidatePath(path);
  }
}
