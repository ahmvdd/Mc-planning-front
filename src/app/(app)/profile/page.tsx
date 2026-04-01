"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetchClient, getToken } from "@/lib/clientApi";
import { User, KeyRound, Check, Loader2, AlertCircle, Shield } from "lucide-react";

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
    if (password && password !== confirm) { setError("Les mots de passe ne correspondent pas"); return; }
    setSaving(true);
    try {
      await apiFetchClient("/employees/me", {
        method: "PATCH",
        body: JSON.stringify({ name: name || undefined, password: password || undefined }),
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
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
          <Loader2 className="animate-spin text-blue-600" size={28} />
        </div>
        <p className="text-sm font-medium text-slate-500">Chargement du profil...</p>
      </div>
    </div>
  );

  const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-500/15 transition-all";

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mon profil</h1>
        <p className="text-sm text-slate-500">Modifiez vos informations personnelles</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile card */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-100 text-3xl font-bold text-blue-600">
              {name.charAt(0).toUpperCase() || "?"}
            </div>
            <h2 className="text-xl font-bold text-slate-900">{name || "—"}</h2>
            <p className="mt-1 text-sm text-slate-400">{me.email}</p>
            <div className="mt-3 flex justify-center">
              <span className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                <Shield size={10} /> {me.role?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Edit form */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center gap-2.5">
              <User size={15} className="text-blue-500" />
              <h3 className="text-sm font-bold text-slate-700">Modifier mes informations</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 p-6">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Nom complet</label>
                <input className={inputClass} value={name} onChange={e => setName(e.target.value)} required />
              </div>

              {/* Password section */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5 space-y-4">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <KeyRound size={12} /> Changer le mot de passe
                </div>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Nouveau mot de passe</label>
                    <input
                      type="password" className={inputClass}
                      placeholder="Laisser vide pour ne pas changer"
                      value={password} onChange={e => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Confirmer</label>
                    <input
                      type="password" className={inputClass}
                      placeholder="Confirmer le nouveau mot de passe"
                      value={confirm} onChange={e => setConfirm(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  <AlertCircle size={14} className="shrink-0" /> {error}
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  <Check size={14} className="shrink-0" /> Profil mis à jour avec succès !
                </div>
              )}

              <button
                type="submit" disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-md shadow-gray-200 hover:bg-blue-700 disabled:opacity-60 transition-all"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                {saving ? "Enregistrement..." : "Enregistrer les modifications"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
