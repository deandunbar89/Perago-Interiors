"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { resetPassword } from "../reset-actions";
import PasswordField from "../password-field";

export default function ResetForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPassword, undefined);
  const router = useRouter();

  useEffect(() => {
    if (state?.done) router.replace("/login?reset=1");
  }, [state?.done, router]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <PasswordField name="password" label="New password" autoComplete="new-password" />
      <PasswordField name="confirmPassword" label="Confirm new password" autoComplete="new-password" />
      <p className="text-xs text-white/40">At least 8 characters.</p>
      {state?.error && (
        <p className="rounded-lg border border-champagne/40 bg-champagne/10 px-3 py-2 text-sm text-champagne">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending || state?.done}
        className="w-full rounded-lg bg-gold px-3 py-2 text-sm font-medium text-charcoal transition hover:bg-gold/90 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Set new password"}
      </button>
      <Link href="/login/forgot" className="block text-center text-xs text-white/50 transition hover:text-gold">
        Need a new link?
      </Link>
    </form>
  );
}
