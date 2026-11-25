import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, dateOnly, isResponse, parseDate, readJson, requireAgent } from "@/lib/agent-auth";
import { resolveAssignee, resolveTarget, revalidateTaskPages } from "@/lib/agent-targets";
import { notifyAssigned } from "@/lib/notify";

export const dynamic = "force-dynamic";

/**
 * Adds a task (shown in My Tasks), always filed under a tender or PM project.
 * Body: { title, target: "crm:<id>" | "pm:<id>", dueDate?: "YYYY-MM-DD", assignee?: email|id, note? }
 */
export async function POST(req: Request) {
  const actor = await requireAgent(req);
  if (isResponse(actor)) return actor;

  const body = await readJson(req);
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return badRequest("title is required");

  const target = await resolveTarget(body.target, true);
  if (typeof target === "string") return badRequest(target);

  let dueDate: Date | null | undefined;
  try {
    dueDate = parseDate(body.dueDate);
  } catch (e) {
    return badRequest((e as Error).message);
  }

  const assigneeId = await resolveAssignee(body.assignee, actor.ownerId);
  if (typeof assigneeId !== "string") return badRequest(assigneeId.error);

  const created = await prisma.subtask.create({
    data: {
      title,
      dueDate: dueDate ?? null,
      projectId: target.projectId,
      pmProjectId: target.pmProjectId,
      scope: target.scope,
      createdById: actor.userId,
      assigneeId,
    },
  });

  const note = typeof body.note === "string" ? body.note.trim() : "";
  if (note) await prisma.note.create({ data: { subtaskId: created.id, authorId: actor.userId, body: note } });

  await notifyAssigned(
    assigneeId,
    { title: `New task assigned to you — ${title}`, link: `/my-tasks/${created.id}` },
    actor.userId
  );
  revalidateTaskPages();

  return NextResponse.json(
    { id: created.id, title: created.title, dueDate: dateOnly(created.dueDate), status: created.status },
    { status: 201 }
  );
}
