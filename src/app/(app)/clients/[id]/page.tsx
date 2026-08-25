import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency, STAGE_LABELS, STAGE_COLORS } from "@/lib/constants";
import { format } from "date-fns";
import ContactsPanel from "./contacts-panel";
import QuickAddProject from "./quick-add-project";
import ClientForm from "../client-form";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      contacts: { orderBy: { isPrimary: "desc" } },
      projects: { orderBy: { updatedAt: "desc" } },
    },
  });

  if (!client) notFound();

  return (
    <div className="p-8">
      <Link
        href="/clients"
        className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft size={15} />
        Clients
      </Link>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">{client.name}</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Projects</h2>
            </div>
            {client.projects.length === 0 ? (
              <p className="mb-3 rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
                No projects for this client yet.
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <ul className="divide-y divide-slate-100">
                  {client.projects.map((p) => {
                    const colors = STAGE_COLORS[p.stage as keyof typeof STAGE_COLORS];
                    return (
                      <li key={p.id}>
                        <Link
                          href={`/projects/${p.id}`}
                          className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-slate-50"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-800">{p.title}</p>
                            {p.submissionDeadline && (
                              <p className="text-xs text-slate-400">
                                Due {format(p.submissionDeadline, "MMM d, yyyy")}
                              </p>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <span className="text-sm font-medium text-slate-700">
                              {formatCurrency(p.value, p.currency)}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${colors.bg} ${colors.text}`}
                            >
                              {STAGE_LABELS[p.stage as keyof typeof STAGE_LABELS]}
                            </span>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            <div className="mt-3">
              <QuickAddProject clientId={client.id} />
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Company details</h2>
            <ClientForm client={client} />
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Contacts</h2>
          <ContactsPanel clientId={client.id} contacts={client.contacts} />
        </div>
      </div>
    </div>
  );
}
