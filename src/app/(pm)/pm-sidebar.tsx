"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckSquare, ChevronDown, ChevronRight, Flag, LayoutGrid, LogOut, Plus } from "lucide-react";
import { signOutAction } from "../(app)/actions";

const EXPANDED_KEY = "tendercrm.pm.sidebar.projectsExpanded";

type PmProjectSummary = { id: string; title: string; status: "ACTIVE" | "ON_HOLD" | "COMPLETE" };

const STATUS_DOT: Record<PmProjectSummary["status"], string> = {
  ACTIVE: "bg-emerald-400",
  ON_HOLD: "bg-amber-400",
  COMPLETE: "bg-white/30",
};

export default function PmSidebar({
  user,
  projects,
}: {
  user?: { name?: string | null; email?: string | null; role?: string };
  projects: PmProjectSummary[];
}) {
  const pathname = usePathname();
  const onDashboard = pathname === "/pm";
  const onProjectsList = pathname === "/pm/projects";
  const onProjectPage = pathname.startsWith("/pm/projects/");
  const [expanded, setExpanded] = useState(true);

  // localStorage isn't available during SSR, so the saved preference is applied
  // post-mount rather than in a lazy useState initializer, avoiding a hydration mismatch.
  useEffect(() => {
    const saved = localStorage.getItem(EXPANDED_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved !== null) setExpanded(saved === "1");
  }, []);

  useEffect(() => {
    localStorage.setItem(EXPANDED_KEY, expanded ? "1" : "0");
  }, [expanded]);

  // Viewing a project always reveals it in the tree, even if the user collapsed the section.
  const showProjectsList = expanded || onProjectPage;

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-charcoal">
      <div className="px-5 py-6">
        <span className="text-sm font-semibold uppercase tracking-widest text-white/40">
          Project Management
        </span>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col px-3">
        <Link
          href="/pm"
          className={`mb-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
            onDashboard ? "bg-gold/15 text-gold" : "text-white/60 hover:bg-white/5 hover:text-white/90"
          }`}
        >
          <LayoutGrid size={17} />
          Dashboard
        </Link>

        <div className="mb-1 flex items-center gap-0.5">
          <button
            onClick={() => setExpanded((e) => !e)}
            title={showProjectsList ? "Collapse" : "Expand"}
            className="flex h-7 w-6 shrink-0 items-center justify-center rounded text-white/40 transition hover:bg-white/10 hover:text-white/80"
          >
            {showProjectsList ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          <Link
            href="/pm/projects"
            className={`flex flex-1 items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-medium transition ${
              onProjectsList ? "bg-gold/15 text-gold" : "text-white/60 hover:bg-white/5 hover:text-white/90"
            }`}
          >
            Projects
          </Link>
          <Link
            href="/pm/projects/new"
            title="New project"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-white/40 transition hover:bg-white/10 hover:text-white/80"
          >
            <Plus size={14} />
          </Link>
        </div>

        {showProjectsList && (
          <div className="mb-2 ml-[26px] max-h-64 space-y-0.5 overflow-y-auto border-l border-white/10 pl-2">
            {projects.length === 0 ? (
              <p className="px-2 py-1.5 text-xs text-white/30">No projects yet</p>
            ) : (
              projects.map((project) => {
                const href = `/pm/projects/${project.id}`;
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={project.id}
                    href={href}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition ${
                      active ? "bg-gold/15 text-gold" : "text-white/60 hover:bg-white/5 hover:text-white/90"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[project.status]}`} />
                    <span className="truncate">{project.title}</span>
                  </Link>
                );
              })
            )}
          </div>
        )}

        <Link
          href="/pm/deadlines"
          className={`mb-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
            pathname === "/pm/deadlines" || pathname.startsWith("/pm/deadlines/")
              ? "bg-gold/15 text-gold"
              : "text-white/60 hover:bg-white/5 hover:text-white/90"
          }`}
        >
          <Flag size={17} />
          Deadlines
        </Link>
        <Link
          href="/pm/tasks"
          className={`mb-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
            pathname === "/pm/tasks" ? "bg-gold/15 text-gold" : "text-white/60 hover:bg-white/5 hover:text-white/90"
          }`}
        >
          <CheckSquare size={17} />
          Tasks
        </Link>
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="mb-2 px-2">
          <p className="truncate text-sm font-medium text-white/90">{user?.name}</p>
          <p className="truncate text-xs text-white/40">{user?.email}</p>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-white/50 transition hover:bg-white/5 hover:text-white/90"
          >
            <LogOut size={17} />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
