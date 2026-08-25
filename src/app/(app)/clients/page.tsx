import Link from "next/link";
import { Building2, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { projects: true, contacts: true } } },
  });

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Clients</h1>
          <p className="mt-1 text-sm text-slate-500">Companies you tender for</p>
        </div>
        <Link
          href="/clients/new"
          className="flex items-center gap-1.5 rounded-lg bg-charcoal px-4 py-2 text-sm font-medium text-white transition hover:bg-jet"
        >
          <Plus size={16} />
          New Client
        </Link>
      </div>

      {clients.length === 0 ? (
        <p className="py-16 text-center text-sm text-slate-400">No clients yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <Building2 size={16} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{client.name}</p>
                  {client.industry && (
                    <p className="truncate text-xs text-slate-500">{client.industry}</p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex gap-4 text-xs text-slate-500">
                <span>{client._count.projects} project{client._count.projects === 1 ? "" : "s"}</span>
                <span>{client._count.contacts} contact{client._count.contacts === 1 ? "" : "s"}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
