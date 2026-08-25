import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/constants";
import { deadlineGroupMatchesRange } from "../deadlines/filter-deadlines";
import PipelineBoard from "./pipeline-board";
import StatCard from "./stat-card";

export default async function DashboardPage() {
  const [projects, deadlines] = await Promise.all([
    prisma.project.findMany({
      include: { client: true, owner: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.task.findMany({
      where: { status: "OPEN" },
      include: { subtasks: true, project: true },
    }),
  ]);

  const openStages = ["LEAD", "REVIEWING", "TENDER_SUBMITTED", "ON_HOLD"];
  const openProjects = projects.filter((p) => openStages.includes(p.stage));
  const wonProjects = projects.filter((p) => p.stage === "WON");
  const lostProjects = projects.filter((p) => p.stage === "LOST");
  const declinedProjects = projects.filter((p) => p.stage === "DECLINED");
  const decided = wonProjects.length + lostProjects.length;
  const winRate = decided > 0 ? Math.round((wonProjects.length / decided) * 100) : null;

  const pipelineValue = openProjects.reduce((sum, p) => sum + (p.value || 0), 0);

  const upcomingDeadlines = deadlines.filter((d) => deadlineGroupMatchesRange(d, "14days"));

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Your tender pipeline at a glance</p>
        </div>
        <Link
          href="/projects/new"
          className="flex items-center gap-1.5 rounded-lg bg-charcoal px-4 py-2 text-sm font-medium text-white transition hover:bg-jet"
        >
          <Plus size={16} />
          New Project
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Open Tenders" value={String(openProjects.length)} />
        <StatCard label="Pipeline Value" value={formatNumber(pipelineValue)} currency="AED" />
        <StatCard label="Win Rate" value={winRate === null ? "—" : `${winRate}%`} />
        <StatCard label="Declined" value={String(declinedProjects.length)} href="/projects?stage=DECLINED" />
        <StatCard
          label="Deadlines (14d)"
          value={String(upcomingDeadlines.length)}
          accent={upcomingDeadlines.length > 0 ? "warn" : undefined}
          href="/deadlines?range=14days"
        />
      </div>

      <PipelineBoard projects={projects} />
    </div>
  );
}
