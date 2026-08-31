"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Bell, Settings, X } from "lucide-react";
import type { Notification } from "@prisma/client";
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  setNotificationPreference,
} from "@/lib/actions/notifications";
import { NOTIFICATION_TYPES, NOTIFICATION_TYPE_LABELS, type NotificationType } from "@/lib/constants";

const POLL_MS = 45_000;

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mutedTypes, setMutedTypes] = useState<string[]>([]);
  const [, startTransition] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    const data = await getMyNotifications();
    setNotifications(data.notifications);
    setUnreadCount(data.unreadCount);
    setMutedTypes(data.mutedTypes);
  }, []);

  useEffect(() => {
    startTransition(refresh);
    const interval = setInterval(() => startTransition(refresh), POLL_MS);
    return () => clearInterval(interval);
  }, [refresh, startTransition]);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowPrefs(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  function handleOpenNotification(n: Notification) {
    setOpen(false);
    if (!n.read) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
      startTransition(() => {
        markNotificationRead(n.id);
      });
    }
    router.push(n.link);
  }

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    startTransition(() => {
      markAllNotificationsRead();
    });
  }

  function togglePreference(type: NotificationType, enabled: boolean) {
    setMutedTypes((prev) => (enabled ? prev.filter((t) => t !== type) : [...prev, type]));
    startTransition(() => {
      setNotificationPreference(type, enabled);
    });
  }

  return (
    <div ref={panelRef} className="fixed right-4 top-4 z-50">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
            <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="rounded px-1.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setShowPrefs((v) => !v)}
                title="Notification preferences"
                className="flex items-center justify-center rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                {showPrefs ? <X size={14} /> : <Settings size={14} />}
              </button>
            </div>
          </div>

          {showPrefs ? (
            <div className="max-h-80 overflow-y-auto p-3">
              <p className="mb-2 text-xs text-slate-400">Choose what you get notified about.</p>
              <div className="space-y-2">
                {NOTIFICATION_TYPES.map((type) => (
                  <label key={type} className="flex items-center justify-between text-sm text-slate-700">
                    {NOTIFICATION_TYPE_LABELS[type]}
                    <input
                      type="checkbox"
                      checked={!mutedTypes.includes(type)}
                      onChange={(e) => togglePreference(type, e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-charcoal focus:ring-gold"
                    />
                  </label>
                ))}
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-slate-400">You&apos;re all caught up.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto divide-y divide-slate-100">
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => handleOpenNotification(n)}
                    className={`flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left transition hover:bg-slate-50 ${
                      !n.read ? "bg-amber-50/50" : ""
                    }`}
                  >
                    <div className="flex w-full items-center gap-1.5">
                      {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />}
                      <span className="truncate text-sm font-medium text-slate-800">{n.title}</span>
                    </div>
                    {n.body && <p className="line-clamp-2 text-xs text-slate-500">{n.body}</p>}
                    <span className="text-[11px] text-slate-400">
                      {formatDistanceToNow(n.createdAt, { addSuffix: true })}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
