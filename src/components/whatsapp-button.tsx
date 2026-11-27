"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

/**
 * Phones: https://wa.me/… opens the installed WhatsApp / WhatsApp Business app directly.
 * Computers: whatsapp://… opens the WhatsApp desktop app, with a WhatsApp Web link
 * underneath for computers that don't have the app.
 */
export default function WhatsAppButton({ number, name, compact = false }: { number: string; name: string; compact?: boolean }) {
  const [mobile, setMobile] = useState(true);

  useEffect(() => {
    const ua = navigator.userAgent;
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobile(isMobile);
  }, []);

  const href = mobile ? `https://wa.me/${number}` : `whatsapp://send?phone=${number}`;

  if (compact) {
    return (
      <span className="inline-flex items-center gap-2">
        <a
          href={href}
          title={`WhatsApp ${name}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#1ebe5b]"
        >
          <MessageCircle size={13} />
          WhatsApp
        </a>
        {!mobile && (
          <a
            href={`https://web.whatsapp.com/send?phone=${number}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-slate-400 hover:text-slate-700 hover:underline"
          >
            Web
          </a>
        )}
      </span>
    );
  }

  return (
    <div className="mt-3">
      <a
        href={href}
        className="flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-3 py-2 text-sm font-medium text-white hover:bg-[#1ebe5b]"
      >
        <MessageCircle size={16} />
        WhatsApp {name}
      </a>
      {!mobile && (
        <a
          href={`https://web.whatsapp.com/send?phone=${number}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 block text-center text-xs text-slate-500 hover:text-slate-800 hover:underline"
        >
          No WhatsApp app on this computer? Use WhatsApp Web
        </a>
      )}
    </div>
  );
}
