"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { apiFetchClient, getToken } from "@/lib/clientApi";
import GlobalSearch from "./global-search";
import NotificationBell from "./notification-bell";

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
      <GlobalSearch />

      <div className="flex items-center gap-3">
        <NotificationBell />
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
