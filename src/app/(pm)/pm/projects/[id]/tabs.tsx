"use client";

import { useState } from "react";
import type { Client } from "@prisma/client";
import type { PmProjectDetail } from "./types";
import DashboardTab from "./dashboard-tab";
import ScheduleTab from "./schedule-tab";
import TasksTab from "./tasks-tab";
import NotesTab from "./notes-tab";
import CategoryTab from "./category-tab";

const TABS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "schedule", label: "Schedule" },
  { key: "tasks", label: "Tasks" },
  { key: "notes", label: "Notes" },
  { key: "procurement", label: "Procurement" },
  { key: "design", label: "Design" },
  { key: "commercial", label: "Commercial" },
  { key: "site-works", label: "Site Works" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function Tabs({ project, clients }: { project: PmProjectDetail; clients: Client[] }) {
  const [active, setActive] = useState<TabKey>("dashboard");

  return (
    <div>
      <div className="mb-6 flex gap-1 border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`relative px-4 py-2.5 text-sm font-medium transition ${
              active === tab.key ? "text-slate-900" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.label}
            {tab.key === "schedule" && project.scheduleItems.length > 0 && (
              <span className="ml-1.5 text-xs text-slate-400">{project.scheduleItems.length}</span>
            )}
            {tab.key === "tasks" && project.subtasks.length > 0 && (
              <span className="ml-1.5 text-xs text-slate-400">{project.subtasks.length}</span>
            )}
            {tab.key === "notes" && project.notes.length > 0 && (
              <span className="ml-1.5 text-xs text-slate-400">{project.notes.length}</span>
            )}
            {active === tab.key && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-charcoal" />
            )}
          </button>
        ))}
      </div>

      {active === "dashboard" && <DashboardTab project={project} clients={clients} />}
      {active === "schedule" && <ScheduleTab project={project} />}
      {active === "tasks" && <TasksTab project={project} />}
      {active === "notes" && <NotesTab project={project} />}
      {active === "procurement" && <CategoryTab project={project} category="PROCUREMENT" />}
      {active === "design" && <CategoryTab project={project} category="DESIGN" />}
      {active === "commercial" && <CategoryTab project={project} category="COMMERCIAL" />}
      {active === "site-works" && <CategoryTab project={project} category="SITE_WORKS" />}
    </div>
  );
}
