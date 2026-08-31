"use client";

import { useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { createAiSubscription, updateAiSubscription } from "@/lib/actions/ai-subscriptions";
import type { AiSubscriptionRow } from "./types";

const fieldClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold";

export default function AiForm({
  subscription,
  onDone,
}: {
  subscription?: AiSubscriptionRow;
  onDone: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = subscription
        ? await updateAiSubscription(subscription.id, undefined, formData)
        : await createAiSubscription(undefined, formData);
      if (result?.error) setError(result.error);
      else {
        formRef.current?.reset();
        onDone();
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input
          name="name"
          required
          defaultValue={subscription?.name}
          placeholder="Tool name (e.g. ChatGPT Plus)"
          className={fieldClass}
        />
        <input name="plan" defaultValue={subscription?.plan ?? ""} placeholder="Plan / tier" className={fieldClass} />
      </div>

      <input name="url" defaultValue={subscription?.url ?? ""} placeholder="Website" className={fieldClass} />

      <div className="grid grid-cols-2 gap-3">
        <input
          name="username"
          defaultValue={subscription?.username ?? ""}
          placeholder="Username / email"
          className={fieldClass}
        />
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder={subscription ? "Leave blank to keep current password" : "Password"}
          className={fieldClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input name="cost" defaultValue={subscription?.cost ?? ""} placeholder="Cost (e.g. $20/mo)" className={fieldClass} />
        <input
          name="renewalDate"
          type="date"
          defaultValue={subscription?.renewalDate ? format(subscription.renewalDate, "yyyy-MM-dd") : ""}
          className={fieldClass}
        />
      </div>

      <textarea
        name="notes"
        rows={2}
        defaultValue={subscription?.notes ?? ""}
        placeholder="Notes"
        className={fieldClass}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-charcoal px-4 py-2 text-sm font-medium text-white transition hover:bg-jet disabled:opacity-60"
      >
        {pending ? "Saving…" : subscription ? "Save changes" : "Add subscription"}
      </button>
    </form>
  );
}
