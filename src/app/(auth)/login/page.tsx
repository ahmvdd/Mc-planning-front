"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, Hash, Clock, ArrowLeft } from "lucide-react";

function JoinWithCodeForm({ onCancel }: { onCancel: () => void }) {
  const [orgCode, setOrgCode] = useState("");
  const [joinEmail, setJoinEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3000/api"}/auth/join-request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: joinEmail, orgCode: orgCode.toUpperCase().trim() }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message || "Erreur lors de l'envoi");
      }
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Une erreur est survenue");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="space-y-3 text-center py-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
          <Clock size={22} className="text-amber-400" />
        </div>
        <h3 className="text-base font-bold text-white">Demande envoyée !</h3>
        <p className="text-xs text-white/40">Un administrateur doit valider votre compte avant que vous puissiez vous connecter.</p>
        <button type="button" onClick={onCancel} className="text-xs font-semibold text-[#B4FF39] hover:text-[#a3ec2e] transition-colors">
          Retour à la connexion
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <Hash size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
        <input
          className="w-full rounded-xl border border-white/8 bg-white/[0.04] pl-10 pr-4 py-3 text-sm font-mono uppercase text-white placeholder:text-white/25 placeholder:font-sans placeholder:normal-case outline-none focus:border-[#B4FF39]/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-[#B4FF39]/10 transition-all"
          value={orgCode}
          onChange={(e) => setOrgCode(e.target.value)}
          placeholder="Code de l'organisation"
          required
        />
      </div>
      <div className="relative">
        <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
        <input
          className="w-full rounded-xl border border-white/8 bg-white/[0.04] pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#B4FF39]/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-[#B4FF39]/10 transition-all"
          value={joinEmail}
          onChange={(e) => setJoinEmail(e.target.value)}
          type="email"
          placeholder="Votre email"
          required
        />
      </div>

      {status === "error" && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-3.5 py-3 text-sm text-red-400">
          <AlertCircle size={14} className="mt-0.5 shrink-0" /> {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#B4FF39] py-3.5 text-sm font-bold text-black transition-all hover:bg-[#a3ec2e] active:scale-[0.98] disabled:opacity-50"
      >
        {status === "loading" ? (
          <><Loader2 size={15} className="animate-spin" /> Envoi...</>
        ) : (
          <>Envoyer la demande <ArrowRight size={15} /></>
        )}
      </button>

      <button type="button" onClick={onCancel} className="flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-white/30 hover:text-white transition-colors">
        <ArrowLeft size={12} /> Retour à la connexion
      </button>
    </form>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showJoin, setShowJoin] = useState(searchParams.get("join") === "1");

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

        if (!response.ok) {
          const body = await response.json().catch(() => ({})) as { message?: string };
          throw new Error(body.message || "Identifiants invalides");
        }

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
          <h2 className="text-2xl font-bold tracking-tight text-white mb-1.5">
            {showJoin ? "Rejoindre une équipe" : "Content de vous revoir"}
          </h2>
          <p className="text-sm text-white/30">
            {showJoin ? "Entrez le code fourni par votre responsable" : "Entrez vos identifiants pour continuer"}
          </p>
        </div>

        <div className="p-7">
          {showJoin ? (
            <JoinWithCodeForm onCancel={() => setShowJoin(false)} />
          ) : (
          <>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
              <input
                className="w-full rounded-xl border border-white/8 bg-white/[0.04] pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#B4FF39]/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-[#B4FF39]/10 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="off"
                placeholder="nom@entreprise.com"
                required
              />
            </div>

            <div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                <input
                  className="w-full rounded-xl border border-white/8 bg-white/[0.04] pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#B4FF39]/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-[#B4FF39]/10 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  autoComplete="new-password"
                  placeholder="Mot de passe"
                  required
                />
              </div>
              <div className="flex justify-end mt-1.5">
                <a href="#" className="text-xs font-medium text-[#B4FF39] hover:text-[#a3ec2e] transition-colors">Oublié ?</a>
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
              className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#B4FF39] py-3.5 text-sm font-bold text-black transition-all hover:bg-[#a3ec2e] active:scale-[0.98] disabled:opacity-50"
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
            <Link href="/signup" className="font-semibold text-[#B4FF39] hover:text-[#a3ec2e] transition-colors">
              S&apos;inscrire
            </Link>
          </p>
          <p className="mt-2 text-center text-xs text-white/25">
            Vous rejoignez une équipe ?{" "}
            <button type="button" onClick={() => setShowJoin(true)} className="font-semibold text-[#B4FF39] hover:text-[#a3ec2e] transition-colors">
              Rejoindre avec un code
            </button>
          </p>
          </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
