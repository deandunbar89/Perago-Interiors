"use client";

import { useActionState } from "react";
import type { Client } from "@prisma/client";
import { createClient, updateClient } from "@/lib/actions/clients";

type ActionState = { error?: string; success?: boolean } | undefined;
type FormAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

export default function ClientForm({ client }: { client?: Client }) {
  const action: FormAction = client
    ? (updateClient.bind(null, client.id) as FormAction)
    : (createClient as FormAction);

  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Company name *</label>
        <input
          name="name"
          required
          defaultValue={client?.name}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Industry</label>
          <input
            name="industry"
            defaultValue={client?.industry || ""}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Website</label>
          <input
            name="website"
            defaultValue={client?.website || ""}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Address</label>
        <input
          name="address"
          defaultValue={client?.address || ""}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
        <textarea
          name="notes"
          rows={3}
          defaultValue={client?.notes || ""}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
        />
      </div>
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}
      {state?.success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-600">Saved.</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-charcoal px-4 py-2 text-sm font-medium text-white transition hover:bg-jet disabled:opacity-60"
      >
        {pending ? "Saving…" : client ? "Save changes" : "Create client"}
      </button>
    </form>
  );
}
