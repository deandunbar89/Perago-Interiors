import { prisma } from "@/lib/prisma";
import PmProjectForm from "../../pm-project-form";

export default async function NewPmProjectPage() {
  const clients = await prisma.client.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">New Project</h1>
      <p className="mb-6 text-sm text-slate-500">Add a project to Project Management</p>
      <PmProjectForm clients={clients} />
    </div>
  );
}
