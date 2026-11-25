"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Send, Undo2 } from "lucide-react";
import { markCrmQuoteIssued, markPmQuoteIssued, unmarkCrmQuote, unmarkPmQuote } from "@/lib/actions/quotes";
import { formatNumber } from "@/lib/constants";

type QuoteDoc = {
  id: string;
  quoteStatus: "ISSUED" | "SUPERSEDED" | null;
  issuedAt: Date | null;
  issuedValue: number | null;
};

/** Small label under a file name: "Issued to client …" or "Superseded". */
export function QuoteBadge({ doc }: { doc: QuoteDoc }) {
  if (doc.quoteStatus === "ISSUED") {
    return (
      <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-gold/25 px-2 py-0.5 text-[11px] font-semibold text-charcoal">
        Issued to client{doc.issuedAt ? ` · ${format(doc.issuedAt, "d MMM yyyy")}` : ""}
        {doc.issuedValue ? ` · AED ${formatNumber(doc.issuedValue)}` : ""}
      </span>
    );
  }
  if (doc.quoteStatus === "SUPERSEDED") {
    return (
      <span className="mt-0.5 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
        Superseded
      </span>
    );
  }
  return null;
}

/** Button on a file row: mark it as the quote issued to the client (or undo). */
export function QuoteIssueButton({ kind, parentId, doc }: { kind: "crm" | "pm"; parentId: string; doc: QuoteDoc }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const result =
        kind === "crm"
          ? await markCrmQuoteIssued(parentId, doc.id, value, date)
          : await markPmQuoteIssued(parentId, doc.id, value, date);
      if (result && "error" in result && result.error) setError(result.error);
      else setOpen(false);
    });
  }

  function undo() {
    if (!confirm("Remove the 'issued to client' mark from this file?")) return;
    startTransition(async () => {
      if (kind === "crm") await unmarkCrmQuote(parentId, doc.id);
      else await unmarkPmQuote(parentId, doc.id);
    });
  }

  if (doc.quoteStatus === "ISSUED") {
    return (
      <button
        onClick={undo}
        disabled={pending}
        title="Undo 'issued to client'"
        className="flex items-center justify-center rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
      >
        <Undo2 size={14} />
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Mark as the quote issued to the client"
        className="flex items-center gap-1 rounded-lg px-1.5 py-1 text-[11px] font-medium text-slate-500 transition hover:bg-gold/20 hover:text-charcoal"
      >
        <Send size={13} />
        Issued
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-64 space-y-2 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
          <p className="text-xs font-semibold text-slate-800">Mark as issued to client</p>
          <p className="text-[11px] text-slate-500">Any earlier issued quote on this project becomes superseded.</p>
          <label className="block text-[11px] text-slate-500">
            Date issued
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1 text-xs outline-none focus:border-gold"
            />
          </label>
          <label className="block text-[11px] text-slate-500">
            Quote value, AED excl. VAT (optional)
            <input
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. 190,555"
              className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1 text-xs outline-none focus:border-gold"
            />
          </label>
          {error && <p className="text-[11px] text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={() => setOpen(false)} className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800">
              Cancel
            </button>
            <button
              onClick={save}
              disabled={pending}
              className="rounded-md bg-charcoal px-3 py-1 text-xs font-medium text-white transition hover:bg-gold hover:text-charcoal disabled:opacity-60"
            >
              {pending ? "Saving…" : "Mark issued"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Card at the top of a Commercial tab showing the quote the client has. */
export function IssuedQuoteCard({
  quote,
  supersededCount,
}: {
  quote: { name: string; issuedAt: Date | null; issuedValue: number | null; href: string } | null;
  supersededCount: number;
}) {
  return (
    <div className="rounded-xl border border-gold/60 bg-gold/10 px-4 py-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Quote issued to client</p>
      {quote ? (
        <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
          <a href={quote.href} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-slate-900 underline-offset-2 hover:underline">
            {quote.name}
          </a>
          <span className="text-xs text-slate-600">
            {quote.issuedAt ? format(quote.issuedAt, "d MMM yyyy") : ""}
            {quote.issuedValue ? ` · AED ${formatNumber(quote.issuedValue)}` : ""}
            {supersededCount > 0 ? ` · ${supersededCount} earlier version${supersededCount > 1 ? "s" : ""} superseded` : ""}
          </span>
        </div>
      ) : (
        <p className="mt-1 text-sm text-slate-500">
          None yet — use <span className="font-medium">Issued</span> on the file you sent to the client.
        </p>
      )}
    </div>
  );
}
