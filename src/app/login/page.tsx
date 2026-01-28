"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@mcplanning.local");
  const [password, setPassword] = useState("admin123");
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3000/api"}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
      );

      if (!response.ok) {
        throw new Error("Identifiants invalides");
      }

      const data = (await response.json()) as { accessToken: string };
      setToken(data.accessToken);
      if (typeof window !== "undefined") {
        localStorage.setItem("mcplanning_token", data.accessToken);
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-indigo-50 via-white to-rose-50 p-6 shadow-2xl shadow-indigo-500/10 md:p-10">
      <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-rose-200/40 blur-3xl" />

      <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Connexion admin
          </div>
          <h1 className="text-4xl font-semibold text-zinc-900 md:text-5xl">
            Accès sécurisé à votre espace pilotage
          </h1>
          <p className="text-lg text-zinc-600">
            Connectez-vous pour gérer les équipes, publier le planning et valider
            les demandes. Utilisez les identifiants de démonstration si besoin.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {["Suivi temps réel", "Validation rapide", "Contrôle d'accès", "Historique centralisé"].map(
              (label) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm font-semibold text-zinc-700 shadow-sm"
                >
                  {label}
                </div>
              ),
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-lg shadow-indigo-500/10">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
              Connexion
            </p>
            <h2 className="text-2xl font-semibold text-zinc-900">Espace admin</h2>
            <p className="text-sm text-zinc-600">
              Utilise les identifiants seed pour tester rapidement.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Email</label>
              <input
                className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-400 focus:outline-none"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Mot de passe</label>
              <input
                className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-400 focus:outline-none"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              className="w-full rounded-2xl bg-zinc-900 py-2 text-sm font-semibold text-white shadow-md shadow-zinc-900/15 transition hover:-translate-y-0.5"
              type="submit"
              disabled={loading}
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          {token && (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <p className="font-medium">Token JWT</p>
              <p className="mt-2 break-all">{token}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
