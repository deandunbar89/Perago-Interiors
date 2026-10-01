import AppSwitcherRail from "@/components/app-switcher-rail";
import { getAccess } from "@/lib/section-access";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const access = await getAccess();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AppSwitcherRail active="account" access={access} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
