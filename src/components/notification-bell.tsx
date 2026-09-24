"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CalendarClock, FileText, Check } from "lucide-react";
import { apiFetchClient } from "@/lib/clientApi";

type Notification = {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

const ICONS: Record<string, typeof Bell> = {
  request_created: FileText,
  request_status: FileText,
  planning_assigned: CalendarClock,
};

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadUnreadCount = () => {
    apiFetchClient<{ count: number }>("/notifications/unread-count")
      .then((d) => setUnreadCount(d.count))
      .catch(() => {});
  };

  const loadNotifications = () => {
    apiFetchClient<Notification[]>("/notifications")
      .then(setNotifications)
      .catch(() => {});
  };

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) loadNotifications();
  }, [open]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleClickNotif = async (n: Notification) => {
    if (!n.read) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
      apiFetchClient(`/notifications/${n.id}/read`, { method: "PATCH" }).catch(() => {});
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
    setUnreadCount(0);
    await apiFetchClient("/notifications/read-all", { method: "PATCH" }).catch(() => {});
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm hover:text-gray-900 transition-colors dark:bg-white/5 dark:text-white/40 dark:shadow-none dark:hover:text-white"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#B4FF39] px-1 text-[10px] font-bold text-black ring-2 ring-[#F5F4EF] dark:ring-[#0E0E10]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-14 z-50 w-80 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-[#161618] dark:ring-white/10">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/5">
            <span className="text-sm font-bold text-gray-900 dark:text-white">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-900 transition-colors dark:text-white/30 dark:hover:text-white"
              >
                <Check size={12} /> Tout marquer lu
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="px-4 py-8 text-center text-xs text-gray-300 dark:text-white/20">Aucune notification</p>
            )}
            {notifications.map((n) => {
              const Icon = ICONS[n.type] ?? Bell;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleClickNotif(n)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/5 ${
                    !n.read ? "bg-lime-50/60 dark:bg-[#B4FF39]/5" : ""
                  }`}
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-white/50">
                    <Icon size={14} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-gray-900 dark:text-white">{n.title}</span>
                    <span className="block text-xs text-gray-400 mt-0.5 line-clamp-2 dark:text-white/40">{n.message}</span>
                    <span className="block text-[11px] text-gray-300 mt-1 dark:text-white/25">{timeAgo(n.createdAt)}</span>
                  </span>
                  {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#B4FF39]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
