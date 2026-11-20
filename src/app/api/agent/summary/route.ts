import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addDays, dateOnly, dubaiToday, isResponse, requireAgent } from "@/lib/agent-auth";
import { appOrigin } from "@/lib/recruitment-calendar";

export const dynamic = "force-dynamic";

const LIVE_TENDER_STAGES = ["LEAD", "REVIEWING", "TENDER_SUBMITTED", "ON_HOLD"] as const;

/**
 * Everything a morning briefing or weekly report needs in one call:
 * open deadlines and tasks (overdue + due in the next `days`, default 7), live tenders and
 * PM projects with their progress and open snags.
 */
export async function GET(req: Request) {
  const actor = await requireAgent(req);
  if (isResponse(actor)) return actor;

  const url = new URL(req.url);
  const days = Math.min(Math.max(Number(url.searchParams.get("days")) || 7, 1), 90);
  const origin = appOrigin(req.headers, req.url);

  const today = dubaiToday();
  const horizon = addDays(today, days);
  const before = new Date(`${addDays(horizon, 1)}T00:00:00Z`);

  const itemSelect = {
    id: true,
    title: true,
    dueDate: true,
    scope: true,
    assignee: { select: { name: true } },
    project: { select: { id: true, title: true } },
    pmProject: { select: { id: true, title: true } },
  } as const;

  const [deadlines, tasks, tenders, pmProjects] = await Promise.all([
    prisma.task.findMany({
      where: { status: "OPEN", dueDate: { lt: before } },
      orderBy: { dueDate: "asc" },
      select: itemSelect,
    }),
    prisma.subtask.findMany({
      where: { status: "OPEN", dueDate: { lt: before } },
      orderBy: { dueDate: "asc" },
      select: itemSelect,
    }),
    prisma.project.findMany({
      where: { stage: { in: [...LIVE_TENDER_STAGES] } },
      orderBy: { submissionDeadline: "asc" },
      select: {
        id: true,
        title: true,
        reference: true,
        stage: true,
        value: true,
        currency: true,
        submissionDeadline: true,
        siteVisitDate: true,
        client: { select: { name: true } },
      },
    }),
    prisma.pmProject.findMany({
      where: { status: { in: ["ACTIVE", "ON_HOLD"] } },
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
        status: true,
        value: true,
        currency: true,
        location: true,
        startDate: true,
        targetEndDate: true,
        client: { select: { name: true } },
        scheduleItems: { select: { title: true, percentComplete: true, status: true, endDate: true } },
        snags: { where: { status: "OPEN" }, select: { priority: true } },
      },
    }),
  ]);

  type Item = (typeof deadlines)[number];
  const shape = (kind: "deadline" | "task") => (item: Item) => {
    const due = dateOnly(item.dueDate)!;
    const project = item.pmProject
      ? { type: "pm", id: item.pmProject.id, title: item.pmProject.title }
      : item.project
        ? { type: "tender", id: item.project.id, title: item.project.title }
        : null;
    const link =
      kind === "task"
        ? `${origin}/my-tasks/${item.id}`
        : `${origin}${item.scope === "PM" ? "/pm/deadlines" : "/deadlines"}/${item.id}`;
    return {
      kind,
      id: item.id,
      title: item.title,
      due,
      overdue: due < today,
      dueToday: due === today,
      assignee: item.assignee?.name ?? null,
      project,
      link,
    };
  };

  const items = [...deadlines.map(shape("deadline")), ...tasks.map(shape("task"))].sort((a, b) =>
    a.due.localeCompare(b.due)
  );

  return NextResponse.json({
    actingAs: actor.name,
    today,
    horizon,
    overdue: items.filter((i) => i.overdue),
    dueToday: items.filter((i) => i.dueToday),
    upcoming: items.filter((i) => !i.overdue && !i.dueToday),
    tenders: tenders.map((t) => ({
      id: t.id,
      title: t.title,
      reference: t.reference,
      client: t.client?.name ?? null,
      stage: t.stage,
      value: t.value,
      currency: t.currency,
      submissionDeadline: dateOnly(t.submissionDeadline),
      siteVisitDate: dateOnly(t.siteVisitDate),
      link: `${origin}/projects/${t.id}`,
    })),
    projects: pmProjects.map((p) => {
      const schedule = p.scheduleItems;
      const progress = schedule.length
        ? Math.round(schedule.reduce((sum, s) => sum + s.percentComplete, 0) / schedule.length)
        : null;
      return {
        id: p.id,
        title: p.title,
        client: p.client?.name ?? null,
        status: p.status,
        location: p.location,
        value: p.value,
        currency: p.currency,
        startDate: dateOnly(p.startDate),
        targetEndDate: dateOnly(p.targetEndDate),
        scheduleProgressPercent: progress,
        lateScheduleItems: schedule
          .filter((s) => s.status !== "DONE" && dateOnly(s.endDate)! < today)
          .map((s) => ({ title: s.title, endDate: dateOnly(s.endDate), percentComplete: s.percentComplete })),
        openSnags: p.snags.length,
        openHighPrioritySnags: p.snags.filter((s) => s.priority === "HIGH").length,
        link: `${origin}/pm/projects/${p.id}`,
      };
    }),
  });
}
