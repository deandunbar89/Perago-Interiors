"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, ClipboardList, Flag, CheckSquare, Building2, LogOut } from "lucide-react";
import { signOutAction } from "./actions";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/deadlines", label: "Deadlines", icon: Flag },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/projects", label: "Projects", icon: ClipboardList },
  { href: "/clients", label: "Clients", icon: Building2 },
];

export default function Sidebar({
  user,
}: {
  user?: { name?: string | null; email?: string | null; role?: string };
}) {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col bg-charcoal">
      <div className="px-5 py-6">
        <span className="text-sm font-semibold uppercase tracking-widest text-white/40">
          CRM
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-gold/15 text-gold"
                  : "text-white/60 hover:bg-white/5 hover:text-white/90"
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="mb-2 px-2">
          <p className="truncate text-sm font-medium text-white/90">{user?.name}</p>
          <p className="truncate text-xs text-white/40">{user?.email}</p>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-white/50 transition hover:bg-white/5 hover:text-white/90"
          >
            <LogOut size={17} />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
