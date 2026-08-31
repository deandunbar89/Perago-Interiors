import AppSwitcherRail from "@/components/app-switcher-rail";
import { requireSectionAccess } from "@/lib/section-access";

export default async function AiLayout({ children }: { children: React.ReactNode }) {
  const access = await requireSectionAccess("AI");

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AppSwitcherRail active="ai" access={access} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
