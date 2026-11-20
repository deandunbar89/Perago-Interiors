import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, dateOnly, isResponse, parseDate, readJson, requireAgent } from "@/lib/agent-auth";
import { revalidateTaskPages } from "@/lib/agent-targets";

export const dynamic = "force-dynamic";

/** Updates a task. Body: { status?: "OPEN"|"DONE", dueDate?: "YYYY-MM-DD"|null, title?, note? } */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireAgent(req);
  if (isResponse(actor)) return actor;

  const { id } = await params;
  const existing = await prisma.subtask.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const body = await readJson(req);
  const data: { status?: "OPEN" | "DONE"; dueDate?: Date | null; title?: string } = {};

  if (body.status !== undefined) {
    if (body.status !== "OPEN" && body.status !== "DONE") return badRequest('status must be "OPEN" or "DONE"');
    data.status = body.status;
  }
  try {
    const due = parseDate(body.dueDate);
    if (due !== undefined) data.dueDate = due;
  } catch (e) {
    return badRequest((e as Error).message);
  }
  if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();

  const row = await prisma.subtask.update({ where: { id }, data });

  const note = typeof body.note === "string" ? body.note.trim() : "";
  if (note) await prisma.note.create({ data: { subtaskId: id, authorId: actor.userId, body: note } });

  revalidateTaskPages();
  return NextResponse.json({ id: row.id, title: row.title, dueDate: dateOnly(row.dueDate), status: row.status });
}
