"use client";

import { Star } from "lucide-react";

/** Five-star display. Pass `onChange` to make it clickable; clicking the current rating again clears it. */
export default function StarRating({
  value,
  onChange,
  size = 16,
  disabled,
}: {
  value: number | null;
  onChange?: (value: number | null) => void;
  size?: number;
  disabled?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = value !== null && n <= value;
        const star = (
          <Star
            size={size}
            className={filled ? "fill-amber-400 text-amber-400" : "text-slate-300"}
          />
        );
        if (!onChange) return <span key={n}>{star}</span>;
        return (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange(value === n ? null : n)}
            title={`${n} star${n > 1 ? "s" : ""}`}
            className="transition hover:scale-110 disabled:opacity-60"
          >
            {star}
          </button>
        );
      })}
    </span>
  );
}
