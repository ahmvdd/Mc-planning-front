"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetchClient, getToken } from "@/lib/clientApi";

export default function AdminPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setError("Connexion requise");
      router.push("/login");
      setLoading(false);
      return;
    }

    apiFetchClient<{ role?: string }>("/auth/me")
      .then((data) => {
        if (data?.role !== "admin") {
          setError("Accès réservé aux admins");
          router.push("/dashboard");
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-10">
      <header className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-lg shadow-indigo-500/10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
          Administration
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-zinc-900">
          Espace admin
        </h1>
        <p className="mt-3 text-zinc-600">
          Réinitialisez les mots de passe, gérez l'accès et publiez le planning.
        </p>
        {error && (
          <div className="mt-4 space-y-3 text-sm text-zinc-700">
            <p>{error}</p>
            <div className="flex gap-3">
              <Link
                href="/login"
                className="rounded bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Se connecter
              </Link>
              <Link
                href="/signup"
                className="rounded border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700"
              >
                S'inscrire
              </Link>
            </div>
          </div>
        )}
      </header>

      {!error && !loading && (
        <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-lg shadow-indigo-500/10">
          <h2 className="text-lg font-semibold">Réinitialiser un mot de passe</h2>
          <form className="mt-4 space-y-3">
            <input
              className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
              placeholder="Email de l'employé"
              type="email"
            />
            <input
              className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
              placeholder="Nouveau mot de passe"
              type="password"
            />
            <button className="w-full rounded-2xl bg-zinc-900 py-2 text-sm font-semibold text-white shadow-md shadow-zinc-900/15 transition hover:-translate-y-0.5">
              Mettre à jour
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-lg shadow-indigo-500/10">
          <h2 className="text-lg font-semibold">Publier le planning</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Informez les employés des nouveaux horaires.
          </p>
          <form className="mt-4 space-y-3">
            <input
              className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
              type="date"
            />
            <textarea
              className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
              placeholder="Message aux équipes"
              rows={3}
            />
            <button className="w-full rounded-2xl bg-zinc-900 py-2 text-sm font-semibold text-white shadow-md shadow-zinc-900/15 transition hover:-translate-y-0.5">
              Publier
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-lg shadow-indigo-500/10">
          <h2 className="text-lg font-semibold">Contacter un employé</h2>
          <form className="mt-4 space-y-3">
            <input
              className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
              placeholder="Employé"
            />
            <textarea
              className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
              placeholder="Message"
              rows={3}
            />
            <button className="w-full rounded-2xl bg-zinc-900 py-2 text-sm font-semibold text-white shadow-md shadow-zinc-900/15 transition hover:-translate-y-0.5">
              Envoyer
            </button>
          </form>
        </div>
        </section>
      )}
    </div>
  );
}
