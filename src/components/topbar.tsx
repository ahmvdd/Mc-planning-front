"use client";

import { useEffect, useState } from "react";
import { Search, Bell, ShieldCheck } from "lucide-react";
import { apiFetchClient, getToken } from "@/lib/clientApi";

export default function TopBar() {
  const [me, setMe] = useState<{ name?: string; email?: string; role?: string } | null>(null);

  useEffect(() => {
    if (!getToken()) return;
    apiFetchClient<{ name?: string; email?: string; role?: string }>("/auth/me")
      .then(setMe)
      .catch(() => setMe(null));
  }, []);

  const displayName = me?.name || me?.email || "Utilisateur";
  const initials = displayName
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center justify-between gap-4 px-5 pt-6 sm:px-8 md:pt-8" style={{ paddingTop: "calc(env(safe-area-inset-top) + 24px)" }}>
      <div className="flex h-11 w-full max-w-xs items-center gap-2.5 rounded-full bg-white px-4 text-sm text-gray-400 shadow-sm dark:bg-white/5 dark:text-white/30 dark:shadow-none">
        <Search size={15} className="shrink-0" />
        <span className="truncate">Rechercher...</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Notifications"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm hover:text-gray-900 transition-colors dark:bg-white/5 dark:text-white/40 dark:shadow-none dark:hover:text-white"
        >
          <Bell size={17} />
        </button>
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#B4FF39] text-sm font-bold text-black" title={me?.role === "admin" ? "Espace Administration" : undefined}>
          {initials || "?"}
          {me?.role === "admin" && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-[#B4FF39] ring-2 ring-[#F5F4EF] dark:ring-[#0E0E10]">
              <ShieldCheck size={11} strokeWidth={2.5} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
