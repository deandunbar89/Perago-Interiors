import { prisma } from "@/lib/prisma";
import { RANGES, type Range } from "@/lib/date-ranges";
import { getTaskViewer, taskVisibility } from "@/lib/task-access";
import MyTasksExplorer from "./my-tasks-explorer";

export default async function MyTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const initialRange: Range = RANGES.includes(range as Range) ? (range as Range) : "7days";
  const viewer = await getTaskViewer();

  const [tasks, tenders, projects, users] = await Promise.all([
    prisma.subtask.findMany({
      where: taskVisibility(viewer),
      include: { task: true, project: true, pmProject: true, assignee: true },
      orderBy: { dueDate: "asc" },
    }),
    prisma.project.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
    prisma.pmProject.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">{viewer.isAdmin ? "All Tasks" : "My Tasks"}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {viewer.isAdmin
            ? "Everyone's tasks across the CRM and Project Management — filter by person to focus"
            : "Tasks assigned to you, plus anything you've created or been tagged on"}
        </p>
      </div>
      <MyTasksExplorer
        tasks={tasks}
        tenders={tenders}
        projects={projects}
        users={users}
        isAdmin={viewer.isAdmin}
        currentUserId={viewer.userId}
        initialRange={initialRange}
      />
    </div>
  );
}
