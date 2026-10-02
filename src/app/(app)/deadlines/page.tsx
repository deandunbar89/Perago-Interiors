import { prisma } from "@/lib/prisma";
import { getTaskViewer, taskVisibility } from "@/lib/task-access";
import DeadlinesExplorer from "./deadlines-explorer";
import { RANGES, type Range } from "./types";

export default async function DeadlinesPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const initialRange: Range = RANGES.includes(range as Range) ? (range as Range) : "7days";

  const viewer = await getTaskViewer();
  const visible = taskVisibility(viewer);

  const [deadlines, projects] = await Promise.all([
    prisma.task.findMany({
      where: { scope: "CRM", ...visible },
      include: {
        project: true,
        subtasks: { where: visible, orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }] },
        _count: { select: { taskNotes: true } },
      },
      orderBy: { dueDate: "asc" },
    }),
    prisma.project.findMany({ orderBy: { title: "asc" } }),
  ]);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Deadlines</h1>
        <p className="mt-1 text-sm text-slate-500">
          The hard dates you can&apos;t miss, prioritized by when they&apos;re due
        </p>
      </div>
      <DeadlinesExplorer deadlines={deadlines} projects={projects} initialRange={initialRange} />
    </div>
  );
}
