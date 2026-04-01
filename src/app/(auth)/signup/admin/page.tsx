"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck, Building2, Mail, Lock, User,
  Loader2, CheckCircle2, ArrowRight, Copy, AlertCircle, ArrowLeft
} from "lucide-react";

export default function AdminSignupPage() {
  const [form, setForm] = useState({ name: "", orgName: "", email: "", password: "" });
  const [status, setStatus] = useState<{ type: "idle" | "loading" | "success" | "error"; message?: string }>({ type: "idle" });
  const [orgCode, setOrgCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ type: "loading" });
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3000/api"}/auth/signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, role: "admin", status: "active" }),
        }
      );
      if (!response.ok) throw new Error("Erreur lors de la création du compte.");
      const data = await response.json();
      setOrgCode(data.organizationCode ?? null);
      if (typeof window !== "undefined") {
        localStorage.setItem("shiftly_token", data.accessToken);
        if (data.refreshToken) localStorage.setItem("shiftly_refresh_token", data.refreshToken);
      }
      setStatus({ type: "success" });
    } catch (err) {
      setStatus({ type: "error", message: err instanceof Error ? err.message : "Une erreur est survenue" });
    }
  };

  const copyCode = () => {
    if (orgCode) {
      navigator.clipboard.writeText(orgCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="bg-blue-600 px-8 py-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Espace Admin</h1>
              <p className="text-xs text-blue-100/80">Créez votre organisation</p>
            </div>
          </div>
        </div>

        <div className="p-7">
          {status.type === "success" ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 size={28} className="text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Bienvenue à bord !</h2>
                <p className="mt-1.5 text-sm text-slate-500">Voici votre code d&apos;organisation — partagez-le avec vos employés.</p>
              </div>

              <button
                onClick={copyCode}
                className="group relative w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-5 py-4 transition-all hover:border-blue-300 hover:bg-white"
              >
                <p className="font-mono text-2xl font-bold tracking-widest text-blue-600">{orgCode}</p>
                <div className="mt-1 flex items-center justify-center gap-1.5 text-xs text-slate-400">
                  <Copy size={12} />
                  {copied ? <span className="text-emerald-600 font-bold">Copié !</span> : "Cliquer pour copier"}
                </div>
              </button>

              <Link
                href="/dashboard"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-gray-200 transition hover:bg-blue-700"
              >
                Accéder au Dashboard <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { icon: User, placeholder: "Votre nom complet", key: "name", type: "text" },
                { icon: Building2, placeholder: "Nom de l'entreprise", key: "orgName", type: "text" },
                { icon: Mail, placeholder: "Email professionnel", key: "email", type: "email" },
                { icon: Lock, placeholder: "Mot de passe sécurisé", key: "password", type: "password" },
              ].map(({ icon: Icon, placeholder, key, type }) => (
                <div key={key} className="relative">
                  <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm outline-none focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-500/15 transition-all"
                    placeholder={placeholder}
                    type={type}
                    required
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                </div>
              ))}

              {status.type === "error" && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-3 text-sm text-rose-700">
                  <AlertCircle size={15} className="shrink-0" /> {status.message}
                </div>
              )}

              <button
                type="submit"
                disabled={status.type === "loading"}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-gray-200 transition hover:bg-blue-700 disabled:opacity-60"
              >
                {status.type === "loading" ? (
                  <><Loader2 size={16} className="animate-spin" /> Configuration...</>
                ) : "Lancer mon organisation"}
              </button>

              <p className="text-center text-xs text-slate-400">
                Déjà membre ?{" "}
                <Link href="/login" className="font-bold text-blue-600 hover:text-blue-700">Connexion</Link>
              </p>
            </form>
          )}
        </div>

        <div className="border-t border-slate-100 px-7 py-4">
          <Link href="/signup" className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-slate-600">
            <ArrowLeft size={13} /> Retour
          </Link>
        </div>
      </div>
    </div>
  );
}
