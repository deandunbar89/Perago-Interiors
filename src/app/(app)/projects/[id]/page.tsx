import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProjectHeader from "./project-header";
import ProjectTabs from "./tabs";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: { include: { contacts: true } },
      owner: true,
      documents: { orderBy: { createdAt: "desc" }, include: { uploadedBy: true } },
      notes: { orderBy: { createdAt: "desc" }, include: { author: true } },
      emailLogs: { orderBy: { sentAt: "desc" }, include: { loggedBy: true } },
      activities: { orderBy: { createdAt: "desc" }, include: { user: true }, take: 20 },
      subtasks: { orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }] },
      pmProject: true,
    },
  });

  if (!project) notFound();

  const clients = await prisma.client.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="p-8">
      <ProjectHeader project={project} />
      <ProjectTabs project={project} clients={clients} />
    </div>
  );
}
