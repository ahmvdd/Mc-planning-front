"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { apiFetchClient, getToken } from "@/lib/clientApi";
import {
  Building2, KeyRound, CalendarDays, Upload, Send,
  Check, AlertCircle, FileSpreadsheet, Loader2, X
} from "lucide-react";

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

  useEffect(() => {
    if (!getToken()) { setError("Connexion requise"); router.push("/login"); setLoading(false); return; }
    apiFetchClient<{ role?: string }>("/auth/me")
      .then(async (me) => {
        if (me?.role !== "admin") { setError("Accès réservé aux admins"); router.push("/dashboard"); }
        else {
          const org = await apiFetchClient<{ name: string }>("/admin/organization").catch(() => null);
          setOrgName(org?.name || "");
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setLogoPreview(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await apiFetchClient("/admin/organization", { method: "PATCH", body: JSON.stringify({ name: orgName }) });
      alert("Informations mises à jour avec succès");
      setLogoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de la mise à jour");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="animate-spin text-gray-300 dark:text-white/20" size={28} />
    </div>
  );

  const inputClass = "w-full rounded-xl bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-gray-200 transition-all dark:bg-white/5 dark:text-white dark:placeholder:text-white/25 dark:focus:ring-white/10";

  return (
    <div className="mx-auto max-w-6xl space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Espace Admin</h1>
        <p className="text-sm text-gray-400 mt-1 dark:text-white/30">Gérez l&apos;organisation, les accès et les plannings</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl bg-rose-50 p-4 dark:bg-rose-500/10">
          <AlertCircle size={16} className="shrink-0 text-rose-500" />
          <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>
          <Link href="/login" className="ml-auto rounded-full bg-rose-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-500 transition">Se connecter</Link>
        </div>
      )}

      {!error && (
        <div className="grid gap-5 lg:grid-cols-2">

          {/* Organisation */}
          <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm dark:bg-white/5 dark:shadow-none">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/30">
              <Building2 size={13} /> Informations de l&apos;entreprise
            </h3>
            <form onSubmit={handleUpdateOrganization} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Nom de l&apos;entreprise</label>
                <input className={inputClass} placeholder="Nom de l'entreprise" value={orgName} onChange={e => setOrgName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Logo</label>
                <div
                  className="flex cursor-pointer flex-col items-center justify-center rounded-xl bg-gray-50 py-8 transition hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {logoPreview ? (
                    <div className="flex flex-col items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logoPreview} alt="Logo" className="h-14 w-14 rounded-xl object-cover" />
                      <p className="text-xs text-gray-400 dark:text-white/30">Cliquer pour changer</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <Upload size={18} className="text-gray-300 dark:text-white/20" />
                      <p className="text-sm font-medium text-gray-400 dark:text-white/30">Importer un logo</p>
                      <p className="text-xs text-gray-300 dark:text-white/20">PNG, JPG</p>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" onChange={handleLogoChange} className="hidden" />
                </div>
              </div>
              <button
                type="submit" disabled={updating}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 py-3 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-60 transition-all dark:bg-[#B4FF39] dark:text-black dark:hover:bg-[#a3ec2e]"
              >
                {updating ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                {updating ? "Enregistrement..." : "Enregistrer"}
              </button>
            </form>
          </section>

          <div className="space-y-5">

            {/* Import CSV */}
            <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm dark:bg-white/5 dark:shadow-none">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/30">
                <FileSpreadsheet size={13} /> Importer des employés
              </h3>
              <p className="text-xs text-gray-400 dark:text-white/30">
                CSV ou Excel — colonnes : <span className="font-mono font-bold text-gray-600 dark:text-white/60">email</span>, name (optionnel).
              </p>
              <form onSubmit={handleImport} className="space-y-3">
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl bg-gray-50 py-6 transition hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10">
                  {importFile ? (
                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      <FileSpreadsheet size={15} /> {importFile.name}
                      <button type="button" onClick={e => { e.preventDefault(); setImportFile(null); if (importInputRef.current) importInputRef.current.value = ""; }} className="text-gray-400 hover:text-rose-500 dark:text-white/30">
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <Upload size={18} className="text-gray-300 dark:text-white/20" />
                      <span className="text-xs font-bold uppercase text-gray-400 dark:text-white/30">Choisir un fichier</span>
                      <span className="text-[11px] text-gray-300 dark:text-white/20">.csv, .xlsx, .xls</span>
                    </div>
                  )}
                  <input ref={importInputRef} type="file" accept=".csv,.xlsx,.xls,text/csv" className="hidden" onChange={e => setImportFile(e.target.files?.[0] ?? null)} />
                </label>
                <button
                  type="submit" disabled={!importFile || importStatus === "loading"}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 py-2.5 text-sm font-bold text-white hover:bg-gray-800 transition disabled:opacity-40 dark:bg-[#B4FF39] dark:text-black dark:hover:bg-[#a3ec2e]"
                >
                  {importStatus === "loading" ? <><Loader2 size={13} className="animate-spin" /> Import en cours...</> : <><Send size={13} /> Lancer l&apos;import</>}
                </button>
              </form>
              {importStatus === "done" && importResult && (
                <div className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <Check size={12} className="mr-1 inline" />
                  {importResult.invited} invitation{importResult.invited !== 1 ? "s" : ""} envoyée{importResult.invited !== 1 ? "s" : ""} sur {importResult.total}
                  {importResult.errors.length > 0 && (
                    <div className="mt-2 space-y-1 font-normal text-rose-500">
                      {importResult.errors.map((err, i) => <p key={i}>{err.email} — {err.reason}</p>)}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Reset password */}
            <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm dark:bg-white/5 dark:shadow-none">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/30">
                <KeyRound size={13} /> Réinitialiser un mot de passe
              </h3>
              <form className="space-y-3" onSubmit={e => e.preventDefault()}>
                <input className={inputClass} placeholder="Email de l'employé" type="email" />
                <input className={inputClass} placeholder="Nouveau mot de passe" type="password" />
                <button className="w-full rounded-full bg-gray-100 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/15">
                  Mettre à jour
                </button>
              </form>
            </section>

            {/* Publier planning */}
            <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm dark:bg-white/5 dark:shadow-none">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/30">
                <CalendarDays size={13} /> Publier le planning
              </h3>
              <p className="text-xs text-gray-400 dark:text-white/30">Informez les employés des nouveaux horaires.</p>
              <form className="space-y-3" onSubmit={e => e.preventDefault()}>
                <input className={inputClass} type="date" />
                <textarea className={`${inputClass} resize-none`} placeholder="Message aux équipes" rows={2} />
                <button className="w-full rounded-full bg-gray-100 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/15">
                  Publier
                </button>
              </form>
            </section>

          </div>
        </div>
      )}
    </div>
  );
}
