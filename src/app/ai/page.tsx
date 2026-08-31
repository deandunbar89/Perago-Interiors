import { prisma } from "@/lib/prisma";
import AiExplorer from "./ai-explorer";

export const dynamic = "force-dynamic";

export default async function AiPage() {
  const subscriptions = await prisma.aiSubscription.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      url: true,
      username: true,
      plan: true,
      cost: true,
      renewalDate: true,
      notes: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      passwordEnc: true,
    },
  });

  // Never send the encrypted blob to the client — only whether a password exists.
  // The actual value is fetched on demand via revealAiSubscriptionPassword() when clicked.
  const rows = subscriptions.map((sub) => {
    const { passwordEnc, ...rest } = sub;
    return { ...rest, hasPassword: !!passwordEnc };
  });

  return (
    <div className="p-8">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">AI</h1>
      <p className="mb-6 text-sm text-slate-500">Subscriptions, logins and renewal dates for the AI tools we use</p>
      <AiExplorer subscriptions={rows} />
    </div>
  );
}
