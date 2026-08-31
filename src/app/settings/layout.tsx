import { redirect } from "next/navigation";
import AppSwitcherRail from "@/components/app-switcher-rail";
import { getAccess } from "@/lib/section-access";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const access = await getAccess();
  if (access.role !== "ADMIN") redirect("/");

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AppSwitcherRail active="settings" access={access} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
