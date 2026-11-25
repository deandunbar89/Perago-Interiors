import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, dateOnly, isResponse, parseDate, readJson, requireAgent } from "@/lib/agent-auth";
import { resolveAssignee, resolveTarget, revalidateTaskPages } from "@/lib/agent-targets";
import { notifyAssigned } from "@/lib/notify";

export const dynamic = "force-dynamic";

/**
 * Adds a deadline — a hard date that must not be missed.
 * Body: { title, dueDate: "YYYY-MM-DD", target?: "crm:<id>" | "pm:<id>", assignee?: email|id, note? }
 */
export async function POST(req: Request) {
  const actor = await requireAgent(req);
  if (isResponse(actor)) return actor;

  const body = await readJson(req);
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return badRequest("title is required");

  let dueDate: Date | null | undefined;
  try {
    dueDate = parseDate(body.dueDate);
  } catch (e) {
    return badRequest((e as Error).message);
  }
  if (!dueDate) return badRequest("dueDate is required for a deadline");

  const target = await resolveTarget(body.target, false);
  if (typeof target === "string") return badRequest(target);

  const assigneeId = await resolveAssignee(body.assignee, actor.ownerId);
  if (typeof assigneeId !== "string") return badRequest(assigneeId.error);

  const created = await prisma.task.create({
    data: {
      title,
      dueDate,
      projectId: target.projectId,
      pmProjectId: target.pmProjectId,
      scope: target.scope,
      createdById: actor.userId,
      assigneeId,
    },
  });

  const note = typeof body.note === "string" ? body.note.trim() : "";
  if (note) await prisma.taskNote.create({ data: { taskId: created.id, authorId: actor.userId, body: note } });

  const link = `${target.scope === "PM" ? "/pm/deadlines" : "/deadlines"}/${created.id}`;
  await notifyAssigned(assigneeId, { title: `Deadline assigned to you — ${title}`, link }, actor.userId);
  revalidateTaskPages();

  return NextResponse.json(
    { id: created.id, title: created.title, dueDate: dateOnly(created.dueDate), status: created.status },
    { status: 201 }
  );
}
