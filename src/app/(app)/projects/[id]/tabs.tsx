"use client";

import { useState } from "react";
import type { Client } from "@prisma/client";
import type { ProjectDetail } from "./types";
import OverviewTab from "./overview-tab";
import TasksTab from "./tasks-tab";
import DocumentsTab from "./documents-tab";
import NotesTab from "./notes-tab";
import EmailsTab from "./emails-tab";
import EditTab from "./edit-tab";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "tasks", label: "Tasks" },
  { key: "documents", label: "Documents" },
  { key: "notes", label: "Notes" },
  { key: "emails", label: "Emails" },
  { key: "edit", label: "Edit" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function ProjectTabs({
  project,
  clients,
}: {
  project: ProjectDetail;
  clients: Client[];
}) {
  const [active, setActive] = useState<TabKey>("overview");

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
            {tab.key === "tasks" && project.subtasks.length > 0 && (
              <span className="ml-1.5 text-xs text-slate-400">{project.subtasks.length}</span>
            )}
            {tab.key === "documents" && project.documents.length > 0 && (
              <span className="ml-1.5 text-xs text-slate-400">{project.documents.length}</span>
            )}
            {tab.key === "notes" && project.notes.length > 0 && (
              <span className="ml-1.5 text-xs text-slate-400">{project.notes.length}</span>
            )}
            {tab.key === "emails" && project.emailLogs.length > 0 && (
              <span className="ml-1.5 text-xs text-slate-400">{project.emailLogs.length}</span>
            )}
            {active === tab.key && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-charcoal" />
            )}
          </button>
        ))}
      </div>

      {active === "overview" && <OverviewTab project={project} />}
      {active === "tasks" && <TasksTab project={project} />}
      {active === "documents" && <DocumentsTab project={project} />}
      {active === "notes" && <NotesTab project={project} />}
      {active === "emails" && <EmailsTab project={project} />}
      {active === "edit" && <EditTab project={project} clients={clients} />}
    </div>
  );
}
