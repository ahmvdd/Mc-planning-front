"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetchClient, getToken } from "@/lib/clientApi";
import { User, KeyRound, Check, Loader2, AlertCircle } from "lucide-react";

type Me = { sub: number; name?: string; email?: string; role?: string };
type EmployeeData = { id: number; name: string; email: string; role: string };

export default function ProfilePage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    apiFetchClient<Me>("/auth/me")
      .then(async (data) => {
        setMe(data);
        if (data.sub) {
          const emp = await apiFetchClient<EmployeeData>(`/employees/${data.sub}`).catch(() => null);
          if (emp) setName(emp.name);
        }
      })
      .catch(() => router.push("/login"));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password && password !== confirm) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    setSaving(true);
    try {
      await apiFetchClient("/employees/me", {
        method: "PATCH",
        body: JSON.stringify({
          name: name || undefined,
          password: password || undefined,
        }),
      });
      setSuccess(true);
      setPassword("");
      setConfirm("");
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  if (!me) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-indigo-600" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="mx-auto max-w-xl px-6 py-4">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mon profil</h1>
          <p className="text-sm text-slate-500">Modifiez vos informations personnelles</p>
        </div>
      </div>

      <main className="mx-auto max-w-xl px-6 py-8 space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-200 text-2xl font-extrabold text-indigo-600">
            {name.charAt(0).toUpperCase() || "?"}
          </div>
          <div>
            <p className="font-bold text-slate-900 text-lg">{name || "—"}</p>
            <p className="text-sm text-slate-400">{me.email}</p>
            <span className="mt-1 inline-block rounded-full bg-indigo-50 px-3 py-0.5 text-xs font-bold text-indigo-700 uppercase">
              {me.role}
            </span>
          </div>
        </div>

        {/* Formulaire */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1.5">
                <User size={12} /> Nom complet
              </label>
              <input
                className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div className="border-t border-slate-100 pt-5 space-y-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                <KeyRound size={12} /> Changer le mot de passe
              </p>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Nouveau mot de passe</label>
                <input
                  type="password"
                  className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  placeholder="Laisser vide pour ne pas changer"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Confirmer</label>
                <input
                  type="password"
                  className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  placeholder="Confirmer le nouveau mot de passe"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-100 px-4 py-2.5 text-sm font-medium text-rose-700">
                <AlertCircle size={15} /> {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-2.5 text-sm font-medium text-emerald-700">
                <Check size={15} /> Profil mis à jour !
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition-all flex justify-center items-center gap-2"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
