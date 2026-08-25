import PmProjectCard from "../pm-project-card";
import type { PmProjectRow } from "./types";

export default function GridView({ projects }: { projects: PmProjectRow[] }) {
  if (projects.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
        No projects match your filters.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {projects.map((project) => (
        <PmProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
