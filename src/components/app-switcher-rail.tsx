import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, BarChart3, Bot, Briefcase, Building2, CheckSquare, DollarSign, Handshake, HardHat, Home, Settings, User, Users } from "lucide-react";
import type { AppSection } from "@/lib/constants";
import type { Access } from "@/lib/section-access";
import NotificationSetup from "./notification-setup";

const TOOLS = [
  { key: "home", href: "/", label: "Home", icon: Home, section: null },
  { key: "crm", href: "/dashboard", label: "CRM", icon: Handshake, section: "CRM" },
  { key: "pm", href: "/pm", label: "PM", icon: HardHat, section: "PM" },
  { key: "tasks", href: "/my-tasks", label: "Tasks", icon: CheckSquare, section: "TASKS" },
  { key: "snags", href: "/snags", label: "Snags", icon: AlertTriangle, section: "SNAGS" },
  { key: "vendors", href: "/vendors", label: "Vendors", icon: Building2, section: "VENDORS" },
  { key: "ai", href: "/ai", label: "AI", icon: Bot, section: "AI" },
  { key: "reports", href: "/reports", label: "Reports", icon: BarChart3, section: "REPORTS" },
  { key: "finance", href: "/finance", label: "Finance", icon: DollarSign, section: "FINANCE" },
  { key: "recruitment", href: "/recruitment", label: "Recruitment", icon: Briefcase, section: "RECRUITMENT" },
] satisfies { key: string; href: string; label: string; icon: typeof Home; section: AppSection | null }[];

export default function AppSwitcherRail({
  active,
  access,
}: {
  active:
    | "home"
    | "crm"
    | "pm"
    | "tasks"
    | "snags"
    | "vendors"
    | "ai"
    | "reports"
    | "finance"
    | "recruitment"
    | "team"
    | "settings"
    | "account";
  access: Access;
}) {
  const visibleTools = TOOLS.filter((t) => t.section === null || access.sections.includes(t.section));

  return (
    <aside className="sticky top-0 flex h-screen w-16 shrink-0 flex-col items-center gap-1 self-start overflow-y-auto border-r border-white/10 bg-charcoal py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden print:hidden">
      <Link href="/" className="mb-4 flex h-8 w-12 items-center justify-center">
        <Image
          src="/brand/logo-icon-champagne.png"
          alt="Perago Interiors"
          width={1200}
          height={201}
          className="h-auto w-11"
        />
      </Link>

      {visibleTools.map(({ key, href, label, icon: Icon }) => {
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

      {access.role === "ADMIN" && (
        <>
          <Link
            href="/team"
            title="Team"
            className={`flex w-12 flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-medium transition ${
              active === "team" ? "bg-gold/15 text-gold" : "text-white/50 hover:bg-white/5 hover:text-white/80"
            }`}
          >
            <Users size={18} />
            Team
          </Link>
          <Link
            href="/settings"
            title="Settings"
            className={`flex w-12 flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-medium transition ${
              active === "settings" ? "bg-gold/15 text-gold" : "text-white/50 hover:bg-white/5 hover:text-white/80"
            }`}
          >
            <Settings size={18} />
            Settings
          </Link>
        </>
      )}

      <div className="mt-auto flex flex-col items-center gap-1">
        <Link
          href="/account"
          title="Account"
          className={`flex w-12 flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-medium transition ${
            active === "account" ? "bg-gold/15 text-gold" : "text-white/50 hover:bg-white/5 hover:text-white/80"
          }`}
        >
          <User size={18} />
          Account
        </Link>
        <NotificationSetup />
      </div>
    </aside>
  );
}
