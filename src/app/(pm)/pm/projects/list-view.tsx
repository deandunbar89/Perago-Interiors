import Link from "next/link";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { COLUMN_LABELS, DEFAULT_SORT_DIRECTION, renderCell, type ColumnId, type SortState } from "./columns";
import type { PmProjectRow } from "./types";

export default function ListView({
  projects,
  columns,
  sort,
  onSortChange,
}: {
  projects: PmProjectRow[];
  columns: ColumnId[];
  sort: SortState | null;
  onSortChange: (sort: SortState) => void;
}) {
  if (projects.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
        No projects match your filters.
      </p>
    );
  }

  function handleHeaderClick(col: ColumnId) {
    if (sort?.column === col) {
      onSortChange({ column: col, direction: sort.direction === "asc" ? "desc" : "asc" });
    } else {
      onSortChange({ column: col, direction: DEFAULT_SORT_DIRECTION[col] });
    }
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            {columns.map((col) => {
              const active = sort?.column === col;
              return (
                <th key={col} className="whitespace-nowrap px-4 py-2.5">
                  <button
                    onClick={() => handleHeaderClick(col)}
                    className={`flex items-center gap-1 transition hover:text-slate-800 ${
                      active ? "text-slate-800" : ""
                    }`}
                  >
                    {COLUMN_LABELS[col]}
                    {active ? (
                      sort.direction === "asc" ? (
                        <ArrowUp size={12} />
                      ) : (
                        <ArrowDown size={12} />
                      )
                    ) : (
                      <ArrowUpDown size={12} className="text-slate-300" />
                    )}
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {projects.map((project) => (
            <tr key={project.id} className="transition hover:bg-slate-50">
              {columns.map((col, i) => (
                <td key={col} className="whitespace-nowrap px-4 py-2.5">
                  {i === 0 ? (
                    <Link href={`/pm/projects/${project.id}`} className="hover:underline">
                      {renderCell(col, project)}
                    </Link>
                  ) : (
                    renderCell(col, project)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
