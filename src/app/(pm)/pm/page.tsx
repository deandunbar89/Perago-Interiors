import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/constants";
import StatCard from "@/app/(app)/dashboard/stat-card";
import { deadlineGroupMatchesRange } from "./deadlines/filter-deadlines";
import PmProjectCard from "./pm-project-card";

const RECENT_COUNT = 6;

export default async function PmDashboardPage() {
  const [pmProjects, totalCount, activeCount, activeValue, deadlines] = await Promise.all([
    prisma.pmProject.findMany({
      include: {
        client: true,
        linkedTender: true,
        scheduleItems: { select: { percentComplete: true, status: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: RECENT_COUNT,
    }),
    prisma.pmProject.count(),
    prisma.pmProject.count({ where: { status: "ACTIVE" } }),
    prisma.pmProject.aggregate({ where: { status: "ACTIVE" }, _sum: { value: true } }),
    prisma.task.findMany({
      where: { scope: "PM", status: "OPEN" },
      include: { subtasks: true, pmProject: true },
    }),
  ]);

  const upcomingDeadlines = deadlines.filter((d) => deadlineGroupMatchesRange(d, "14days"));

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Awarded work at a glance</p>
        </div>
        <Link
          href="/pm/projects/new"
          className="flex items-center gap-1.5 rounded-lg bg-charcoal px-4 py-2 text-sm font-medium text-white transition hover:bg-jet"
        >
          <Plus size={16} />
          New Project
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Active Projects" value={String(activeCount)} href="/pm/projects" />
        <StatCard
          label="Active Value"
          value={formatNumber(activeValue._sum.value ?? 0)}
          currency="AED"
          href="/pm/projects"
        />
        <StatCard label="Total Projects" value={String(totalCount)} href="/pm/projects" />
        <StatCard
          label="Deadlines (14d)"
          value={String(upcomingDeadlines.length)}
          accent={upcomingDeadlines.length > 0 ? "warn" : undefined}
          href="/pm/deadlines?range=14days"
        />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recent Projects</h2>
        <Link href="/pm/projects" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
          View all
          <ArrowRight size={14} />
        </Link>
      </div>

      {pmProjects.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
          No PM projects yet. Create one, or promote a Won tender from the CRM.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pmProjects.map((project) => (
            <PmProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
