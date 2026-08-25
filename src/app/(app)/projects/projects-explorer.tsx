"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Client } from "@prisma/client";
import { Plus } from "lucide-react";
import ColumnPicker from "@/components/column-picker";
import ViewSwitcher, { type ExplorerView } from "@/components/view-switcher";
import FilterBar, { EMPTY_FILTERS, type Filters } from "./filter-bar";
import ListView from "./list-view";
import GridView from "./grid-view";
import GanttView from "./gantt-view";
import { ALL_COLUMNS, COLUMN_LABELS, DEFAULT_COLUMNS, sortProjects, type ColumnId, type SortState } from "./columns";
import type { ProjectRow } from "./types";

type View = ExplorerView;

const VIEW_KEY = "tendercrm.projects.view";
const COLUMNS_KEY = "tendercrm.projects.columns";
const SORT_KEY = "tendercrm.projects.sort";

export default function ProjectsExplorer({
  projects,
  clients,
  initialStage,
}: {
  projects: ProjectRow[];
  clients: Client[];
  initialStage?: string;
}) {
  const [view, setView] = useState<View>("list");
  const [columns, setColumns] = useState<ColumnId[]>(DEFAULT_COLUMNS);
  const [sort, setSort] = useState<SortState | null>(null);
  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS, stage: initialStage || "" });
  const [ready, setReady] = useState(false);

  // localStorage isn't available during SSR, so preferences are applied post-mount
  // (default view/columns render first, then update) rather than in a lazy useState
  // initializer, which would cause a hydration mismatch.
  useEffect(() => {
    const savedView = localStorage.getItem(VIEW_KEY) as View | null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (savedView) setView(savedView);
    const savedColumns = localStorage.getItem(COLUMNS_KEY);
    if (savedColumns) {
      try {
        setColumns(JSON.parse(savedColumns));
      } catch {
        // ignore corrupt value
      }
    }
    const savedSort = localStorage.getItem(SORT_KEY);
    if (savedSort) {
      try {
        setSort(JSON.parse(savedSort));
      } catch {
        // ignore corrupt value
      }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(VIEW_KEY, view);
  }, [view, ready]);

  useEffect(() => {
    if (ready) localStorage.setItem(COLUMNS_KEY, JSON.stringify(columns));
  }, [columns, ready]);

  useEffect(() => {
    if (ready) localStorage.setItem(SORT_KEY, JSON.stringify(sort));
  }, [sort, ready]);

  const filtered = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return projects.filter((p) => {
      if (filters.stage && p.stage !== filters.stage) return false;
      if (filters.projectType && p.projectType !== filters.projectType) return false;
      if (filters.temperature && p.temperature !== filters.temperature) return false;
      if (filters.clientId && p.clientId !== filters.clientId) return false;
      if (search) {
        const haystack = [p.title, p.reference, p.location, p.client?.name, p.contactName]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });
  }, [projects, filters]);

  const sorted = useMemo(() => sortProjects(filtered, sort), [filtered, sort]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <FilterBar filters={filters} onChange={setFilters} clients={clients} />
        <div className="flex items-center gap-2">
          {view === "list" && (
            <ColumnPicker
              allColumns={ALL_COLUMNS}
              labels={COLUMN_LABELS}
              lockedColumn="title"
              visible={columns}
              onChange={setColumns}
            />
          )}
          <ViewSwitcher view={view} onChange={setView} />
          <Link
            href="/projects/new"
            className="flex items-center gap-1.5 rounded-lg bg-charcoal px-3 py-1.5 text-sm font-medium text-white transition hover:bg-jet"
          >
            <Plus size={15} />
            New
          </Link>
        </div>
      </div>

      <p className="mb-3 text-xs text-slate-400">
        {filtered.length} of {projects.length} project{projects.length === 1 ? "" : "s"}
      </p>

      {view === "list" && (
        <ListView projects={sorted} columns={columns} sort={sort} onSortChange={setSort} />
      )}
      {view === "grid" && <GridView projects={filtered} />}
      {view === "gantt" && <GanttView projects={filtered} />}
    </div>
  );
}
