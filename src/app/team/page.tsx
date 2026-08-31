import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import TeamPanel from "./team-panel";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const session = await auth();
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="p-8">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Team</h1>
      <p className="mb-6 text-sm text-slate-500">People with access to this workspace</p>
      <TeamPanel users={users} currentUserId={session?.user?.id || ""} isAdmin={isAdmin} />
    </div>
  );
}
