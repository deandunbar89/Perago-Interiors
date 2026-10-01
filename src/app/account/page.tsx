import { auth } from "@/auth";
import ChangePasswordForm from "./change-password-form";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth();

  return (
    <div className="p-8">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Account</h1>
      <p className="mb-6 text-sm text-slate-500">{session?.user?.name} · {session?.user?.email}</p>

      <div className="max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Change password</h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
