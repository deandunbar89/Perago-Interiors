import type { Client } from "@prisma/client";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { Flag, Mail, Phone, User as UserIcon } from "lucide-react";
import { formatCurrency } from "@/lib/constants";
import PmProjectForm from "../../pm-project-form";
import TasksSummary from "./tasks-summary";
import NotesSummary from "./notes-summary";
import type { PmProjectDetail } from "./types";

function DateRow({ label, date }: { label: string; date: Date | null }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{date ? format(date, "MMM d, yyyy") : "—"}</span>
    </div>
  );
}

const SCHEDULE_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  NOT_STARTED: { bg: "bg-slate-100", text: "text-slate-600" },
  IN_PROGRESS: { bg: "bg-amber-50", text: "text-amber-700" },
  DONE: { bg: "bg-emerald-50", text: "text-emerald-700" },
};
const SCHEDULE_STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

export default function DashboardTab({ project, clients }: { project: PmProjectDetail; clients: Client[] }) {
  const items = project.scheduleItems;
  const doneCount = items.filter((i) => i.status === "DONE").length;
  const overallProgress =
    items.length > 0 ? Math.round(items.reduce((sum, i) => sum + i.percentComplete, 0) / items.length) : null;
  const overdueCount = items.filter((i) => i.status !== "DONE" && isPast(i.endDate)).length;
  const upcoming = [...items]
    .filter((i) => i.status !== "DONE")
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Value</p>
          <p className="mt-1.5 text-xl font-semibold text-slate-900">
            {formatCurrency(project.value, project.currency)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Progress</p>
          <p className="mt-1.5 text-xl font-semibold text-slate-900">
            {overallProgress === null ? "—" : `${overallProgress}%`}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Schedule Items</p>
          <p className="mt-1.5 text-xl font-semibold text-slate-900">
            {doneCount}/{items.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Overdue</p>
          <p className={`mt-1.5 text-xl font-semibold ${overdueCount > 0 ? "text-red-600" : "text-slate-900"}`}>
            {overdueCount}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Description</h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
              {project.description || "No description added yet."}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Tasks</h3>
            <TasksSummary tasks={project.subtasks} />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Up next on the schedule</h3>
            {upcoming.length === 0 ? (
              <p className="text-sm text-slate-400">Nothing scheduled yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {upcoming.map((item) => {
                  const colors = SCHEDULE_STATUS_COLORS[item.status];
                  const overdue = item.status !== "DONE" && isPast(item.endDate);
                  return (
                    <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate text-slate-700">{item.title}</span>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className={overdue ? "text-red-600" : "text-slate-400"}>
                          {format(item.startDate, "MMM d")} – {format(item.endDate, "MMM d")}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}>
                          {SCHEDULE_STATUS_LABELS[item.status]}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Edit details</h3>
            <PmProjectForm clients={clients} project={project} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Key dates</h3>
            <DateRow label="Start date" date={project.startDate} />
            <DateRow label="Target completion" date={project.targetEndDate} />
            <div className="flex items-center justify-between py-1.5 text-sm">
              <span className="text-slate-500">Created</span>
              <span className="font-medium text-slate-800">
                {formatDistanceToNow(project.createdAt, { addSuffix: true })}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Notes</h3>
            <NotesSummary notes={project.notes} />
          </div>

          {project.location && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold text-slate-900">Location</h3>
              <p className="whitespace-pre-wrap text-sm text-slate-600">{project.location}</p>
            </div>
          )}

          {project.linkedTender && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                <Flag size={13} />
                Originating tender
              </h3>
              <a
                href={`/projects/${project.linkedTender.id}`}
                className="text-sm text-slate-600 underline hover:text-slate-900"
              >
                {project.linkedTender.title}
              </a>
            </div>
          )}

          {project.client && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Client contacts</h3>
              {project.client.contacts.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No contacts saved.{" "}
                  <a href={`/clients/${project.client.id}`} className="underline">
                    Add one
                  </a>
                </p>
              ) : (
                <ul className="space-y-3">
                  {project.client.contacts.map((c) => (
                    <li key={c.id} className="text-sm">
                      <p className="flex items-center gap-1.5 font-medium text-slate-800">
                        <UserIcon size={13} className="text-slate-400" />
                        {c.name}
                        {c.isPrimary && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                            Primary
                          </span>
                        )}
                      </p>
                      {c.role && <p className="ml-5 text-xs text-slate-500">{c.role}</p>}
                      {c.email && (
                        <p className="ml-5 flex items-center gap-1 text-xs text-slate-500">
                          <Mail size={11} />
                          {c.email}
                        </p>
                      )}
                      {c.phone && (
                        <p className="ml-5 flex items-center gap-1 text-xs text-slate-500">
                          <Phone size={11} />
                          {c.phone}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
