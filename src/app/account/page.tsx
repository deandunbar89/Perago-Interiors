import { headers } from "next/headers";
import { auth } from "@/auth";
import { appOrigin } from "@/lib/recruitment-calendar";
import { deadlinesCalendarToken } from "@/lib/deadlines-calendar";
import ChangePasswordForm from "./change-password-form";
import CalendarLink from "./calendar-link";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const [session, requestHeaders] = await Promise.all([auth(), headers()]);

  const feedUrl = session?.user?.id
    ? `${appOrigin(requestHeaders)}/api/calendar-feed/${deadlinesCalendarToken(session.user.id)}/deadlines.ics`
    : null;

  return (
    <div className="p-8">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Account</h1>
      <p className="mb-6 text-sm text-slate-500">{session?.user?.name} · {session?.user?.email}</p>

      <div className="flex flex-col gap-6">
        {feedUrl && (
          <div className="max-w-xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold text-slate-900">Deadlines &amp; tasks in Outlook</h2>
            <CalendarLink feedUrl={feedUrl} />
          </div>
        )}

        <div className="max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Change password</h2>
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
