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
} from "lucide-react";

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

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-[76px] flex-col items-center bg-[#0a0a0a] py-6 dark:border-r dark:border-white/5" style={{ paddingTop: "calc(env(safe-area-inset-top) + 24px)" }}>
      <Link href="/dashboard" className="mb-8 flex h-10 w-10 items-center justify-center rounded-xl bg-[#B4FF39] text-black">
        <CalendarRange size={20} strokeWidth={2.5} />
      </Link>

      <nav className="flex flex-1 flex-col items-center gap-2">
        {links.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
                active ? "bg-white text-black" : "text-white/40 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={19} strokeWidth={2} />
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === "dark" ? "Mode clair" : "Mode sombre"}
          className="flex h-11 w-11 items-center justify-center rounded-xl text-white/40 transition-colors hover:bg-white/10 hover:text-white"
        >
          {theme === "dark" ? <Sun size={19} strokeWidth={2} /> : <Moon size={19} strokeWidth={2} />}
        </button>
        <Link
          href="/profile"
          title="Profil"
          className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
            pathname === "/profile" ? "bg-white text-black" : "text-white/40 hover:bg-white/10 hover:text-white"
          }`}
        >
          <UserCircle size={19} strokeWidth={2} />
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          title="Déconnexion"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-white/40 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut size={19} strokeWidth={2} />
        </button>
      </div>
    </aside>
  );
}
