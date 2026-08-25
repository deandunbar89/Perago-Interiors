"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

export default function LoginForm({ callbackUrl }: { callbackUrl: string }) {
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
          className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-gold focus:ring-1 focus:ring-gold"
          placeholder="you@company.com"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-white/70">Password</label>
        <input
          type="password"
          name="password"
          required
          className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-gold focus:ring-1 focus:ring-gold"
          placeholder="••••••••"
        />
      </div>
      {state?.error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{state.error}</p>
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
