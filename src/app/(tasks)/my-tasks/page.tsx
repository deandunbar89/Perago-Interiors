import { prisma } from "@/lib/prisma";
import { RANGES, type Range } from "@/lib/date-ranges";
import MyTasksExplorer from "./my-tasks-explorer";

export default async function MyTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const initialRange: Range = RANGES.includes(range as Range) ? (range as Range) : "7days";

  const [tasks, tenders, projects] = await Promise.all([
    prisma.subtask.findMany({
      include: { task: true, project: true, pmProject: true },
      orderBy: { dueDate: "asc" },
    }),
    prisma.project.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
    prisma.pmProject.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
  ]);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">My Tasks</h1>
        <p className="mt-1 text-sm text-slate-500">
          Everything actionable across the CRM and Project Management — one synced list
        </p>
      </div>
      <MyTasksExplorer tasks={tasks} tenders={tenders} projects={projects} initialRange={initialRange} />
    </div>
  );
}
