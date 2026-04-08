"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { User, Lock, Loader2, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3000/api";

type InviteInfo = { email: string; organizationName: string; valid: boolean };

export default function InvitationPage() {
  const router = useRouter();
  const { token } = useParams<{ token: string }>();

  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [validating, setValidating] = useState(true);
  const [invalidMsg, setInvalidMsg] = useState("");

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch(`${API}/invitations/validate/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) setInfo(data);
        else setInvalidMsg(data.message ?? "Lien invalide");
      })
      .catch(() => setInvalidMsg("Lien invalide ou expiré"))
      .finally(() => setValidating(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch(`${API}/invitations/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message || "Erreur lors de la création");
      }
      setStatus("success");
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Une erreur est survenue");
      setStatus("error");
    }
  };

  if (validating) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-500" size={36} />
    </div>
  );

  if (invalidMsg) return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-[2.5rem] border border-rose-100 bg-white p-10 text-center shadow-xl space-y-4">
        <div className="mx-auto w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center">
          <AlertCircle size={32} className="text-rose-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Lien invalide</h2>
        <p className="text-slate-500 text-sm">{invalidMsg}</p>
        <p className="text-xs text-slate-400">Demandez un nouvel email d&apos;invitation à votre responsable.</p>
      </div>
    </div>
  );

  if (status === "success") return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-[2.5rem] border border-emerald-100 bg-white p-10 text-center shadow-xl space-y-4">
        <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
          <CheckCircle2 size={36} className="text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Compte créé !</h2>
        <p className="text-slate-500 text-sm">Redirection vers la connexion...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">

        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl shadow-gray-900/10">
            <User size={30} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Créer votre compte</h1>
          <p className="text-slate-500 text-sm">
            Invitation pour <span className="font-bold text-blue-600">{info?.email}</span>
            {" "}— {info?.organizationName}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[2.5rem] border border-slate-200/60 bg-white p-8 shadow-2xl shadow-gray-200 space-y-5"
        >
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
            <span className="font-semibold text-slate-700">Email :</span> {info?.email}
          </div>

          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-11 pr-4 py-3.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder="Votre nom complet"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="password"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-11 pr-4 py-3.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder="Choisir un mot de passe"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {status === "error" && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-600 border border-rose-100">
              <AlertCircle size={14} /> {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 text-sm font-bold text-white shadow-xl hover:bg-blue-600 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {status === "loading"
              ? <><Loader2 className="animate-spin" size={18} /> Création...</>
              : <>Rejoindre l&apos;équipe <ArrowRight size={18} /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
