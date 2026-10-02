import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { canAccessTask, getTaskViewer } from "@/lib/task-access";
import TaskDetail from "./task-detail";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viewer = await getTaskViewer();

  const [task, users] = await Promise.all([
    prisma.subtask.findUnique({
      where: { id },
      include: {
        task: true,
        project: true,
        pmProject: true,
        assignee: true,
        watchers: true,
        notes: { orderBy: { createdAt: "desc" }, include: { author: true } },
      },
    }),
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  if (!task || !canAccessTask(viewer, task)) notFound();

  return (
    <div className="mx-auto max-w-2xl p-8">
      <TaskDetail task={task} users={users} />
    </div>
  );
}
