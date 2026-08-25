import AppSwitcherRail from "@/components/app-switcher-rail";

export default function TasksLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AppSwitcherRail active="tasks" />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
