import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DeadlineHeader from "./deadline-header";
import TasksPanel from "./tasks-panel";
import DeadlineNotes from "./deadline-notes";

export default async function DeadlineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const deadline = await prisma.task.findUnique({
    where: { id },
    include: {
      pmProject: true,
      taskNotes: { orderBy: { createdAt: "desc" }, include: { author: true } },
      subtasks: { orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }] },
    },
  });

  if (!deadline) notFound();

  return (
    <div className="mx-auto max-w-2xl p-8">
      <DeadlineHeader deadline={deadline} project={deadline.pmProject} />
      <TasksPanel deadlineId={deadline.id} tasks={deadline.subtasks} />
      <DeadlineNotes deadlineId={deadline.id} notes={deadline.taskNotes} />
    </div>
  );
}
