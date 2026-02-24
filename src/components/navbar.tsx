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
} from "lucide-react";

export default function Navbar() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

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
    window.location.href = "/";
  };

  const linkClass =
    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900";

  if (!mounted) {
    return (
      <nav className="flex flex-wrap items-center gap-1">
        <Link className={linkClass} href="/">
          <Home size={14} />
          Accueil
        </Link>
        <Link className={linkClass} href="/signup">
          <UserPlus size={14} />
          Inscription
        </Link>
        <Link
          className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-1.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20"
          href="/login"
        >
          <LogIn size={14} />
          Connexion
        </Link>
      </nav>
    );
  }

  return (
    <nav className="flex flex-wrap items-center gap-1">
      {!isAuthed && (
        <Link className={linkClass} href="/">
          <Home size={14} />
          Accueil
        </Link>
      )}
      {isAuthed ? (
        <>
          <Link className={linkClass} href="/dashboard">
            <LayoutDashboard size={14} />
            Dashboard
          </Link>
          <Link className={linkClass} href="/planning">
            <CalendarDays size={14} />
            Planning
          </Link>
          <Link className={linkClass} href="/requests">
            <ClipboardList size={14} />
            Demandes
          </Link>
          {role === "admin" && (
            <>
              <Link className={linkClass} href="/employees">
                <Users size={14} />
                Employés
              </Link>
              <Link className={linkClass} href="/admin">
                <ShieldCheck size={14} />
                Admin
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white shadow-md shadow-slate-900/20 transition hover:bg-slate-700"
          >
            <LogOut size={14} />
            Déconnexion
          </button>
        </>
      ) : (
        <>
          <Link className={linkClass} href="/signup">
            <UserPlus size={14} />
            Inscription
          </Link>
          <Link
            className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-1.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20"
            href="/login"
          >
            <LogIn size={14} />
            Connexion
          </Link>
        </>
      )}
    </nav>
  );
}
