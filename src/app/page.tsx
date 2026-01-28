"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetchClient, getToken } from "@/lib/clientApi";

export default function Home() {
  const [me, setMe] = useState<{
    email?: string;
    role?: string;
    orgId?: number;
  } | null>(null);
  const [loadingMe, setLoadingMe] = useState(false);

  useEffect(() => {
    if (!getToken()) return;
    setLoadingMe(true);
    apiFetchClient<{ email?: string; role?: string; orgId?: number }>("/auth/me")
      .then((data) => setMe(data))
      .catch(() => setMe(null))
      .finally(() => setLoadingMe(false));
  }, []);

  return (
    <div className="space-y-12">
      <header className="relative overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-indigo-50 via-white to-rose-50 p-10 shadow-2xl shadow-indigo-500/10">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-rose-200/40 blur-3xl" />
        <div className="relative space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
            Bienvenue
          </p>
          <h1 className="text-4xl font-semibold text-zinc-900 md:text-6xl">
            MCPlanning Manager
          </h1>
          <p className="max-w-2xl text-lg text-zinc-600">
            Centralisez la gestion des employés, automatisez le planning et suivez
            les demandes en un seul endroit.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-full border border-zinc-300 bg-white px-6 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400"
            >
              Se connecter
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-zinc-900 px-6 py-2 text-sm font-semibold text-white"
            >
              S'inscrire
            </Link>
          </div>
          {me && (
            <div className="mt-6 rounded-3xl border border-white/70 bg-white/80 p-4 text-sm text-zinc-700 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Session active
              </p>
              <p className="mt-2 font-semibold text-zinc-900">
                {me.email ?? "Utilisateur"} · {me.role ?? "rôle"}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Organisation #{me.orgId ?? "—"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link className="rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white" href="/dashboard">
                  Aller au dashboard
                </Link>
                <Link className="rounded-full border border-zinc-200 px-4 py-1.5 text-xs font-semibold text-zinc-600" href="/requests">
                  Voir les demandes
                </Link>
              </div>
            </div>
          )}
          {!me && loadingMe && (
            <p className="mt-4 text-sm text-zinc-500">Chargement du profil...</p>
          )}
          <div className="grid gap-4 pt-4 md:grid-cols-3">
            {[
              { label: "Employés actifs", value: "+120" },
              { label: "Planning automatisé", value: "7j" },
              { label: "Demandes traitées", value: "98%" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/70 bg-white/80 p-4 text-sm text-zinc-600 shadow-sm"
              >
                <p className="text-2xl font-semibold text-zinc-900">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: "Pilotage instantané",
            description: "Visualisez les équipes et ajustez les shifts en quelques clics.",
          },
          {
            title: "Demandes centralisées",
            description: "Suivez les congés, documents et validations sans friction.",
          },
          {
            title: "Sécurité & rôles",
            description: "Contrôlez les accès selon les profils et les organisations.",
          },
        ].map((feature) => (
          <div
            key={feature.title}
            className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-zinc-900">{feature.title}</h3>
            <p className="mt-2 text-sm text-zinc-600">{feature.description}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-zinc-900">
          Démarrer en 3 étapes
        </h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {[
            { title: "Créez un compte admin", text: "Générez votre organisation." },
            { title: "Invitez vos équipes", text: "Partagez le code d'organisation." },
            { title: "Pilotez le planning", text: "Ajoutez shifts et validez." },
          ].map((step, index) => (
            <div key={step.title} className="rounded-2xl bg-zinc-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Étape {index + 1}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-zinc-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-zinc-600">{step.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
