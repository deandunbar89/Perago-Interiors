import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import VendorDetail from "./vendor-detail";

export const dynamic = "force-dynamic";

export default async function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [vendor, projects] = await Promise.all([
    prisma.vendor.findUnique({
      where: { id },
      include: {
        tradeLicenseDoc: true,
        trnCertDoc: true,
        history: {
          orderBy: [{ workedOn: "desc" }, { createdAt: "desc" }],
          include: { pmProject: { select: { id: true, title: true } } },
        },
        pmProjects: {
          orderBy: { createdAt: "desc" },
          include: { pmProject: { select: { id: true, title: true, status: true } } },
        },
      },
    }),
    prisma.pmProject.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
  ]);

  if (!vendor) notFound();

  return (
    <div className="mx-auto max-w-3xl p-8">
      <VendorDetail vendor={vendor} projects={projects} />
    </div>
  );
}
