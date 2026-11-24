import Link from "next/link";
import AuthShell from "../auth-shell";
import ResetForm from "./reset-form";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;

  return (
    <AuthShell subtitle="Choose a new password">
      {token ? (
        <ResetForm token={token} />
      ) : (
        <div className="space-y-4 text-sm text-white/80">
          <p>This reset link is incomplete. Request a new one.</p>
          <Link href="/login/forgot" className="block text-center text-xs text-white/50 transition hover:text-gold">
            Forgot password
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
