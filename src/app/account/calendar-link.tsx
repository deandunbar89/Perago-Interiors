"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** The person's private deadlines & tasks calendar link, with how to add it to Outlook. */
export default function CalendarLink({ feedUrl }: { feedUrl: string }) {
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
    <div>
      <p className="mb-3 text-xs text-slate-500">
        Add this link to Outlook once and every open deadline and task in Perago shows up in your calendar, and
        updates when it changes.
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
          In <strong>Outlook on the web</strong> or the new Outlook: <strong>Calendar → Add calendar → Subscribe from
          web</strong>, paste the link and name it &quot;Perago deadlines&quot;.
        </li>
        <li>
          In classic Outlook: <strong>File → Account Settings → Internet Calendars → New</strong>, paste the link.
        </li>
      </ol>
      <p className="mt-3 text-[11px] text-slate-400">
        Keep this link private. Outlook refreshes subscribed calendars every few hours, so a new deadline can take a
        while to appear.
      </p>
    </div>
  );
}
