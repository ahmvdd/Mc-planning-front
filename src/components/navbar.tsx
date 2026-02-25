"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetchClient } from "@/lib/clientApi";
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Users,
  ShieldCheck,
  LogOut,
  LogIn,
  UserPlus,
  Home,
  Menu,
  X,
} from "lucide-react";

export default function Navbar() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("mcplanning_token");
      setIsAuthed(Boolean(token));
      if (token) {
        apiFetchClient<{ role?: string }>("/auth/me")
          .then((data) => setRole(data.role ?? null))
          .catch(() => setRole(null))
          .finally(() => setMounted(true));
      } else {
        setMounted(true);
      }
    };

    checkAuth();
    window.addEventListener("storage", checkAuth);
    window.addEventListener("mcplanning:login", checkAuth);
    window.addEventListener("mcplanning:logout", checkAuth);

    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("mcplanning:login", checkAuth);
      window.removeEventListener("mcplanning:logout", checkAuth);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("mcplanning_token");
    window.dispatchEvent(new Event("mcplanning:logout"));
    setIsAuthed(false);
    setRole(null);
    setMobileOpen(false);
    window.location.href = "/";
  };

  const linkClass =
    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900";

  const mobileLinkClass =
    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900";

  const close = () => setMobileOpen(false);

  const desktopLinks = mounted && isAuthed ? (
    <>
      <Link className={linkClass} href="/dashboard"><LayoutDashboard size={14} /> Dashboard</Link>
      <Link className={linkClass} href="/planning"><CalendarDays size={14} /> Planning</Link>
      <Link className={linkClass} href="/requests"><ClipboardList size={14} /> Demandes</Link>
      {role === "admin" && (
        <>
          <Link className={linkClass} href="/employees"><Users size={14} /> Employés</Link>
          <Link className={linkClass} href="/admin"><ShieldCheck size={14} /> Admin</Link>
        </>
      )}
      <button
        type="button"
        onClick={handleLogout}
        className="flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white shadow-md shadow-slate-900/20 transition hover:bg-slate-700"
      >
        <LogOut size={14} /> Déconnexion
      </button>
    </>
  ) : (
    <>
      <Link className={linkClass} href="/"><Home size={14} /> Accueil</Link>
      <Link className={linkClass} href="/signup"><UserPlus size={14} /> Inscription</Link>
      <Link
        className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-1.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20"
        href="/login"
      >
        <LogIn size={14} /> Connexion
      </Link>
    </>
  );

  const mobileLinks = mounted && isAuthed ? (
    <>
      <Link className={mobileLinkClass} href="/dashboard" onClick={close}><LayoutDashboard size={18} /> Dashboard</Link>
      <Link className={mobileLinkClass} href="/planning" onClick={close}><CalendarDays size={18} /> Planning</Link>
      <Link className={mobileLinkClass} href="/requests" onClick={close}><ClipboardList size={18} /> Demandes</Link>
      {role === "admin" && (
        <>
          <Link className={mobileLinkClass} href="/employees" onClick={close}><Users size={18} /> Employés</Link>
          <Link className={mobileLinkClass} href="/admin" onClick={close}><ShieldCheck size={18} /> Admin</Link>
        </>
      )}
      <button
        type="button"
        onClick={handleLogout}
        className="flex w-full items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
      >
        <LogOut size={18} /> Déconnexion
      </button>
    </>
  ) : (
    <>
      <Link className={mobileLinkClass} href="/" onClick={close}><Home size={18} /> Accueil</Link>
      <Link className={mobileLinkClass} href="/signup" onClick={close}><UserPlus size={18} /> Inscription</Link>
      <Link
        className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-3 text-sm font-semibold text-white"
        href="/login"
        onClick={close}
      >
        <LogIn size={18} /> Connexion
      </Link>
    </>
  );

  return (
    <div className="relative">
      {/* Desktop nav */}
      <nav className="hidden md:flex flex-wrap items-center gap-1">
        {desktopLinks}
      </nav>

      {/* Mobile hamburger button */}
      <button
        type="button"
        className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
        onClick={() => setMobileOpen((o) => !o)}
        aria-label="Menu"
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/10 md:hidden"
            onClick={close}
          />
          <nav className="absolute right-0 top-12 z-50 w-64 rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/10 space-y-1 md:hidden">
            {mobileLinks}
          </nav>
        </>
      )}
    </div>
  );
}
