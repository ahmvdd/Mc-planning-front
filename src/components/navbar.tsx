"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetchClient } from "@/lib/clientApi";

export default function Navbar() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
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
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("mcplanning_token");
    setIsAuthed(false);
    setRole(null);
    window.location.href = "/";
  };

  if (!mounted) {
    return (
      <nav className="flex flex-wrap items-center gap-3 text-sm font-semibold text-zinc-600">
        <Link className="rounded px-3 py-1 transition hover:bg-zinc-100 hover:text-zinc-900" href="/">
          Accueil
        </Link>
        <Link className="rounded px-3 py-1 transition hover:bg-zinc-100 hover:text-zinc-900" href="/signup">
          Inscription
        </Link>
        <Link className="rounded bg-zinc-900 px-4 py-1.5 text-white" href="/login">
          Connexion
        </Link>
      </nav>
    );
  }

  return (
    <nav className="flex flex-wrap items-center gap-3 text-sm font-semibold text-zinc-600">
      {!isAuthed && (
        <Link className="rounded px-3 py-1 transition hover:bg-zinc-100 hover:text-zinc-900" href="/">
          Accueil
        </Link>
      )}
      {isAuthed ? (
        <>
          <Link className="rounded px-3 py-1 transition hover:bg-zinc-100 hover:text-zinc-900" href="/dashboard">
            Dashboard
          </Link>
          {role === "admin" && (
            <Link className="rounded px-3 py-1 transition hover:bg-zinc-100 hover:text-zinc-900" href="/employees">
              Employés
            </Link>
          )}
          <Link className="rounded px-3 py-1 transition hover:bg-zinc-100 hover:text-zinc-900" href="/planning">
            Planning
          </Link>
          <Link className="rounded px-3 py-1 transition hover:bg-zinc-100 hover:text-zinc-900" href="/requests">
            Demandes
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded bg-zinc-900 px-4 py-1.5 text-white"
          >
            Déconnexion
          </button>
        </>
      ) : (
        <>
          <Link className="rounded px-3 py-1 transition hover:bg-zinc-100 hover:text-zinc-900" href="/signup">
            Inscription
          </Link>
          <Link className="rounded bg-zinc-900 px-4 py-1.5 text-white" href="/login">
            Connexion
          </Link>
        </>
      )}
    </nav>
  );
}
