"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2, AlertCircle } from "lucide-react";

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
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-md"
    >
      <div className="overflow-hidden rounded-[28px] border border-white/8 bg-[#0a0a0a] shadow-2xl shadow-black/60">

        {/* Header */}
        <div className="px-8 py-7 border-b border-white/5">
          <span className="text-sm font-bold tracking-tight text-white">Shiftly</span>
          <h2 className="mt-6 text-2xl font-bold tracking-tight text-white mb-1.5">Content de vous revoir</h2>
          <p className="text-sm text-white/30">Entrez vos identifiants pour continuer</p>
        </div>

        <div className="p-7">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
              <input
                className="w-full rounded-xl border border-white/8 bg-white/[0.04] pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-blue-500/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-blue-500/10 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="nom@entreprise.com"
                required
              />
            </div>

            <div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                <input
                  className="w-full rounded-xl border border-white/8 bg-white/[0.04] pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-blue-500/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-blue-500/10 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="Mot de passe"
                  required
                />
              </div>
              <div className="flex justify-end mt-1.5">
                <a href="#" className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors">Oublié ?</a>
              </div>
            </div>

            {error && (
              <div className={`flex items-start gap-2 rounded-xl border px-3.5 py-3 text-sm ${
                error.startsWith("Serveur en démarrage")
                  ? "border-amber-500/20 bg-amber-500/5 text-amber-400"
                  : "border-red-500/20 bg-red-500/5 text-red-400"
              }`}>
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white transition-all hover:bg-blue-500 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 size={15} className="animate-spin" /> Connexion...</>
              ) : (
                <>Se connecter <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" /></>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-white/25">
            Pas encore de compte ?{" "}
            <Link href="/signup" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
              S&apos;inscrire
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
