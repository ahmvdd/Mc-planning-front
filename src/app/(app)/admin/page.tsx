"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { apiFetchClient, getToken } from "@/lib/clientApi";
import { Building2, KeyRound, CalendarDays, Upload, Users, Copy, Check } from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [orgName, setOrgName] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [updating, setUpdating] = useState(false);
  const [orgCode, setOrgCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const inviteLink = typeof window !== "undefined" && orgCode
    ? `${window.location.origin}/signup/employee?code=${orgCode}`
    : "";

  const copyInviteLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (!getToken()) {
      setError("Connexion requise");
      router.push("/login");
      setLoading(false);
      return;
    }

    Promise.all([
      apiFetchClient<{ role?: string; orgName?: string }>("/auth/me"),
      apiFetchClient<{ code?: string; name?: string }>("/admin/organization"),
    ])
      .then(([me, org]) => {
        if (me?.role !== "admin") {
          setError("Accès réservé aux admins");
          router.push("/dashboard");
        } else {
          setOrgName(me?.orgName || "");
          setOrgCode(org?.code ?? null);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"))
      .finally(() => setLoading(false));
  }, []);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const response = await apiFetchClient("/admin/organization", {
        method: "POST",
        body: JSON.stringify({
          name: orgName || undefined,
          logoUrl: logoPreview || undefined,
        }),
      });

      if (response) {
        alert("Informations mises à jour avec succès");
        setLogoPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de la mise à jour");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-10">
      <header className="rounded-3xl border border-slate-200/60 bg-white p-8 shadow-lg shadow-indigo-500/10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
          Administration
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-slate-900">
          Espace admin
        </h1>
        <p className="mt-3 text-slate-600">
          Réinitialisez les mots de passe, gérez l'accès et publiez le planning.
        </p>
        {error && (
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <p>{error}</p>
            <div className="flex gap-3">
              <Link
                href="/login"
                className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Se connecter
              </Link>
              <Link
                href="/signup"
                className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                S'inscrire
              </Link>
            </div>
          </div>
        )}
      </header>

      {!error && !loading && (
        <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-lg shadow-indigo-500/10">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><Building2 size={18} className="text-indigo-500" />Informations de l'entreprise</h2>
          <form onSubmit={handleUpdateOrganization} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nom de l'entreprise
              </label>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
                placeholder="Nom de l'entreprise"
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Logo
              </label>
              <div
                className="w-full rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center cursor-pointer transition hover:border-indigo-400 hover:bg-indigo-50"
                onClick={() => fileInputRef.current?.click()}
              >
                {logoPreview ? (
                  <div className="space-y-2">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-24 w-24 object-cover rounded mx-auto"
                    />
                    <p className="text-sm text-slate-600">Cliquez pour changer</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload size={20} className="mx-auto text-slate-400" />
                    <p className="text-sm text-slate-600">Cliquez pour importer un logo</p>
                    <p className="text-xs text-slate-500">PNG, JPG jusqu'à 10MB</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={updating}
              className="w-full rounded-2xl bg-indigo-600 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/15 transition hover:-translate-y-0.5 disabled:opacity-50"
            >
              {updating ? "Mise à jour..." : "Mettre à jour"}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          {/* Inviter un employé */}
          <div className="rounded-3xl border border-indigo-100 bg-indigo-50/50 p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-indigo-900">
              <Users size={18} className="text-indigo-500" /> Inviter un employé
            </h2>
            <p className="mt-1 text-xs text-indigo-600">Partagez ce lien ou ce code pour qu'un employé puisse s'inscrire.</p>

            {orgCode && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-white border border-indigo-200 px-4 py-3">
                  <span className="text-xl font-mono font-black tracking-widest text-indigo-600">{orgCode}</span>
                  <span className="text-[10px] font-bold uppercase text-indigo-400">Code org</span>
                </div>
                <button
                  type="button"
                  onClick={copyInviteLink}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-all"
                >
                  {copied ? <><Check size={15} /> Lien copié !</> : <><Copy size={15} /> Copier le lien d'invitation</>}
                </button>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-lg shadow-indigo-500/10">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><KeyRound size={18} className="text-indigo-500" />Réinitialiser un mot de passe</h2>
            <form className="mt-4 space-y-3">
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
                placeholder="Email de l'employé"
                type="email"
              />
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
                placeholder="Nouveau mot de passe"
                type="password"
              />
              <button className="w-full rounded-2xl bg-slate-900 py-2 text-sm font-semibold text-white shadow-md shadow-slate-900/15 transition hover:-translate-y-0.5">
                Mettre à jour
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-lg shadow-indigo-500/10">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><CalendarDays size={18} className="text-indigo-500" />Publier le planning</h2>
            <p className="mt-2 text-sm text-slate-600">
              Informez les employés des nouveaux horaires.
            </p>
            <form className="mt-4 space-y-3">
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
                type="date"
              />
              <textarea
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
                placeholder="Message aux équipes"
                rows={2}
              />
              <button className="w-full rounded-2xl bg-slate-900 py-2 text-sm font-semibold text-white shadow-md shadow-slate-900/15 transition hover:-translate-y-0.5">
                Publier
              </button>
            </form>
          </div>
        </div>
        </section>
      )}
    </div>
  );
}

