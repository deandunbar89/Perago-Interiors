"use client";

import { useRef, useState, useTransition } from "react";
import type { Contact } from "@prisma/client";
import { Mail, Phone, Plus, Trash2, User } from "lucide-react";
import { createContact, deleteContact } from "@/lib/actions/clients";

export default function ContactsPanel({
  clientId,
  contacts,
}: {
  clientId: string;
  contacts: Contact[];
}) {
  const [open, setOpen] = useState(contacts.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createContact(clientId, formData);
      if (result?.error) setError(result.error);
      else {
        formRef.current?.reset();
        setOpen(false);
      }
    });
  }

  function handleDelete(contactId: string) {
    if (!confirm("Remove this contact?")) return;
    startTransition(() => {
      deleteContact(clientId, contactId);
    });
  }

  return (
    <div className="space-y-3">
      {contacts.map((c) => (
        <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-1 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
              <User size={13} className="text-slate-400" />
              {c.name}
              {c.isPrimary && (
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                  Primary
                </span>
              )}
            </p>
            <button
              onClick={() => handleDelete(c.id)}
              className="text-slate-300 transition hover:text-red-600"
            >
              <Trash2 size={14} />
            </button>
          </div>
          {c.role && <p className="ml-5 text-xs text-slate-500">{c.role}</p>}
          {c.email && (
            <p className="ml-5 flex items-center gap-1 text-xs text-slate-500">
              <Mail size={11} />
              {c.email}
            </p>
          )}
          {c.phone && (
            <p className="ml-5 flex items-center gap-1 text-xs text-slate-500">
              <Phone size={11} />
              {c.phone}
            </p>
          )}
        </div>
      ))}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-700"
        >
          <Plus size={14} />
          Add contact
        </button>
        {open && (
          <form
            ref={formRef}
            action={handleSubmit}
            className="space-y-2.5 border-t border-slate-100 p-4"
          >
            <input
              name="name"
              required
              placeholder="Full name"
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            />
            <input
              name="role"
              placeholder="Role / title"
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            />
            <input
              name="phone"
              placeholder="Phone"
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            />
            <label className="flex items-center gap-1.5 text-xs text-slate-600">
              <input type="checkbox" name="isPrimary" className="rounded border-slate-300" />
              Primary contact
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-charcoal px-3 py-1.5 text-sm font-medium text-white transition hover:bg-jet disabled:opacity-60"
            >
              {pending ? "Adding…" : "Add contact"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
