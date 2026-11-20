import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { badRequest, isResponse, readJson, requireAgent } from "@/lib/agent-auth";
import { resolveTarget } from "@/lib/agent-targets";

export const dynamic = "force-dynamic";

/** Adds a note to a tender or PM project — e.g. "Quote Q-0012 issued, saved to ...".
 * Body: { target: "crm:<id>" | "pm:<id>", body } */
export async function POST(req: Request) {
  const actor = await requireAgent(req);
  if (isResponse(actor)) return actor;

  const payload = await readJson(req);
  const text = typeof payload.body === "string" ? payload.body.trim() : "";
  if (!text) return badRequest("body is required");

  const target = await resolveTarget(payload.target, true);
  if (typeof target === "string") return badRequest(target);

  const note = await prisma.note.create({
    data: { projectId: target.projectId, pmProjectId: target.pmProjectId, authorId: actor.userId, body: text },
  });

  revalidatePath(target.pmProjectId ? `/pm/projects/${target.pmProjectId}` : `/projects/${target.projectId}`);
  return NextResponse.json({ id: note.id }, { status: 201 });
}
