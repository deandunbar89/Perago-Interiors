import { prisma } from "@/lib/prisma";
import PmProjectsExplorer from "./pm-projects-explorer";

export default async function PmProjectsPage() {
  const [pmProjects, clients] = await Promise.all([
    prisma.pmProject.findMany({
      include: {
        client: true,
        linkedTender: true,
        scheduleItems: { select: { percentComplete: true, status: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Projects</h1>
        <p className="mt-1 text-sm text-slate-500">All PM projects — filter, sort and switch views</p>
      </div>
      <PmProjectsExplorer projects={pmProjects} clients={clients} />
    </div>
  );
}
