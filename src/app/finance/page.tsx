import { prisma } from "@/lib/prisma";
import FinanceExplorer from "./finance-explorer";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const [projects, orders, payments] = await Promise.all([
    prisma.pmProject.findMany({
      where: { status: { in: ["ACTIVE", "ON_HOLD"] } },
      select: { id: true, title: true, status: true, value: true, currency: true },
      orderBy: { title: "asc" },
    }),
    prisma.projectOrder.findMany({ select: { pmProjectId: true, value: true } }),
    prisma.projectPayment.findMany({
      include: {
        pmProject: { select: { id: true, title: true } },
        vendor: true,
        order: true,
      },
      orderBy: { paidDate: "desc" },
    }),
  ]);

  const projectRows = projects.map((p) => {
    const committed = orders.filter((o) => o.pmProjectId === p.id).reduce((s, o) => s + o.value, 0);
    const projectPayments = payments.filter((pay) => pay.pmProjectId === p.id);
    const received = projectPayments.filter((pay) => pay.direction === "RECEIVED").reduce((s, pay) => s + pay.amount, 0);
    const paid = projectPayments.filter((pay) => pay.direction === "PAID").reduce((s, pay) => s + pay.amount, 0);
    return {
      id: p.id,
      title: p.title,
      status: p.status,
      currency: p.currency,
      contractValue: p.value ?? 0,
      received,
      committed,
      paid,
    };
  });

  const totals = projectRows.reduce(
    (acc, p) => ({
      contractValue: acc.contractValue + p.contractValue,
      received: acc.received + p.received,
      committed: acc.committed + p.committed,
      paid: acc.paid + p.paid,
    }),
    { contractValue: 0, received: 0, committed: 0, paid: 0 }
  );

  return (
    <div className="p-8">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Finance</h1>
      <p className="mb-6 text-sm text-slate-500">Live company-wide cash position across every active project</p>
      <FinanceExplorer projectRows={projectRows} payments={payments} totals={totals} />
    </div>
  );
}
