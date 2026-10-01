"use client";

import { useRef, useState, useTransition } from "react";
import { changeOwnPassword } from "@/lib/actions/users";

const fieldClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold";

export default function ChangePasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await changeOwnPassword(undefined, formData);
      if (result?.error) setError(result.error);
      else {
        formRef.current?.reset();
        setSuccess(true);
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Current password</label>
        <input name="currentPassword" type="password" required autoComplete="current-password" className={fieldClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">New password</label>
        <input
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={fieldClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Confirm new password</label>
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={fieldClass}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-600">Password updated.</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-charcoal px-4 py-2 text-sm font-medium text-white transition hover:bg-jet disabled:opacity-60"
      >
        {pending ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}
