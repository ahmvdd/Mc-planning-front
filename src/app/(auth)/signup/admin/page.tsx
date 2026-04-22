"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck, Building2, Mail, Lock, User,
  Loader2, CheckCircle2, ArrowRight, Copy, AlertCircle,
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

  const fields = [
    { icon: User,      placeholder: "Votre nom complet",     key: "name",     type: "text" },
    { icon: Building2, placeholder: "Nom de l'entreprise",   key: "orgName",  type: "text" },
    { icon: Mail,      placeholder: "Email professionnel",   key: "email",    type: "email" },
    { icon: Lock,      placeholder: "Mot de passe sécurisé", key: "password", type: "password" },
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-md"
    >
      <div className="overflow-hidden rounded-[28px] border border-white/8 bg-[#0a0a0a] shadow-2xl shadow-black/60">

        {/* Header */}
        <div className="px-8 py-7 border-b border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/20">
              <ShieldCheck size={17} className="text-blue-400" />
            </div>
            <span className="text-sm font-bold tracking-tight text-white">Shiftly</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1.5">Créer un espace</h1>
          <p className="text-sm text-white/30">Configurez votre organisation en 30 secondes.</p>
        </div>

        <div className="p-7">
          {status.type === "success" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-5 text-center"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 size={26} className="text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Bienvenue à bord !</h2>
                <p className="mt-1.5 text-sm text-white/40">Partagez ce code avec vos employés pour qu&apos;ils rejoignent votre espace.</p>
              </div>

              <button
                onClick={copyCode}
                className="group w-full rounded-2xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] hover:border-blue-500/30 px-5 py-4 transition-all"
              >
                <p className="font-mono text-2xl font-bold tracking-widest text-blue-400">{orgCode}</p>
                <div className="mt-1.5 flex items-center justify-center gap-1.5 text-xs text-white/25">
                  <Copy size={11} />
                  {copied ? <span className="text-emerald-400 font-semibold">Copié !</span> : "Cliquer pour copier"}
                </div>
              </button>

              <Link
                href="/dashboard"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white transition hover:bg-blue-500"
              >
                Accéder au Dashboard <ArrowRight size={15} />
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {fields.map(({ icon: Icon, placeholder, key, type }) => (
                <div key={key} className="relative">
                  <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                  <input
                    className="w-full rounded-xl border border-white/8 bg-white/[0.04] pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-blue-500/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-blue-500/10 transition-all"
                    placeholder={placeholder}
                    type={type}
                    required
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                </div>
              ))}

              {status.type === "error" && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-3.5 py-3 text-sm text-red-400">
                  <AlertCircle size={14} className="shrink-0" /> {status.message}
                </div>
              )}

              <button
                type="submit"
                disabled={status.type === "loading"}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-50 active:scale-[0.98]"
              >
                {status.type === "loading" ? (
                  <><Loader2 size={15} className="animate-spin" /> Configuration...</>
                ) : (
                  <>Lancer mon organisation <ArrowRight size={15} /></>
                )}
              </button>

              <p className="text-center text-xs text-white/25 pt-1">
                Déjà membre ?{" "}
                <Link href="/login" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                  Connexion
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </motion.div>
  );
}
