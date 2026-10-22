import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getRecruitmentTeam } from "@/lib/recruitment-team";
import RecruitmentTasksPanel from "../tasks-panel";
import { taskRowInclude } from "../types";

export const dynamic = "force-dynamic";

export default async function RecruitmentTasksPage() {
  const session = await auth();
  const [tasks, team] = await Promise.all([
    prisma.recruitmentTask.findMany({
      include: taskRowInclude,
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    }),
    getRecruitmentTeam(),
  ]);

  return (
    <div className="p-8">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Recruitment tasks</h1>
      <p className="mb-6 text-sm text-slate-500">To-dos across every vacancy and candidate</p>
      <RecruitmentTasksPanel
        tasks={tasks}
        team={team}
        currentUserId={session?.user?.id ?? ""}
        showContext
        showFilters
      />
    </div>
  );
}
