import Link from "next/link";
import { format } from "date-fns";
import { formatNumber } from "@/lib/constants";
import type { IssuedQuote } from "@/lib/quotes";

export type IssuedQuoteRow = { id: string; title: string; href: string; quote: IssuedQuote | null };

/** List of projects with the quote issued to each client (or "Not issued yet"). Used on dashboards and reports. */
export default function IssuedQuotesList({ rows, emptyText }: { rows: IssuedQuoteRow[]; emptyText: string }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400 shadow-sm">{emptyText}</p>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-2 font-semibold">Project</th>
            <th className="px-4 py-2 font-semibold">Issued quote</th>
            <th className="px-4 py-2 font-semibold">Issued</th>
            <th className="px-4 py-2 text-right font-semibold">Value (AED)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-2.5">
                <Link href={r.href} className="text-slate-800 hover:underline">
                  {r.title}
                </Link>
              </td>
              <td className="max-w-xs truncate px-4 py-2.5">
                {r.quote ? (
                  <a href={r.quote.href} target="_blank" rel="noopener noreferrer" className="text-slate-700 hover:underline">
                    {r.quote.name}
                  </a>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">Not issued yet</span>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 text-slate-500">
                {r.quote?.issuedAt ? format(r.quote.issuedAt, "d MMM yyyy") : "—"}
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 text-right text-slate-700">
                {r.quote?.issuedValue ? formatNumber(r.quote.issuedValue) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
