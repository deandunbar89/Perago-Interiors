import Link from "next/link";

export default function StatCard({
  label,
  value,
  currency,
  accent,
  href,
}: {
  label: string;
  value: string;
  /** When set, renders as a small label above the value instead of inline, so long currency amounts fit the card. */
  currency?: string;
  accent?: "warn";
  href?: string;
}) {
  const content = (
    <>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      {currency ? (
        <div className="mt-1.5 leading-tight">
          <p className="text-xs font-medium text-slate-400">{currency}</p>
          <p
            className={`truncate text-xl font-semibold ${
              accent === "warn" ? "text-amber-600" : "text-slate-900"
            }`}
          >
            {value}
          </p>
        </div>
      ) : (
        <p
          className={`mt-1.5 truncate text-2xl font-semibold ${
            accent === "warn" ? "text-amber-600" : "text-slate-900"
          }`}
        >
          {value}
        </p>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md"
      >
        {content}
      </Link>
    );
  }

  return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">{content}</div>;
}
