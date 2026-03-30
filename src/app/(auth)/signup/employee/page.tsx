"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Mail, Lock, Hash, Loader2, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react";

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
      <div className="space-y-4 text-center py-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 size={28} className="text-emerald-600" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Compte créé !</h2>
        <p className="text-sm text-slate-500">Redirection vers la connexion...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {[
        { icon: User, placeholder: "Votre nom complet", key: "name", type: "text" },
        { icon: Mail, placeholder: "Votre email", key: "email", type: "email" },
        { icon: Lock, placeholder: "Mot de passe (min. 6 car.)", key: "password", type: "password", minLength: 6 },
      ].map(({ icon: Icon, placeholder, key, type, minLength }) => (
        <div key={key} className="relative">
          <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm outline-none focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15 transition-all"
            placeholder={placeholder}
            type={type}
            required
            minLength={minLength}
            value={form[key as keyof typeof form]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          />
        </div>
      ))}

      <div className="relative">
        <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className={`w-full rounded-xl border pl-10 pr-12 py-3 text-sm font-mono uppercase outline-none transition-all ${
            codeFromUrl
              ? "border-indigo-200 bg-indigo-50 text-indigo-700 cursor-not-allowed"
              : "border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
          }`}
          placeholder="Code organisation (ex: AB12CD)"
          required
          readOnly={Boolean(codeFromUrl)}
          value={form.orgCode}
          onChange={(e) => setForm({ ...form, orgCode: e.target.value })}
        />
        {codeFromUrl && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-indigo-500 uppercase tracking-wider bg-indigo-100 px-2 py-0.5 rounded-md">
            Auto
          </span>
        )}
      </div>

      {status === "error" && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-3 text-sm text-rose-700">
          <AlertCircle size={15} className="shrink-0" /> {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-60"
      >
        {status === "loading" ? (
          <><Loader2 size={16} className="animate-spin" /> Création...</>
        ) : (
          <>Rejoindre l&apos;organisation <ArrowRight size={15} /></>
        )}
      </button>

      <p className="text-center text-xs text-slate-400">
        Déjà membre ?{" "}
        <Link href="/login" className="font-bold text-indigo-600 hover:text-indigo-700">Connexion</Link>
      </p>
    </form>
  );
}

export default function EmployeeSignupPage() {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
              <User size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white">Rejoindre l&apos;équipe</h1>
              <p className="text-xs text-slate-400">Entrez le code fourni par votre responsable</p>
            </div>
          </div>
        </div>

        <div className="p-7">
          <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-slate-50" />}>
            <EmployeeSignupForm />
          </Suspense>
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
