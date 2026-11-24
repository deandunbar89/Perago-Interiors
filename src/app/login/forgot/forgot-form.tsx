"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "../reset-actions";

export default function ForgotForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, undefined);

  if (state?.sent) {
    return (
      <div className="space-y-4 text-sm text-white/80">
        <p>If that email has a Perago account, a reset link is on its way. Check your inbox, and your junk folder too.</p>
        <p>The link works once and expires in 1 hour.</p>
        <Link href="/login" className="block text-center text-xs text-white/50 transition hover:text-gold">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <p className="text-sm text-white/70">Enter your email and we&apos;ll send you a link to choose a new password.</p>
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
      {state?.error && (
        <p className="rounded-lg border border-champagne/40 bg-champagne/10 px-3 py-2 text-sm text-champagne">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-gold px-3 py-2 text-sm font-medium text-charcoal transition hover:bg-gold/90 disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send reset link"}
      </button>
      <Link href="/login" className="block text-center text-xs text-white/50 transition hover:text-gold">
        Back to sign in
      </Link>
    </form>
  );
}
