"use client";

import { useState } from "react";

/** A row of 1–5 buttons that posts as a hidden form field; clicking the chosen number again clears it. */
export default function ScoreInput({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: number | null;
}) {
  const [value, setValue] = useState<number | null>(defaultValue ?? null);

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-slate-700">{label}</span>
      <input type="hidden" name={name} value={value ?? ""} />
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setValue(value === n ? null : n)}
            className={`h-7 w-7 rounded-md border text-xs font-medium transition ${
              value === n
                ? "border-charcoal bg-charcoal text-white"
                : "border-slate-300 text-slate-600 hover:bg-slate-100"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
