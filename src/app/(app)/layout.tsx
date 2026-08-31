import { auth } from "@/auth";
import AppSwitcherRail from "@/components/app-switcher-rail";
import { requireSectionAccess } from "@/lib/section-access";
import Sidebar from "./sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [session, access] = await Promise.all([auth(), requireSectionAccess("CRM")]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AppSwitcherRail active="crm" access={access} />
      <Sidebar user={session?.user} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
