import { prisma } from "@/lib/prisma";
import { RANGES, type Range } from "@/lib/date-ranges";
import TasksExplorer from "./tasks-explorer";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const initialRange: Range = RANGES.includes(range as Range) ? (range as Range) : "7days";

  const [tasks, projects, deadlines] = await Promise.all([
    prisma.subtask.findMany({
      where: { scope: "PM" },
      include: { task: true, pmProject: true },
      orderBy: { dueDate: "asc" },
    }),
    prisma.pmProject.findMany({ orderBy: { title: "asc" } }),
    prisma.task.findMany({ where: { scope: "PM" }, orderBy: { title: "asc" } }),
  ]);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Tasks</h1>
        <p className="mt-1 text-sm text-slate-500">
          Everything actionable — from deadlines and projects, or on its own — in one working list
        </p>
      </div>
      <TasksExplorer tasks={tasks} projects={projects} deadlines={deadlines} initialRange={initialRange} />
    </div>
  );
}
