import { revalidatePath } from "next/cache";
import { resolveTarget } from "@/lib/agent-targets";
import { markTenderReviewing } from "@/lib/quotes";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, dateOnly, isResponse, requireAgent } from "@/lib/agent-auth";

export const dynamic = "force-dynamic";

/** Every tender and PM project with its id, plus the team — so a coworker can file
 * tasks, deadlines and notes against the right one. */
export async function GET(req: Request) {
  const actor = await requireAgent(req);
  if (isResponse(actor)) return actor;

  const [tenders, projects, team] = await Promise.all([
    prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        reference: true,
        stage: true,
        location: true,
        submissionDeadline: true,
        client: { select: { name: true } },
        pmProject: { select: { id: true } },
      },
    }),
    prisma.pmProject.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        location: true,
        targetEndDate: true,
        client: { select: { name: true } },
        linkedTenderId: true,
      },
    }),
    prisma.user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, email: true, role: true } }),
  ]);

  return NextResponse.json({
    tenders: tenders.map((t) => ({
      target: `crm:${t.id}`,
      id: t.id,
      title: t.title,
      reference: t.reference,
      client: t.client?.name ?? null,
      stage: t.stage,
      location: t.location,
      submissionDeadline: dateOnly(t.submissionDeadline),
      pmProjectId: t.pmProject?.id ?? null,
    })),
    projects: projects.map((p) => ({
      target: `pm:${p.id}`,
      id: p.id,
      title: p.title,
      client: p.client?.name ?? null,
      status: p.status,
      location: p.location,
      targetEndDate: dateOnly(p.targetEndDate),
      linkedTenderId: p.linkedTenderId,
    })),
    team,
  });
}

/**
 * PATCH /api/agent/projects  JSON { target: "crm:<id>", stage: "REVIEWING" }
 * Commercial calls this when it starts working on a quote: a Lead tender moves to Reviewing.
 * Only moves a tender forward from Lead; any other stage is left as it is.
 */
export async function PATCH(req: Request) {
  const actor = await requireAgent(req);
  if (isResponse(actor)) return actor;
  let body: { target?: string; stage?: string };
  try {
    body = await req.json();
  } catch {
    return badRequest('Send JSON { target: "crm:<id>", stage: "REVIEWING" }');
  }
  if (body.stage !== "REVIEWING") return badRequest('stage must be "REVIEWING" (Submitted is set by marking a quote issued)');
  const target = await resolveTarget(body.target ?? null, true);
  if (typeof target === "string") return badRequest(target);
  if (!target.projectId) return badRequest("target must be a tender (crm:<id>)");
  const moved = await markTenderReviewing(target.projectId, actor.userId);
  const project = await prisma.project.findUnique({ where: { id: target.projectId }, select: { stage: true } });
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath(`/projects/${target.projectId}`);
  return NextResponse.json({ moved, stage: project?.stage ?? null });
}
