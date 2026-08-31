import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import AppSwitcherRail from "@/components/app-switcher-rail";
import { requireSectionAccess } from "@/lib/section-access";
import PmSidebar from "./pm-sidebar";

export default async function PmLayout({ children }: { children: React.ReactNode }) {
  const [session, access, projects] = await Promise.all([
    auth(),
    requireSectionAccess("PM"),
    prisma.pmProject.findMany({
      select: { id: true, title: true, status: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AppSwitcherRail active="pm" access={access} />
      <PmSidebar user={session?.user} projects={projects} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
