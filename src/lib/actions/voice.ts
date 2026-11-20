"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { notifyAssigned } from "@/lib/notify";
import { assertDeadlineAccess, assertSubtaskAccess, getTaskViewer, taskVisibility } from "@/lib/task-access";
import { interpretSpokenNote, type VoiceItem } from "@/lib/voice-interpreter";

/** A proposed action, checked against the database and labelled for the confirm screen. */
export type VoiceProposal = VoiceItem & {
  projectLabel: string | null;
  assigneeName: string;
  existingLabel: string | null;
  problem: string | null; // set when this item can't be saved as it stands
};

const LIVE_TENDER_STAGES = ["LEAD", "REVIEWING", "TENDER_SUBMITTED", "ON_HOLD", "WON"] as const;

function dubaiToday() {
  const now = new Date();
  const ymd = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Dubai" }).format(now);
  const weekday = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dubai", weekday: "long" }).format(now);
  return { ymd, weekday };
}

const isYmd = (v: string | null) => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(v).getTime());

async function loadContext(userId: string, isAdmin: boolean) {
  const [tenders, pmProjects, team, deadlines, tasks, me] = await Promise.all([
    prisma.project.findMany({
      where: { stage: { in: [...LIVE_TENDER_STAGES] }, pmProject: null },
      select: { id: true, title: true, client: { select: { name: true } } },
    }),
    prisma.pmProject.findMany({
      where: { status: { in: ["ACTIVE", "ON_HOLD"] } },
      select: { id: true, title: true, client: { select: { name: true } } },
    }),
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.task.findMany({
      where: { ...taskVisibility({ userId, isAdmin }), status: "OPEN" },
      select: { id: true, title: true, dueDate: true },
      orderBy: { dueDate: "asc" },
      take: 60,
    }),
    prisma.subtask.findMany({
      where: { ...taskVisibility({ userId, isAdmin }), status: "OPEN" },
      select: { id: true, title: true, dueDate: true },
      orderBy: { dueDate: "asc" },
      take: 80,
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
  ]);

  const projects = [
    ...pmProjects.map((p) => ({ ref: `pm:${p.id}`, label: `${p.title}${p.client ? ` (client ${p.client.name})` : ""} – live project` })),
    ...tenders.map((t) => ({ ref: `crm:${t.id}`, label: `${t.title}${t.client ? ` (client ${t.client.name})` : ""} – tender` })),
  ];
  const due = (d: Date | null) => (d ? ` (due ${d.toISOString().slice(0, 10)})` : "");
  const openItems = [
    ...deadlines.map((d) => ({ ref: `deadline:${d.id}`, label: `Deadline: ${d.title}${due(d.dueDate)}` })),
    ...tasks.map((t) => ({ ref: `task:${t.id}`, label: `Task: ${t.title}${due(t.dueDate)}` })),
  ];
  return { projects, team, openItems, speakerName: me?.name ?? "the user" };
}

/** Step 1 — read the spoken note and propose what to do. Saves nothing. */
export async function interpretSpoken(text: string): Promise<
  { ok: true; proposals: VoiceProposal[]; question: string | null } | { ok: false; error: string }
> {
  const viewer = await getTaskViewer();
  const note = text.trim();
  if (!note) return { ok: false, error: "Say or type what you need first." };
  if (note.length > 2000) return { ok: false, error: "That's a bit long — try a few shorter notes." };

  const ctx = await loadContext(viewer.userId, viewer.isAdmin);
  const { ymd, weekday } = dubaiToday();
  const result = await interpretSpokenNote(note, { today: ymd, weekday, ...ctx });
  if (!result.ok) return result;

  const projectLabels = new Map(ctx.projects.map((p) => [p.ref, p.label.replace(/ – (live project|tender)$/, "")]));
  const teamNames = new Map(ctx.team.map((u) => [u.id, u.name]));
  const openLabels = new Map(ctx.openItems.map((i) => [i.ref, i.label]));

  const proposals: VoiceProposal[] = result.items.map((item) => {
    const projectRef = item.projectRef && projectLabels.has(item.projectRef) ? item.projectRef : null;
    const assigneeId = item.assigneeId && teamNames.has(item.assigneeId) ? item.assigneeId : null;
    const existingItemRef = item.existingItemRef && openLabels.has(item.existingItemRef) ? item.existingItemRef : null;
    const dueDate = isYmd(item.dueDate) ? item.dueDate : null;

    let problem: string | null = null;
    if (item.action === "complete" && !existingItemRef) problem = "Couldn't find that item to tick off";
    if (item.action === "add_task" && !projectRef) problem = "Which project is this for?";
    if (item.action === "add_deadline" && !dueDate) problem = "A deadline needs a date";

    return {
      ...item,
      projectRef,
      assigneeId,
      existingItemRef,
      dueDate,
      projectLabel: projectRef ? projectLabels.get(projectRef)! : null,
      assigneeName: assigneeId ? teamNames.get(assigneeId)! : "You",
      existingLabel: existingItemRef ? openLabels.get(existingItemRef)! : null,
      problem,
    };
  });

  return { ok: true, proposals, question: result.question };
}

/** Step 2 — save the items the person confirmed. Every id is re-checked here. */
export async function applySpoken(items: VoiceItem[]): Promise<{ ok: true; saved: string[] } | { ok: false; error: string }> {
  const viewer = await getTaskViewer();
  const saved: string[] = [];

  for (const item of items.slice(0, 20)) {
    const title = item.title?.trim();
    const dueDate = isYmd(item.dueDate) ? new Date(item.dueDate!) : null;

    if (item.action === "complete") {
      const [kind, id] = (item.existingItemRef ?? "").split(":");
      if (!id) continue;
      try {
        if (kind === "task") {
          await assertSubtaskAccess(viewer, id);
          const row = await prisma.subtask.update({ where: { id }, data: { status: "DONE" } });
          saved.push(`Done: ${row.title}`);
        } else if (kind === "deadline") {
          await assertDeadlineAccess(viewer, id);
          const row = await prisma.task.update({ where: { id }, data: { status: "DONE" } });
          saved.push(`Done: ${row.title}`);
        }
      } catch {
        // not theirs or gone — skip
      }
      continue;
    }

    if (!title) continue;

    let projectId: string | null = null;
    let pmProjectId: string | null = null;
    const ref = item.projectRef ?? "";
    if (ref.startsWith("pm:")) {
      const found = await prisma.pmProject.findUnique({ where: { id: ref.slice(3) }, select: { id: true } });
      pmProjectId = found?.id ?? null;
    } else if (ref.startsWith("crm:")) {
      const found = await prisma.project.findUnique({ where: { id: ref.slice(4) }, select: { id: true } });
      projectId = found?.id ?? null;
    }
    const scope = pmProjectId ? "PM" : "CRM";

    let assigneeId = viewer.userId;
    if (item.assigneeId) {
      const found = await prisma.user.findUnique({ where: { id: item.assigneeId }, select: { id: true } });
      if (found) assigneeId = found.id;
    }

    if (item.action === "add_task") {
      if (!projectId && !pmProjectId) continue;
      const created = await prisma.subtask.create({
        data: { title, dueDate, projectId, pmProjectId, scope, createdById: viewer.userId, assigneeId },
      });
      await notifyAssigned(assigneeId, { title: `New task assigned to you — ${title}`, link: `/my-tasks/${created.id}` }, viewer.userId);
      saved.push(`Task: ${title}`);
    } else if (item.action === "add_deadline") {
      if (!dueDate) continue;
      const created = await prisma.task.create({
        data: { title, dueDate, projectId, pmProjectId, scope, createdById: viewer.userId, assigneeId },
      });
      await notifyAssigned(
        assigneeId,
        { title: `Deadline assigned to you — ${title}`, link: `${scope === "PM" ? "/pm/deadlines" : "/deadlines"}/${created.id}` },
        viewer.userId
      );
      saved.push(`Deadline: ${title}`);
    }
  }

  for (const path of ["/my-tasks", "/tasks", "/deadlines", "/dashboard", "/pm", "/pm/tasks", "/pm/deadlines", "/"]) {
    revalidatePath(path);
  }
  if (saved.length === 0) return { ok: false, error: "Nothing could be saved — check the items and try again." };
  return { ok: true, saved };
}
