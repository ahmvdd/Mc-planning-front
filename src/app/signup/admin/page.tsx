"use client";

import { useState } from "react";

export default function AdminSignupPage() {
  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [orgCode, setOrgCode] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3000/api"}/auth/signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            orgName,
            email,
            password,
            role: "admin",
            status: "active",
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Impossible de créer le compte admin");
      }

      const data = (await response.json()) as {
        accessToken: string;
        organizationCode?: string;
      };
      setOrgCode(data.organizationCode ?? null);
      if (typeof window !== "undefined") {
        localStorage.setItem("mcplanning_token", data.accessToken);
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-lg shadow-indigo-500/10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
          Inscription
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-zinc-900">
          Créer un compte admin
        </h1>
        <p className="mt-3 text-zinc-600">
          Ce formulaire est prêt pour être connecté à l'API.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-lg shadow-indigo-500/10 space-y-4"
      >
        <input
          className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
          placeholder="Nom complet"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <input
          className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
          placeholder="Nom de l'organisation"
          value={orgName}
          onChange={(event) => setOrgName(event.target.value)}
        />
        <input
          className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <input
          className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
          placeholder="Mot de passe"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          className="w-full rounded-2xl bg-zinc-900 py-2 text-sm font-semibold text-white shadow-md shadow-zinc-900/15 transition hover:-translate-y-0.5"
          disabled={loading}
        >
          {loading ? "Création..." : "Créer le compte admin"}
        </button>
      </form>

      {success && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          Compte admin créé avec succès.
          {orgCode && (
            <p className="mt-2 font-semibold">Code organisation: {orgCode}</p>
          )}
        </div>
      )}
    </div>
  );
}
