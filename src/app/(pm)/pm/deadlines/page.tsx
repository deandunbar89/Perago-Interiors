import { prisma } from "@/lib/prisma";
import DeadlinesExplorer from "./deadlines-explorer";
import { RANGES, type Range } from "./types";

export default async function DeadlinesPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const initialRange: Range = RANGES.includes(range as Range) ? (range as Range) : "7days";

  const [deadlines, projects] = await Promise.all([
    prisma.task.findMany({
      where: { scope: "PM" },
      include: {
        pmProject: true,
        subtasks: { orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }] },
        _count: { select: { taskNotes: true } },
      },
      orderBy: { dueDate: "asc" },
    }),
    prisma.pmProject.findMany({ orderBy: { title: "asc" } }),
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
