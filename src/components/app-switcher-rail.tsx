import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Bot, Building2, CheckSquare, Handshake, HardHat, Home } from "lucide-react";
import NotificationSetup from "./notification-setup";

const TOOLS = [
  { key: "home", href: "/", label: "Home", icon: Home },
  { key: "crm", href: "/dashboard", label: "CRM", icon: Handshake },
  { key: "pm", href: "/pm", label: "PM", icon: HardHat },
  { key: "tasks", href: "/my-tasks", label: "Tasks", icon: CheckSquare },
  { key: "snags", href: "/snags", label: "Snags", icon: AlertTriangle },
  { key: "vendors", href: "/vendors", label: "Vendors", icon: Building2 },
  { key: "ai", href: "/ai", label: "AI", icon: Bot },
] as const;

export default function AppSwitcherRail({
  active,
}: {
  active: "home" | "crm" | "pm" | "tasks" | "snags" | "vendors" | "ai";
}) {
  return (
    <aside className="flex w-16 shrink-0 flex-col items-center gap-1 border-r border-white/10 bg-jet py-4">
      <Link href="/" className="mb-4 flex h-8 w-8 items-center justify-center">
        <Image
          src="/brand/icon-tile-champagne.png"
          alt="Perago"
          width={1200}
          height={1200}
          className="h-8 w-8 rounded-lg"
        />
      </Link>

      {TOOLS.map(({ key, href, label, icon: Icon }) => {
        const isActive = key === active;
        return (
          <Link
            key={key}
            href={href}
            title={label}
            className={`flex w-12 flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-medium transition ${
              isActive ? "bg-gold/15 text-gold" : "text-white/50 hover:bg-white/5 hover:text-white/80"
            }`}
          >
            <Icon size={18} />
            {label}
          </Link>
        );
      })}

      <div className="mt-auto">
        <NotificationSetup />
      </div>
    </aside>
  );
}
