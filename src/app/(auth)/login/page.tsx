"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion"; // Installe framer-motion si possible

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001/api"}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      if (!response.ok) {
        throw new Error("Identifiants invalides");
      }

      const data = (await response.json()) as { accessToken: string; refreshToken?: string };
      localStorage.setItem("shiftly_token", data.accessToken);
      if (data.refreshToken) localStorage.setItem("shiftly_refresh_token", data.refreshToken);
      window.dispatchEvent(new Event("shiftly:login"));
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[600px] w-full max-w-5xl relative overflow-hidden rounded-[40px] border border-slate-200/60 bg-white/20 backdrop-blur-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] md:flex">
      
      {/* Côté Gauche : Visuel & Branding */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-gradient-to-br from-indigo-600 to-violet-700 p-12 text-white md:flex">
        <div className="relative z-10">
          <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-xl">
            S
          </div>
        </div>
        
        <div className="relative z-10 space-y-6">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold leading-tight"
          >
            Le pilotage <br /> <span className="text-indigo-200">réinventé.</span>
          </motion.h1>
          <p className="text-indigo-100/80 text-lg">
            Gérez vos équipes et vos plannings avec une interface pensée pour la performance.
          </p>
        </div>

        {/* Décorations abstraites */}
        <div className="absolute top-0 right-0 h-full w-full overflow-hidden">
          <div className="absolute -top-10 -right-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-20 -left-10 h-40 w-40 rounded-full bg-indigo-400/20 blur-2xl" />
        </div>
      </div>

      {/* Côté Droit : Formulaire */}
      <div className="flex flex-1 flex-col justify-center p-8 md:p-16 bg-white">
        <div className="mx-auto w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Content de vous revoir</h2>
            <p className="text-slate-500">Entrez vos accès pour continuer</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Email Professionnel</label>
              <input
                className="block w-full rounded-2xl border-0 bg-slate-100 px-4 py-4 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="nom@entreprise.com"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Mot de passe</label>
                <a href="#" className="text-xs font-semibold text-indigo-600 hover:text-indigo-500">Oublié ?</a>
              </div>
              <input
                className="block w-full rounded-2xl border-0 bg-slate-100 px-4 py-4 text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              disabled={loading}
              className="relative group w-full overflow-hidden rounded-2xl bg-slate-900 px-4 py-4 text-sm font-semibold text-white shadow-2xl transition-all hover:bg-slate-800 active:scale-[0.98]"
            >
              <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">
                <div className="relative h-full w-8 bg-white/20" />
              </div>
              <span className="relative">{loading ? "Authentification..." : "Se connecter"}</span>
            </button>
          </form>

          <div className="pt-4 text-center">
            <p className="text-sm text-slate-500">
              Pas encore de compte ? <span className="font-semibold text-indigo-600 cursor-pointer">Contactez l'admin</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}