import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { appOrigin } from "@/lib/recruitment-calendar";
import { buildDeadlinesCalendar, userIdFromDeadlinesToken, type CalendarItem } from "@/lib/deadlines-calendar";
import { taskVisibility } from "@/lib/task-access";

// Public by design (Outlook can't sign in) but guarded by the signed, per-person link. Shows the
// open deadlines and tasks that person can see in the app — admins see everything, members see
// what's assigned to them, created by them or tagged to them.
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const userId = userIdFromDeadlinesToken(token);
  if (!userId) return new NextResponse("Not found", { status: 404 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
  if (!user) return new NextResponse("Not found", { status: 404 });

  const visibility = taskVisibility({ userId: user.id, isAdmin: user.role === "ADMIN" });
  // Two months back to everything upcoming; finished items drop off on the next refresh.
  const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const where = { ...visibility, status: "OPEN" as const, dueDate: { gte: since } };
  const select = {
    id: true,
    title: true,
    dueDate: true,
    updatedAt: true,
    scope: true,
    assignee: { select: { name: true } },
    project: { select: { title: true } },
    pmProject: { select: { title: true } },
  } as const;

  const [deadlines, tasks] = await Promise.all([
    prisma.task.findMany({ where, select, orderBy: { dueDate: "asc" } }),
    prisma.subtask.findMany({ where, select, orderBy: { dueDate: "asc" } }),
  ]);

  const toItem =
    (kind: CalendarItem["kind"]) =>
    (row: (typeof deadlines)[number]): CalendarItem => ({
      kind,
      id: row.id,
      title: row.title,
      dueDate: row.dueDate!,
      updatedAt: row.updatedAt,
      scope: row.scope,
      projectTitle: row.pmProject?.title ?? row.project?.title ?? null,
      assigneeName: row.assignee?.name ?? null,
    });

  const items = [...deadlines.map(toItem("deadline")), ...tasks.map(toItem("task"))];

  return new NextResponse(buildDeadlinesCalendar(items, appOrigin(req.headers, req.url)), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="perago-deadlines.ics"',
      "Cache-Control": "private, no-store",
    },
  });
}
