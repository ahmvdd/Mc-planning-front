"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { apiFetchClient, getToken } from "@/lib/clientApi";
import { Building2, KeyRound, CalendarDays, Upload, Users, Send, Check, AlertCircle, FileSpreadsheet, Loader2, X } from "lucide-react";

type ImportResult = {
  total: number;
  invited: number;
  errors: { email: string; reason: string }[];
};

export default function AdminPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [orgName, setOrgName] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [updating, setUpdating] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [inviteError, setInviteError] = useState("");

  // Import CSV/Excel
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;
    setImportStatus("loading");
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      const token = getToken();
      const API = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001/api";
      const res = await fetch(`${API}/employees/import`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data: ImportResult = await res.json();
      setImportResult(data);
      setImportStatus("done");
      setImportFile(null);
      if (importInputRef.current) importInputRef.current.value = "";
    } catch {
      setImportStatus("error");
    }
  };

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteStatus("loading");
    setInviteError("");
    try {
      await apiFetchClient("/invitations/send", {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail }),
      });
      setInviteStatus("success");
      setInviteEmail("");
      setTimeout(() => setInviteStatus("idle"), 4000);
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Erreur lors de l'envoi");
      setInviteStatus("error");
    }
  };

  useEffect(() => {
    if (!getToken()) {
      setError("Connexion requise");
      router.push("/login");
      setLoading(false);
      return;
    }

    apiFetchClient<{ role?: string }>("/auth/me")
      .then(async (me) => {
        if (me?.role !== "admin") {
          setError("Accès réservé aux admins");
          router.push("/dashboard");
        } else {
          const org = await apiFetchClient<{ name: string }>("/admin/organization").catch(() => null);
          setOrgName(org?.name || "");
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
        method: "PATCH",
        body: JSON.stringify({ name: orgName }),
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
          {/* Inviter un employé par email */}
          <div className="rounded-3xl border border-indigo-100 bg-indigo-50/50 p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-indigo-900">
              <Users size={18} className="text-indigo-500" /> Inviter un employé
            </h2>
            <p className="mt-1 text-xs text-indigo-600">L&apos;employé recevra un email avec un lien pour créer son compte.</p>

            <form onSubmit={sendInvite} className="mt-4 space-y-3">
              <input
                type="email"
                required
                placeholder="Email de l'employé"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full rounded-2xl border border-indigo-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
              {inviteStatus === "error" && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 border border-rose-100">
                  <AlertCircle size={13} /> {inviteError}
                </div>
              )}
              {inviteStatus === "success" && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-600 border border-emerald-100">
                  <Check size={13} /> Invitation envoyée !
                </div>
              )}
              <button
                type="submit"
                disabled={inviteStatus === "loading"}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                <Send size={15} />
                {inviteStatus === "loading" ? "Envoi..." : "Envoyer l'invitation"}
              </button>
            </form>
          </div>

          {/* Import CSV / Excel */}
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-emerald-900">
              <FileSpreadsheet size={18} className="text-emerald-500" /> Importer des employés
            </h2>
            <p className="mt-1 text-xs text-emerald-700">
              CSV ou Excel — colonnes attendues : <strong>email</strong>, name (optionnel).<br/>
              Chaque personne recevra un email d'invitation pour créer son compte.
            </p>

            <form onSubmit={handleImport} className="mt-4 space-y-3">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-200 bg-white py-6 hover:bg-emerald-50 hover:border-emerald-400 transition-all">
                {importFile ? (
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                    <FileSpreadsheet size={18} />
                    {importFile.name}
                    <button
                      type="button"
                      onClick={e => { e.preventDefault(); setImportFile(null); if (importInputRef.current) importInputRef.current.value = ""; }}
                      className="ml-1 text-slate-400 hover:text-rose-500"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload size={20} className="mb-1 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-600 uppercase">Choisir un fichier</span>
                    <span className="text-[11px] text-emerald-500 mt-0.5">.csv, .xlsx, .xls</span>
                  </>
                )}
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={e => setImportFile(e.target.files?.[0] ?? null)}
                />
              </label>

              <button
                type="submit"
                disabled={!importFile || importStatus === "loading"}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-all disabled:opacity-40"
              >
                {importStatus === "loading"
                  ? <><Loader2 size={15} className="animate-spin" /> Import en cours...</>
                  : <><Send size={15} /> Lancer l'import</>}
              </button>
            </form>

            {/* Résultats */}
            {importStatus === "done" && importResult && (
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 rounded-xl bg-emerald-100 px-4 py-2.5 font-bold text-emerald-700">
                  <Check size={15} /> {importResult.invited} invitation{importResult.invited !== 1 ? "s" : ""} envoyée{importResult.invited !== 1 ? "s" : ""} sur {importResult.total}
                </div>
                {importResult.errors.length > 0 && (
                  <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 space-y-1">
                    <p className="text-xs font-bold text-rose-600 flex items-center gap-1"><AlertCircle size={13} /> {importResult.errors.length} erreur{importResult.errors.length > 1 ? "s" : ""}</p>
                    {importResult.errors.map((err, i) => (
                      <p key={i} className="text-xs text-rose-500">{err.email} — {err.reason}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
            {importStatus === "error" && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 border border-rose-100">
                <AlertCircle size={13} /> Erreur lors de l'import, réessayez.
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

