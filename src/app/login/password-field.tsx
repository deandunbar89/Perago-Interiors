"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/** Password input with a show/hide eye button. */
export default function PasswordField({
  name,
  label,
  autoComplete,
}: {
  name: string;
  label: string;
  autoComplete: "current-password" | "new-password";
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-white/70">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          name={name}
          required
          autoComplete={autoComplete}
          className="w-full rounded-lg border border-white/15 bg-white/5 py-2 pl-3 pr-10 text-sm text-white outline-none placeholder:text-white/30 focus:border-gold focus:ring-1 focus:ring-gold"
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-white/50 transition hover:text-white"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}
