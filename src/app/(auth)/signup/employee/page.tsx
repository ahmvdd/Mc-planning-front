"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Mail, Lock, Hash, Loader2, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

function EmployeeSignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get("code") ?? "";

  const [form, setForm] = useState({ name: "", email: "", password: "", orgCode: codeFromUrl });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (codeFromUrl) setForm((f) => ({ ...f, orgCode: codeFromUrl }));
  }, [codeFromUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3000/api"}/auth/signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
            orgCode: form.orgCode.toUpperCase().trim(),
            role: "employee",
            status: "active",
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message || "Erreur lors de l'inscription");
      }

      setStatus("success");
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Une erreur est survenue");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-[2.5rem] border border-emerald-100 bg-white p-8 shadow-2xl shadow-emerald-500/10 text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
          <CheckCircle2 size={36} className="text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Compte créé !</h2>
        <p className="text-slate-500 text-sm">Redirection vers la connexion...</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[2.5rem] border border-slate-200/60 bg-white p-8 md:p-10 shadow-2xl shadow-indigo-500/5 space-y-5"
    >
      <div className="space-y-4">
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-11 pr-4 py-3.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
            placeholder="Votre nom complet"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="email"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-11 pr-4 py-3.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
            placeholder="Votre email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="password"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-11 pr-4 py-3.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
            placeholder="Mot de passe"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>

        <div className="relative">
          <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            className={`w-full rounded-2xl border pl-11 pr-4 py-3.5 text-sm font-mono uppercase outline-none transition-all ${
              codeFromUrl
                ? "border-indigo-200 bg-indigo-50 text-indigo-700 cursor-not-allowed"
                : "border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
            }`}
            placeholder="Code organisation (ex: AB12CD)"
            required
            readOnly={Boolean(codeFromUrl)}
            value={form.orgCode}
            onChange={(e) => setForm({ ...form, orgCode: e.target.value })}
          />
          {codeFromUrl && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
              Pré-rempli
            </span>
          )}
        </div>
      </div>

      {status === "error" && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-600 border border-rose-100">
          <AlertCircle size={14} /> {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 text-sm font-bold text-white shadow-xl hover:bg-indigo-600 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {status === "loading" ? (
          <><Loader2 className="animate-spin" size={18} /> Création du compte...</>
        ) : (
          <>Rejoindre l&apos;organisation <ArrowRight size={18} /></>
        )}
      </button>

      <p className="text-center text-sm text-slate-400 pt-2">
        Déjà membre ?{" "}
        <Link href="/login" className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors">
          Connectez-vous
        </Link>
      </p>
    </form>
  );
}

export default function EmployeeSignupPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center shadow-xl shadow-slate-900/20">
            <User size={30} className="text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Rejoindre l&apos;équipe</h1>
          <p className="text-slate-500 font-medium">Entrez le code fourni par votre responsable.</p>
        </div>

        <Suspense fallback={<div className="h-64 rounded-[2.5rem] border border-slate-200 bg-white animate-pulse" />}>
          <EmployeeSignupForm />
        </Suspense>
      </div>
    </div>
  );
}
