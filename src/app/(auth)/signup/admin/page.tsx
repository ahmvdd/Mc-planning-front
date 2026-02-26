"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  Building2, 
  Mail, 
  Lock, 
  User, 
  Loader2, 
  CheckCircle2, 
  ArrowRight,
  Copy,
  AlertCircle
} from "lucide-react";

export default function AdminSignupPage() {
  const [form, setForm] = useState({ name: "", orgName: "", email: "", password: "" });
  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error', message?: string }>({ type: 'idle' });
  const [orgCode, setOrgCode] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ type: 'loading' });

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
      setStatus({ type: 'success' });
    } catch (err) {
      setStatus({ type: 'error', message: err instanceof Error ? err.message : "Une erreur est survenue" });
    }
  };

  const copyCode = () => {
    if (orgCode) {
      navigator.clipboard.writeText(orgCode);
      alert("Code copié !");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-200 rotate-3 transition-transform hover:rotate-0">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Admin Console</h1>
          <p className="text-slate-500 font-medium">Créez votre espace de travail en quelques secondes.</p>
        </div>

        {status.type === 'success' ? (
          /* Success View */
          <div className="rounded-[2.5rem] border border-emerald-100 bg-white p-8 shadow-2xl shadow-emerald-500/10 animate-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Bienvenue à bord !</h2>
              <p className="text-slate-500 text-sm">Votre compte administrateur est prêt. Voici votre code d'organisation unique :</p>
              
              <div 
                onClick={copyCode}
                className="group relative w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-4 cursor-pointer hover:border-indigo-300 hover:bg-white transition-all"
              >
                <span className="text-2xl font-mono font-black tracking-widest text-indigo-600">{orgCode}</span>
                <Copy size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-500" />
              </div>

              <Link 
                href="/dashboard" 
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 text-sm font-bold text-white hover:bg-indigo-600 transition-all shadow-lg"
              >
                Accéder au Dashboard <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        ) : (
          /* Signup Form */
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
                  onChange={(e) => setForm({...form, name: e.target.value})}
                />
              </div>

              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-11 pr-4 py-3.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  placeholder="Nom de l'entreprise"
                  required
                  value={form.orgName}
                  onChange={(e) => setForm({...form, orgName: e.target.value})}
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-11 pr-4 py-3.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  placeholder="Email professionnel"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-11 pr-4 py-3.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  placeholder="Mot de passe sécurisé"
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({...form, password: e.target.value})}
                />
              </div>
            </div>

            {status.type === 'error' && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-600 border border-rose-100">
                <AlertCircle size={14} /> {status.message}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-2xl bg-slate-900 py-4 text-sm font-bold text-white shadow-xl shadow-slate-900/10 transition-all hover:bg-indigo-600 hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0 flex justify-center items-center gap-2"
              disabled={status.type === 'loading'}
            >
              {status.type === 'loading' ? (
                <> <Loader2 className="animate-spin" size={18} /> Configuration de l'espace... </>
              ) : "Lancer mon organisation"}
            </button>

            <p className="text-center text-sm text-slate-400 pt-2">
              Déjà membre ?{" "}
              <Link href="/login" className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors">
                Connectez-vous
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}