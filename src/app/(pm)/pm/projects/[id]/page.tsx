import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PmProjectHeader from "./pm-project-header";
import Tabs from "./tabs";

export default async function PmProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [project, clients, allVendors] = await Promise.all([
    prisma.pmProject.findUnique({
      where: { id },
      include: {
        client: { include: { contacts: true } },
        linkedTender: true,
        scheduleItems: { orderBy: { sortOrder: "asc" } },
        subtasks: { orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }] },
        notes: { orderBy: { createdAt: "desc" }, include: { author: true } },
        pmDocuments: { include: { uploadedBy: true }, orderBy: { createdAt: "desc" } },
        docSubsections: { orderBy: { sortOrder: "asc" } },
        snags: {
          orderBy: { createdAt: "desc" },
          include: { openPhoto: true, closedPhoto: true, vendor: true },
        },
        vendors: {
          orderBy: { createdAt: "asc" },
          include: { vendor: true, documents: true },
        },
      },
    }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
    prisma.vendor.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!project) notFound();

  return (
    <div className="p-8">
      <PmProjectHeader project={project} />
      <Tabs project={project} clients={clients} allVendors={allVendors} />
    </div>
  );
}
