"use client";

import { useRef, useState, useTransition } from "react";
import type { User } from "@prisma/client";
import { Plus, Trash2, UserCircle } from "lucide-react";
import { createUser, deleteUser } from "@/lib/actions/users";

export default function TeamPanel({
  users,
  currentUserId,
  isAdmin,
}: {
  users: User[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleDelete(userId: string) {
    if (!confirm("Remove this team member? They will lose access immediately.")) return;
    startTransition(() => {
      deleteUser(userId);
    });
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createUser(undefined, formData);
      if (result?.error) setError(result.error);
      else {
        formRef.current?.reset();
        setOpen(false);
      }
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <ul className="divide-y divide-slate-100">
          {users.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <UserCircle size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {u.name} {u.id === currentUserId && <span className="text-slate-400">(you)</span>}
                  </p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {u.role === "ADMIN" ? "Admin" : "Member"}
                </span>
                {isAdmin && u.id !== currentUserId && (
                  <button
                    onClick={() => handleDelete(u.id)}
                    className="text-slate-300 transition hover:text-red-600"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {isAdmin && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex w-full items-center gap-1.5 px-4 py-3 text-sm font-medium text-slate-700"
          >
            <Plus size={15} />
            Add team member
          </button>
          {open && (
            <form ref={formRef} action={handleSubmit} className="space-y-3 border-t border-slate-100 p-4">
              <div className="grid grid-cols-2 gap-3">
                <input
                  name="name"
                  required
                  placeholder="Full name"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="Email"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Temporary password"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                />
                <select
                  name="role"
                  defaultValue="MEMBER"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                >
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-charcoal px-4 py-2 text-sm font-medium text-white transition hover:bg-jet disabled:opacity-60"
              >
                {pending ? "Adding…" : "Add member"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
