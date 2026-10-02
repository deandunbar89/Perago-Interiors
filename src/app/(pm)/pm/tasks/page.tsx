import { prisma } from "@/lib/prisma";
import { RANGES, type Range } from "@/lib/date-ranges";
import { getTaskViewer, taskVisibility } from "@/lib/task-access";
import TasksExplorer from "./tasks-explorer";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const initialRange: Range = RANGES.includes(range as Range) ? (range as Range) : "7days";
  const viewer = await getTaskViewer();
  const visible = taskVisibility(viewer);

  const [tasks, projects, deadlines, users] = await Promise.all([
    prisma.subtask.findMany({
      where: { scope: "PM", ...visible },
      include: { task: true, pmProject: true },
      orderBy: { dueDate: "asc" },
    }),
    prisma.pmProject.findMany({ orderBy: { title: "asc" } }),
    prisma.task.findMany({ where: { scope: "PM", ...visible }, orderBy: { title: "asc" } }),
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Tasks</h1>
        <p className="mt-1 text-sm text-slate-500">
          Everything actionable — from deadlines and projects, or on its own — in one working list
        </p>
      </div>
      <TasksExplorer
        tasks={tasks}
        projects={projects}
        deadlines={deadlines}
        users={users}
        currentUserId={viewer.userId}
        initialRange={initialRange}
      />
    </div>
  );
}
