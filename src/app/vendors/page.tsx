import { prisma } from "@/lib/prisma";
import VendorsExplorer from "./vendors-explorer";

export const dynamic = "force-dynamic";

export default async function VendorsPage() {
  const vendors = await prisma.vendor.findMany({
    orderBy: { name: "asc" },
    include: { tradeLicenseDoc: true, trnCertDoc: true },
  });

  return (
    <div className="p-8">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Vendors</h1>
      <p className="mb-6 text-sm text-slate-500">Suppliers and contractors across every project</p>
      <VendorsExplorer vendors={vendors} />
    </div>
  );
}
