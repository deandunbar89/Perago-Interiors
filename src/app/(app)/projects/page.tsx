import { prisma } from "@/lib/prisma";
import ProjectsExplorer from "./projects-explorer";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const { stage } = await searchParams;

  const [projects, clients] = await Promise.all([
    prisma.project.findMany({
      include: { client: true, owner: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Projects</h1>
        <p className="mt-1 text-sm text-slate-500">All tenders — filter, sort and switch views</p>
      </div>
      <ProjectsExplorer projects={projects} clients={clients} initialStage={stage} />
    </div>
  );
}
