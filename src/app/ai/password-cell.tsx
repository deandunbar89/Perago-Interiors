"use client";

import { useState } from "react";
import { Eye, EyeOff, Copy, Check } from "lucide-react";
import { revealAiSubscriptionPassword } from "@/lib/actions/ai-subscriptions";

export default function PasswordCell({ id, hasPassword }: { id: string; hasPassword: boolean }) {
  const [revealed, setRevealed] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!hasPassword) return <span className="text-xs text-slate-300">—</span>;

  async function toggleReveal() {
    if (revealed !== null) {
      setRevealed(null);
      return;
    }
    setLoading(true);
    const password = await revealAiSubscriptionPassword(id);
    setRevealed(password ?? "");
    setLoading(false);
  }

  async function copy() {
    let password = revealed;
    if (password === null) {
      password = await revealAiSubscriptionPassword(id);
    }
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="min-w-[6rem] font-mono text-xs text-slate-700">
        {revealed !== null ? revealed : "••••••••"}
      </span>
      <button
        onClick={toggleReveal}
        disabled={loading}
        className="flex items-center justify-center rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        title={revealed !== null ? "Hide" : "Show"}
      >
        {revealed !== null ? <EyeOff size={13} /> : <Eye size={13} />}
      </button>
      <button
        onClick={copy}
        className="flex items-center justify-center rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        title="Copy"
      >
        {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
      </button>
    </div>
  );
}
