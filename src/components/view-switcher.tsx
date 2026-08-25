"use client";

import { List, LayoutGrid, GanttChartSquare, KanbanSquare } from "lucide-react";

export type ExplorerView = "list" | "grid" | "gantt" | "kanban";

const VIEW_META: Record<ExplorerView, { label: string; icon: typeof List }> = {
  list: { label: "List", icon: List },
  grid: { label: "Grid", icon: LayoutGrid },
  gantt: { label: "Gantt", icon: GanttChartSquare },
  kanban: { label: "Kanban", icon: KanbanSquare },
};

export default function ViewSwitcher({
  view,
  onChange,
  views = ["list", "grid", "gantt"],
}: {
  view: ExplorerView;
  onChange: (view: ExplorerView) => void;
  views?: ExplorerView[];
}) {
  return (
    <div className="flex items-center rounded-lg border border-slate-300 p-0.5">
      {views.map((key) => {
        const { label, icon: Icon } = VIEW_META[key];
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            title={label}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition ${
              view === key ? "bg-charcoal text-white" : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            <Icon size={15} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
