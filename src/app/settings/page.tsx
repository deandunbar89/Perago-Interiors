import { prisma } from "@/lib/prisma";
import SettingsExplorer from "./settings-explorer";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const members = await prisma.user.findMany({
    where: { role: "MEMBER" },
    select: { id: true, name: true, email: true, allowedSections: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-8">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Settings</h1>
      <p className="mb-6 text-sm text-slate-500">
        Control which sections each team member can open. Admins always have full access.
      </p>
      <SettingsExplorer members={members} />
    </div>
  );
}
