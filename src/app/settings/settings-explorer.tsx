"use client";

import { useTransition } from "react";
import { UserCircle } from "lucide-react";
import { setUserSectionAccess } from "@/lib/actions/settings";
import { APP_SECTIONS, APP_SECTION_LABELS, type AppSection } from "@/lib/constants";

type Member = { id: string; name: string; email: string; allowedSections: string[] };

export default function SettingsExplorer({ members }: { members: Member[] }) {
  const [, startTransition] = useTransition();

  function toggle(userId: string, section: AppSection, checked: boolean) {
    startTransition(() => {
      setUserSectionAccess(userId, section, checked);
    });
  }

  if (members.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
        No team members yet. Add one from Team first, then come back here to set what they can access.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="px-4 py-2.5">Team member</th>
            {APP_SECTIONS.map((section) => (
              <th key={section} className="px-3 py-2.5 text-center">
                {APP_SECTION_LABELS[section]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {members.map((m) => (
            <tr key={m.id} className="transition hover:bg-slate-50">
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <UserCircle size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{m.name}</p>
                    <p className="truncate text-xs text-slate-400">{m.email}</p>
                  </div>
                </div>
              </td>
              {APP_SECTIONS.map((section) => (
                <td key={section} className="px-3 py-2.5 text-center">
                  <input
                    type="checkbox"
                    defaultChecked={m.allowedSections.includes(section)}
                    onChange={(e) => toggle(m.id, section, e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-charcoal focus:ring-gold"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
