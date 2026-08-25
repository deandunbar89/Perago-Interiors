import type { Client } from "@prisma/client";
import ProjectForm from "../project-form";
import type { ProjectDetail } from "./types";

export default function EditTab({
  project,
  clients,
}: {
  project: ProjectDetail;
  clients: Client[];
}) {
  return (
    <div className="max-w-2xl">
      <ProjectForm clients={clients} project={project} />
    </div>
  );
}
