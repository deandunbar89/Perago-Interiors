import { prisma } from "@/lib/prisma";
import ContractorsPanel from "./contractors-panel";

export default async function ContractorsPage() {
  const contractors = await prisma.contractor.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="p-8">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Contractors</h1>
      <p className="mb-6 text-sm text-slate-500">Subcontractors you can assign snags to</p>
      <ContractorsPanel contractors={contractors} />
    </div>
  );
}
