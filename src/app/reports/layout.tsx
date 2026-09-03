import AppSwitcherRail from "@/components/app-switcher-rail";
import { requireSectionAccess } from "@/lib/section-access";

export default async function ReportsLayout({ children }: { children: React.ReactNode }) {
  const access = await requireSectionAccess("REPORTS");

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AppSwitcherRail active="reports" access={access} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
