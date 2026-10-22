import { headers } from "next/headers";
import AppSwitcherRail from "@/components/app-switcher-rail";
import { auth } from "@/auth";
import { requireSectionAccess } from "@/lib/section-access";
import { appOrigin, calendarToken } from "@/lib/recruitment-calendar";
import RecruitmentNav from "./recruitment-nav";

export default async function RecruitmentLayout({ children }: { children: React.ReactNode }) {
  const [access, session, requestHeaders] = await Promise.all([
    requireSectionAccess("RECRUITMENT"),
    auth(),
    headers(),
  ]);

  const feedUrl = session?.user?.id
    ? `${appOrigin(requestHeaders)}/api/calendar-feed/${calendarToken(session.user.id)}/interviews.ics`
    : null;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AppSwitcherRail active="recruitment" access={access} />
      <main className="flex-1 min-w-0">
        <RecruitmentNav feedUrl={feedUrl} />
        {children}
      </main>
    </div>
  );
}
