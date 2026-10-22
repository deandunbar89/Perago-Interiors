"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Check, Copy, X } from "lucide-react";

const TABS = [
  { href: "/recruitment", label: "Vacancies", match: (p: string) => p === "/recruitment" || p.startsWith("/recruitment/vacancies") },
  { href: "/recruitment/candidates", label: "Candidates", match: (p: string) => p.startsWith("/recruitment/candidates") },
  { href: "/recruitment/tasks", label: "Tasks", match: (p: string) => p.startsWith("/recruitment/tasks") },
];

export default function RecruitmentNav({ feedUrl }: { feedUrl: string | null }) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-between gap-1 border-b border-slate-200 bg-white px-8">
      <div className="flex gap-1">
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
      </div>
      {feedUrl && <CalendarFeed feedUrl={feedUrl} />}
    </nav>
  );
}

/** Shows the person's private calendar link and how to add it to Outlook. */
function CalendarFeed({ feedUrl }: { feedUrl: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked — the link is selectable in the box
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
      >
        <CalendarDays size={14} />
        Calendar
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-[26rem] rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">Interviews in Outlook</h3>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={14} />
              </button>
            </div>
            <p className="mb-3 text-xs text-slate-500">
              Add this link to Outlook once and every interview booked in Perago shows up in your calendar
              automatically, and updates when it changes.
            </p>

            <div className="flex gap-2">
              <input
                readOnly
                value={feedUrl}
                onFocus={(e) => e.target.select()}
                className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600"
              />
              <button
                onClick={copy}
                className="flex items-center gap-1 rounded-lg bg-charcoal px-3 py-1.5 text-xs font-medium text-white transition hover:bg-gold hover:text-charcoal"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <ol className="mt-3 list-decimal space-y-1 pl-4 text-xs text-slate-600">
              <li>
                In <strong>Outlook on the web</strong> or the new Outlook: <strong>Calendar → Add calendar → Subscribe
                from web</strong>, paste the link and name it &quot;Perago interviews&quot;.
              </li>
              <li>
                In classic Outlook: <strong>File → Account Settings → Internet Calendars → New</strong>, paste the link.
              </li>
            </ol>
            <p className="mt-3 text-[11px] text-slate-400">
              Keep this link private: it&apos;s yours, and it shows candidate names. Outlook refreshes subscribed
              calendars every few hours, so a new interview can take a while to appear. For an instant copy, use
              &quot;Add to calendar&quot; on the interview itself.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
