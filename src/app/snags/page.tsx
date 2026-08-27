import { prisma } from "@/lib/prisma";
import SnagsExplorer from "./snags-explorer";

export const dynamic = "force-dynamic";

export default async function SnagsPage() {
  const [snags, projects, vendors] = await Promise.all([
    prisma.snag.findMany({
      include: {
        pmProject: { select: { id: true, title: true } },
        vendor: true,
        openPhoto: true,
        closedPhoto: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.pmProject.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
    prisma.vendor.findMany({ where: { type: "CONTRACTOR" }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="p-8">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Snags</h1>
      <p className="mb-6 text-sm text-slate-500">Every snag, defect and punch item across every project</p>
      <SnagsExplorer snags={snags} projects={projects} vendors={vendors} />
    </div>
  );
}
