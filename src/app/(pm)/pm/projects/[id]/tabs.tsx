"use client";

import { useState } from "react";
import type { Client, Vendor } from "@prisma/client";
import type { PmProjectDetail } from "./types";
import DashboardTab from "./dashboard-tab";
import ScheduleTab from "./schedule-tab";
import TasksTab from "./tasks-tab";
import NotesTab from "./notes-tab";
import CategoryTab from "./category-tab";
import SnagsTab from "./snags-tab";
import ProjectVendorsTab from "./project-vendors-tab";

const TABS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "schedule", label: "Program" },
  { key: "tasks", label: "Tasks" },
  { key: "design", label: "Design" },
  { key: "operations", label: "Operations" },
  { key: "commercial", label: "Commercial" },
  { key: "procurement", label: "Procurement" },
  { key: "site-works", label: "Site Works" },
  { key: "vendors", label: "Vendors" },
  { key: "snags", label: "Snags" },
  { key: "notes", label: "Notes" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function Tabs({
  project,
  clients,
  allVendors,
}: {
  project: PmProjectDetail;
  clients: Client[];
  allVendors: Vendor[];
}) {
  const [active, setActive] = useState<TabKey>("dashboard");

  return (
    <div>
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`relative shrink-0 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition ${
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
            {tab.key === "vendors" && project.vendors.length > 0 && (
              <span className="ml-1.5 text-xs text-slate-400">{project.vendors.length}</span>
            )}
            {tab.key === "snags" && project.snags.some((s) => s.status === "OPEN") && (
              <span className="ml-1.5 text-xs text-slate-400">
                {project.snags.filter((s) => s.status === "OPEN").length}
              </span>
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
      {active === "design" && <CategoryTab project={project} category="DESIGN" />}
      {active === "operations" && <CategoryTab project={project} category="OPERATIONS" />}
      {active === "commercial" && <CategoryTab project={project} category="COMMERCIAL" />}
      {active === "procurement" && <CategoryTab project={project} category="PROCUREMENT" />}
      {active === "site-works" && <CategoryTab project={project} category="SITE_WORKS" />}
      {active === "vendors" && <ProjectVendorsTab project={project} allVendors={allVendors} />}
      {active === "snags" && <SnagsTab project={project} allVendors={allVendors} />}
      {active === "notes" && <NotesTab project={project} />}
    </div>
  );
}
