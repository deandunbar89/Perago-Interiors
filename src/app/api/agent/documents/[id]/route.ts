import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { badRequest, isResponse, requireAgent } from "@/lib/agent-auth";
import { resolveTarget } from "@/lib/agent-targets";
import { clearCrmQuote, clearPmQuote, issueCrmQuote, issuePmQuote } from "@/lib/quotes";

export const dynamic = "force-dynamic";

/**
 * Marks an uploaded file as the quote issued to the client, or removes the mark.
 * PATCH /api/agent/documents/<id>  JSON { target: "crm:<id>" | "pm:<id>", issued: true | false, value?: number, date?: "YYYY-MM-DD" }
 * Issuing a quote moves any earlier issued quote on the same tender / project to superseded.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireAgent(req);
  if (isResponse(actor)) return actor;
  const { id } = await params;
  let body: { target?: string; issued?: boolean; value?: number | string; date?: string };
  try {
    body = await req.json();
  } catch {
    return badRequest("Send JSON { target, issued, value?, date? }");
  }
  const target = await resolveTarget(body.target ?? null, true);
  if (typeof target === "string") return badRequest(target);
  if (typeof body.issued !== "boolean") return badRequest("issued must be true or false");

  const n = Number(String(body.value ?? "").replace(/[^0-9.]/g, ""));
  const value = Number.isFinite(n) && n > 0 ? n : null;
  const at = body.date && !Number.isNaN(new Date(body.date).getTime()) ? new Date(body.date) : undefined;

  let result: { error?: string; success?: boolean };
  if (target.pmProjectId) {
    result = body.issued ? await issuePmQuote(target.pmProjectId, id, { value, at }) : await clearPmQuote(target.pmProjectId, id);
    revalidatePath(`/pm/projects/${target.pmProjectId}`);
  } else {
    result = body.issued
      ? await issueCrmQuote(target.projectId!, id, { value, at, userId: actor.userId })
      : await clearCrmQuote(target.projectId!, id);
    revalidatePath(`/projects/${target.projectId}`);
  }
  if (result.error) return badRequest(result.error);
  revalidatePath("/dashboard");
  revalidatePath("/pm");
  return NextResponse.json({ id, issued: body.issued });
}
