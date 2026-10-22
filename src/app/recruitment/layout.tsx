import AppSwitcherRail from "@/components/app-switcher-rail";
import { requireSectionAccess } from "@/lib/section-access";
import RecruitmentNav from "./recruitment-nav";

export default async function RecruitmentLayout({ children }: { children: React.ReactNode }) {
  const access = await requireSectionAccess("RECRUITMENT");

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AppSwitcherRail active="recruitment" access={access} />
      <main className="flex-1 min-w-0">
        <RecruitmentNav />
        {children}
      </main>
    </div>
  );
}
