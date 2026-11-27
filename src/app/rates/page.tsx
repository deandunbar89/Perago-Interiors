import { prisma } from "@/lib/prisma";
import RatesExplorer from "./rates-explorer";

export const dynamic = "force-dynamic";

export default async function RatesPage() {
  const items = await prisma.rateItem.findMany({ orderBy: [{ quotedAt: "desc" }, { createdAt: "desc" }] });
  return (
    <div className="p-8">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Rate library</h1>
      <p className="mb-6 text-sm text-slate-500">
        Every rate we receive or check — contractor and supplier quotes, online prices. AED excl. VAT, cost to Perago (before margin).
      </p>
      <RatesExplorer
        items={items.map((r) => ({
          id: r.id,
          trade: r.trade,
          description: r.description,
          unit: r.unit,
          rate: r.rate,
          rateType: r.rateType,
          source: r.source,
          sourceType: r.sourceType,
          sourceRef: r.sourceRef,
          projectName: r.projectName,
          quotedAt: r.quotedAt.toISOString().slice(0, 10),
          notes: r.notes,
        }))}
      />
    </div>
  );
}
