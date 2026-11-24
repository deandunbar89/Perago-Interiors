"use client";

import { useActionState } from "react";
import Link from "next/link";
import PasswordField from "./password-field";
import { loginAction } from "./actions";

export default function LoginForm({ callbackUrl, passwordReset }: { callbackUrl: string; passwordReset?: boolean }) {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div>
        <label className="mb-1 block text-sm font-medium text-white/70">Email</label>
        <input
          type="email"
          name="email"
          required
          autoFocus
          autoComplete="email"
          className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-gold focus:ring-1 focus:ring-gold"
          placeholder="you@company.com"
        />
      </div>
      <PasswordField name="password" label="Password" autoComplete="current-password" />
      <div className="-mt-2 text-right">
        <Link href="/login/forgot" className="text-xs text-white/50 transition hover:text-gold">
          Forgot password?
        </Link>
      </div>
      {passwordReset && !state?.error && (
        <p className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
          Password changed. Sign in with your new password.
        </p>
      )}
      {state?.error && (
        <p className="rounded-lg border border-champagne/40 bg-champagne/10 px-3 py-2 text-sm text-champagne">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-gold px-3 py-2 text-sm font-medium text-charcoal transition hover:bg-gold/90 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
