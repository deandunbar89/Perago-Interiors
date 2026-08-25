import { format, formatDistanceToNow } from "date-fns";
import { Mail, Phone, User as UserIcon } from "lucide-react";
import {
  PROJECT_TYPE_LABELS,
  TEMPERATURE_LABELS,
  TEMPERATURE_COLORS,
  type ProjectType,
  type Temperature,
} from "@/lib/constants";
import TasksSummary from "./tasks-summary";
import type { ProjectDetail } from "./types";

function DateRow({ label, date }: { label: string; date: Date | null }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">
        {date ? format(date, "MMM d, yyyy") : "—"}
      </span>
    </div>
  );
}

const ACTIVITY_LABEL: Record<string, string> = {
  CREATED: "created the project",
  UPDATED: "updated project details",
  STAGE_CHANGE: "",
  NOTE: "",
  EMAIL: "",
  DOCUMENT: "",
};

export default function OverviewTab({ project }: { project: ProjectDetail }) {
  return (
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
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Recent Activity</h3>
          {project.activities.length === 0 ? (
            <p className="text-sm text-slate-400">No activity yet.</p>
          ) : (
            <ul className="space-y-3">
              {project.activities.map((a) => (
                <li key={a.id} className="flex items-start gap-3 text-sm">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                  <div className="min-w-0">
                    <p className="text-slate-700">
                      <span className="font-medium text-slate-900">
                        {a.user?.name || "Someone"}
                      </span>{" "}
                      {ACTIVITY_LABEL[a.type] || a.message.toLowerCase()}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDistanceToNow(a.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Details</h3>
          <div className="flex items-center justify-between py-1.5 text-sm">
            <span className="text-slate-500">Type</span>
            <span className="font-medium text-slate-800">
              {project.projectType ? PROJECT_TYPE_LABELS[project.projectType as ProjectType] : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between py-1.5 text-sm">
            <span className="text-slate-500">Temperature</span>
            {project.temperature ? (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  TEMPERATURE_COLORS[project.temperature as Temperature].bg
                } ${TEMPERATURE_COLORS[project.temperature as Temperature].text}`}
              >
                {TEMPERATURE_LABELS[project.temperature as Temperature]}
              </span>
            ) : (
              <span className="font-medium text-slate-800">—</span>
            )}
          </div>
          {project.location && (
            <div className="py-1.5 text-sm">
              <span className="text-slate-500">Location</span>
              <p className="mt-0.5 whitespace-pre-wrap font-medium text-slate-800">{project.location}</p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Key dates</h3>
          <DateRow label="Submission deadline" date={project.submissionDeadline} />
          <DateRow label="Site visit" date={project.siteVisitDate} />
          <DateRow label="Award date" date={project.awardDate} />
        </div>

        {(project.contactName || project.contactEmail || project.contactPhone1 || project.contactPhone2) && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Project contact</h3>
            {project.contactName && (
              <p className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                <UserIcon size={13} className="text-slate-400" />
                {project.contactName}
              </p>
            )}
            {project.contactEmail && (
              <p className="ml-5 flex items-center gap-1 text-xs text-slate-500">
                <Mail size={11} />
                {project.contactEmail}
              </p>
            )}
            {project.contactPhone1 && (
              <p className="ml-5 flex items-center gap-1 text-xs text-slate-500">
                <Phone size={11} />
                {project.contactPhone1}
              </p>
            )}
            {project.contactPhone2 && (
              <p className="ml-5 flex items-center gap-1 text-xs text-slate-500">
                <Phone size={11} />
                {project.contactPhone2}
              </p>
            )}
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
  );
}
