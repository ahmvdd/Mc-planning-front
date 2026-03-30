"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, Calendar, Users, BarChart3 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001/api";
    fetch(API).catch(() => {});
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const API = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001/api";
    const MAX_RETRIES = 5;
    const RETRY_DELAY_MS = 4000;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(`${API}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) throw new Error("Identifiants invalides");

        const data = (await response.json()) as { accessToken: string; refreshToken?: string };
        localStorage.setItem("shiftly_token", data.accessToken);
        if (data.refreshToken) localStorage.setItem("shiftly_refresh_token", data.refreshToken);
        window.dispatchEvent(new Event("shiftly:login"));
        router.push("/dashboard");
        return;
      } catch (err) {
        const isNetworkError = err instanceof TypeError;
        if (!isNetworkError || attempt === MAX_RETRIES) {
          setError(err instanceof Error ? err.message : "Erreur inconnue");
          break;
        }
        setError(`Serveur en démarrage... (${attempt}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }

    setLoading(false);
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/10 shadow-2xl shadow-black/50 min-h-[560px]">

      {/* Left — Branding */}
      <div className="relative hidden w-[45%] flex-col justify-between bg-gradient-to-br from-indigo-600 to-violet-700 p-10 md:flex overflow-hidden">
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-sm font-black text-white">S</div>
          <span className="text-lg font-black tracking-tighter text-white">Shiftly</span>
        </div>

        <div className="relative z-10 space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-black leading-tight tracking-tight text-white"
          >
            Vos équipes,<br />
            <span className="text-indigo-200">sous contrôle.</span>
          </motion.h1>
          <p className="text-base text-indigo-100/80 leading-relaxed">
            Plannings, demandes, RH — tout au même endroit.
          </p>
          <div className="flex flex-col gap-3 pt-2">
            {[
              { icon: Calendar, text: "Planning en temps réel" },
              { icon: Users, text: "Gestion d'équipe centralisée" },
              { icon: BarChart3, text: "Statistiques & rapports" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5 text-sm text-indigo-100/90">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon size={14} />
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Decorations */}
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-indigo-400/20 blur-2xl" />
      </div>

      {/* Right — Form */}
      <div className="flex flex-1 flex-col justify-center bg-white p-8 sm:p-12">
        <div className="mx-auto w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-black text-white">S</div>
            <span className="text-lg font-black tracking-tighter text-slate-900">Shiftly</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Content de vous revoir</h2>
            <p className="mt-1.5 text-sm text-slate-500">Entrez vos identifiants pour continuer</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="nom@entreprise.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Mot de passe</label>
                <a href="#" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">Oublié ?</a>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm text-slate-900 outline-none focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className={`flex items-start gap-2 rounded-xl border px-3.5 py-3 text-sm ${
                error.startsWith("Serveur en démarrage")
                  ? "border-amber-100 bg-amber-50 text-amber-700"
                  : "border-rose-100 bg-rose-50 text-rose-700"
              }`}>
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Connexion...</>
              ) : (
                <>Se connecter <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" /></>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Pas encore de compte ?{" "}
            <Link href="/signup" className="font-bold text-indigo-600 hover:text-indigo-700">
              S&apos;inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
