import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TaskDetail from "./task-detail";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const task = await prisma.subtask.findUnique({
    where: { id },
    include: {
      task: true,
      project: true,
      pmProject: true,
      notes: { orderBy: { createdAt: "desc" }, include: { author: true } },
    },
  });

  if (!task) notFound();

  return (
    <div className="mx-auto max-w-2xl p-8">
      <TaskDetail task={task} />
    </div>
  );
}
