"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/recruitment", label: "Vacancies", match: (p: string) => p === "/recruitment" || p.startsWith("/recruitment/vacancies") },
  { href: "/recruitment/candidates", label: "Candidates", match: (p: string) => p.startsWith("/recruitment/candidates") },
  { href: "/recruitment/tasks", label: "Tasks", match: (p: string) => p.startsWith("/recruitment/tasks") },
];

export default function RecruitmentNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-slate-200 bg-white px-8">
      {TABS.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`-mb-px border-b-2 px-3 py-3 text-sm font-medium transition ${
              active ? "border-gold text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
