import AppSwitcherRail from "@/components/app-switcher-rail";
import { requireSectionAccess } from "@/lib/section-access";

export default async function RatesLayout({ children }: { children: React.ReactNode }) {
  const access = await requireSectionAccess("RATES");
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AppSwitcherRail active="rates" access={access} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
