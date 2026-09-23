"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetchClient } from "@/lib/clientApi";
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Users,
  ShieldCheck,
  LogOut,
  UserCircle,
  QrCode,
  ScanLine,
  CalendarRange,
  Sun,
  Moon,
  HelpCircle,
  MoreHorizontal,
  X,
} from "lucide-react";
import TutorialModal from "./tutorial-modal";

const ADMIN_LINKS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/planning", icon: CalendarDays, label: "Planning" },
  { href: "/requests", icon: ClipboardList, label: "Demandes" },
  { href: "/pointage", icon: QrCode, label: "Pointages" },
  { href: "/employees", icon: Users, label: "Employés" },
  { href: "/admin", icon: ShieldCheck, label: "Admin" },
];

const EMPLOYEE_LINKS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/planning", icon: CalendarDays, label: "Planning" },
  { href: "/requests", icon: ClipboardList, label: "Demandes" },
  { href: "/scan", icon: ScanLine, label: "Scanner" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("shiftly_token");
    if (token) {
      apiFetchClient<{ role?: string }>("/auth/me")
        .then((data) => setRole(data.role ?? null))
        .catch(() => setRole(null));
    }
    const saved = localStorage.getItem("shiftly_theme");
    if (saved === "dark") setTheme("dark");
  }, []);

  const links = role === "admin" ? ADMIN_LINKS : EMPLOYEE_LINKS;

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("shiftly_theme", next);
    if (next === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("shiftly_token");
    window.dispatchEvent(new Event("shiftly:logout"));
    window.location.href = "/";
  };

  const itemClass = (active: boolean) =>
    `group/item relative flex h-11 w-full items-center gap-3 overflow-hidden rounded-2xl px-[14px] transition-colors ${
      active ? "bg-white text-black" : "text-white/40 hover:bg-white/10 hover:text-white"
    }`;

  const labelClass = "whitespace-nowrap text-sm font-semibold opacity-0 transition-opacity duration-150 group-hover:opacity-100";

  return (
    <>
      {/* Desktop: sidebar flottante, extensible au survol */}
      <aside
        className="group fixed left-4 top-4 bottom-4 z-40 hidden w-[72px] flex-col items-stretch overflow-hidden rounded-[28px] bg-[#0a0a0a] px-[14px] py-6 shadow-2xl transition-[width] duration-300 ease-out hover:w-[220px] md:flex dark:border dark:border-white/5"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 24px)" }}
      >
        <Link href="/dashboard" className="mb-8 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#B4FF39] text-black">
          <CalendarRange size={20} strokeWidth={2.5} />
        </Link>

        <nav className="flex flex-1 flex-col gap-2">
          {links.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} title={label} className={itemClass(active)}>
                <Icon size={19} strokeWidth={2} className="shrink-0" />
                <span className={labelClass}>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col gap-2">
          <button type="button" onClick={() => setTutorialOpen(true)} title="Voir le tuto" className={itemClass(false)}>
            <HelpCircle size={19} strokeWidth={2} className="shrink-0" />
            <span className={labelClass}>Tuto</span>
          </button>
          <button type="button" onClick={toggleTheme} title={theme === "dark" ? "Mode clair" : "Mode sombre"} className={itemClass(false)}>
            {theme === "dark" ? <Sun size={19} strokeWidth={2} className="shrink-0" /> : <Moon size={19} strokeWidth={2} className="shrink-0" />}
            <span className={labelClass}>{theme === "dark" ? "Mode clair" : "Mode sombre"}</span>
          </button>
          <Link href="/profile" title="Profil" className={itemClass(pathname === "/profile")}>
            <UserCircle size={19} strokeWidth={2} className="shrink-0" />
            <span className={labelClass}>Profil</span>
          </Link>
          <button type="button" onClick={handleLogout} title="Déconnexion" className={itemClass(false)}>
            <LogOut size={19} strokeWidth={2} className="shrink-0" />
            <span className={labelClass}>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Mobile: barre flottante en bas */}
      <nav
        className="fixed inset-x-4 bottom-4 z-40 flex items-center justify-between gap-1 rounded-full bg-[#0a0a0a] px-2 py-2 shadow-2xl md:hidden"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)" }}
      >
        {links.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-colors ${
                active ? "bg-white text-black" : "text-white/40 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={19} strokeWidth={2} />
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMobileMoreOpen(true)}
          title="Plus"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white/40 transition-colors hover:bg-white/10 hover:text-white"
        >
          <MoreHorizontal size={19} strokeWidth={2} />
        </button>
      </nav>

      {/* Mobile: feuille "Plus" (tuto, thème, profil, déconnexion) */}
      {mobileMoreOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50 md:hidden" onClick={() => setMobileMoreOpen(false)}>
          <div
            className="w-full rounded-t-[28px] bg-[#0a0a0a] p-5 pb-8"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-bold text-white/60">Plus d&apos;options</span>
              <button onClick={() => setMobileMoreOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full text-white/40 hover:bg-white/10 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => { setMobileMoreOpen(false); setTutorialOpen(true); }}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-white/70 hover:bg-white/10 hover:text-white"
              >
                <HelpCircle size={19} strokeWidth={2} /> <span className="text-sm font-semibold">Voir le tuto</span>
              </button>
              <button
                type="button"
                onClick={() => { toggleTheme(); }}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-white/70 hover:bg-white/10 hover:text-white"
              >
                {theme === "dark" ? <Sun size={19} strokeWidth={2} /> : <Moon size={19} strokeWidth={2} />}
                <span className="text-sm font-semibold">{theme === "dark" ? "Mode clair" : "Mode sombre"}</span>
              </button>
              <Link
                href="/profile"
                onClick={() => setMobileMoreOpen(false)}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-white/70 hover:bg-white/10 hover:text-white"
              >
                <UserCircle size={19} strokeWidth={2} /> <span className="text-sm font-semibold">Profil</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-white/70 hover:bg-white/10 hover:text-white"
              >
                <LogOut size={19} strokeWidth={2} /> <span className="text-sm font-semibold">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <TutorialModal open={tutorialOpen} onClose={() => setTutorialOpen(false)} role={role} />
    </>
  );
}
