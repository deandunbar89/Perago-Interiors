import Image from "next/image";
import Link from "next/link";
import { isPast, isToday, startOfDay } from "date-fns";
import { Handshake, HardHat, CheckSquare } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/constants";
import { matchesRange } from "@/lib/date-ranges";
import AppSwitcherRail from "@/components/app-switcher-rail";
import StatCard from "@/app/(app)/dashboard/stat-card";

// The activity numbers are live counts, not static content — force this page to be
// rendered per-request instead of prerendered once at build time.
export const dynamic = "force-dynamic";

const TILES = [
  {
    href: "/dashboard",
    icon: Handshake,
    title: "CRM",
    description: "Track tenders through the pipeline, from lead to award.",
  },
  {
    href: "/pm",
    icon: HardHat,
    title: "Project Management",
    description: "Run awarded projects — schedules, documents, deadlines.",
  },
  {
    href: "/my-tasks",
    icon: CheckSquare,
    title: "Tasks",
    description: "Everything actionable across CRM and PM, in one list.",
  },
] as const;

const OPEN_STAGES = ["LEAD", "REVIEWING", "TENDER_SUBMITTED", "ON_HOLD"];

function deadlineWithinTwoWeeks(d: {
  dueDate: Date | null;
  status: "OPEN" | "DONE";
  subtasks: { dueDate: Date | null; status: "OPEN" | "DONE" }[];
}) {
  if (matchesRange(d, "14days")) return true;
  return d.subtasks.some((s) => s.status === "OPEN" && matchesRange(s, "14days"));
}

function StatGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">{children}</div>
    </div>
  );
}

export default async function HomePage() {
  const [projects, pmProjects, crmDeadlines, pmDeadlines, openTasks] = await Promise.all([
    prisma.project.findMany({ select: { stage: true, value: true } }),
    prisma.pmProject.findMany({ select: { status: true, value: true } }),
    prisma.task.findMany({
      where: { scope: "CRM", status: "OPEN" },
      select: { dueDate: true, status: true, subtasks: { select: { dueDate: true, status: true } } },
    }),
    prisma.task.findMany({
      where: { scope: "PM", status: "OPEN" },
      select: { dueDate: true, status: true, subtasks: { select: { dueDate: true, status: true } } },
    }),
    prisma.subtask.findMany({ where: { status: "OPEN" }, select: { scope: true, dueDate: true } }),
  ]);

  // CRM
  const openTenders = projects.filter((p) => OPEN_STAGES.includes(p.stage));
  const pipelineValue = openTenders.reduce((sum, p) => sum + (p.value || 0), 0);
  const wonCount = projects.filter((p) => p.stage === "WON").length;
  const lostCount = projects.filter((p) => p.stage === "LOST").length;
  const declinedCount = projects.filter((p) => p.stage === "DECLINED").length;
  const decided = wonCount + lostCount;
  const winRate = decided > 0 ? Math.round((wonCount / decided) * 100) : null;
  const crmDeadlines14d = crmDeadlines.filter(deadlineWithinTwoWeeks).length;

  // PM
  const activePm = pmProjects.filter((p) => p.status === "ACTIVE");
  const activeValue = activePm.reduce((sum, p) => sum + (p.value || 0), 0);
  const onHoldCount = pmProjects.filter((p) => p.status === "ON_HOLD").length;
  const pmDeadlines14d = pmDeadlines.filter(deadlineWithinTwoWeeks).length;

  // Tasks
  const overdueTasks = openTasks.filter(
    (t) => t.dueDate && isPast(startOfDay(t.dueDate)) && !isToday(t.dueDate)
  ).length;
  const dueTodayTasks = openTasks.filter((t) => t.dueDate && isToday(t.dueDate)).length;
  const crmOpenTasks = openTasks.filter((t) => t.scope === "CRM").length;
  const pmOpenTasks = openTasks.filter((t) => t.scope === "PM").length;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AppSwitcherRail active="home" />
      <main className="flex-1 min-w-0 p-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 flex flex-col items-center text-center">
            <Image
              src="/brand/icon-tile-champagne.png"
              alt="Perago"
              width={1200}
              height={1200}
              className="mb-4 h-16 w-16 rounded-2xl shadow-sm"
              priority
            />
            <h1 className="text-3xl font-semibold text-slate-900">Perago</h1>
            <p className="mt-1.5 text-sm text-slate-500">Choose where you want to work</p>
          </div>

          <div className="mb-14 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {TILES.map(({ href, icon: Icon, title, description }) => (
              <Link
                key={href}
                href={href}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-gold hover:shadow-md"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-charcoal text-gold transition group-hover:bg-jet">
                  <Icon size={20} />
                </div>
                <h2 className="mb-1.5 text-base font-semibold text-slate-900">{title}</h2>
                <p className="text-sm leading-relaxed text-slate-500">{description}</p>
              </Link>
            ))}
          </div>

          <div className="space-y-10">
            <StatGroup label="CRM">
              <StatCard label="Open Tenders" value={String(openTenders.length)} href="/dashboard" />
              <StatCard label="Pipeline Value" value={formatNumber(pipelineValue)} currency="AED" href="/dashboard" />
              <StatCard label="Win Rate" value={winRate === null ? "—" : `${winRate}%`} href="/dashboard" />
              <StatCard label="Declined" value={String(declinedCount)} href="/projects?stage=DECLINED" />
              <StatCard
                label="Deadlines (14d)"
                value={String(crmDeadlines14d)}
                accent={crmDeadlines14d > 0 ? "warn" : undefined}
                href="/deadlines?range=14days"
              />
            </StatGroup>

            <StatGroup label="Project Management">
              <StatCard label="Active Projects" value={String(activePm.length)} href="/pm/projects" />
              <StatCard label="Active Value" value={formatNumber(activeValue)} currency="AED" href="/pm/projects" />
              <StatCard label="On Hold" value={String(onHoldCount)} href="/pm/projects" />
              <StatCard label="Total Projects" value={String(pmProjects.length)} href="/pm/projects" />
              <StatCard
                label="Deadlines (14d)"
                value={String(pmDeadlines14d)}
                accent={pmDeadlines14d > 0 ? "warn" : undefined}
                href="/pm/deadlines?range=14days"
              />
            </StatGroup>

            <StatGroup label="Tasks">
              <StatCard label="Open Tasks" value={String(openTasks.length)} href="/my-tasks" />
              <StatCard
                label="Overdue"
                value={String(overdueTasks)}
                accent={overdueTasks > 0 ? "warn" : undefined}
                href="/my-tasks?range=overdue"
              />
              <StatCard label="Due Today" value={String(dueTodayTasks)} href="/my-tasks?range=today" />
              <StatCard label="CRM Tasks" value={String(crmOpenTasks)} href="/my-tasks" />
              <StatCard label="PM Tasks" value={String(pmOpenTasks)} href="/my-tasks" />
            </StatGroup>
          </div>
        </div>
      </main>
    </div>
  );
}
