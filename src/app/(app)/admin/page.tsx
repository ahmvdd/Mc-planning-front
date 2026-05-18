"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { apiFetchClient, getToken } from "@/lib/clientApi";
import {
  Building2, KeyRound, CalendarDays, Upload, Users, Send,
  Check, AlertCircle, FileSpreadsheet, Loader2, X, Settings, Mail, Trash2, Clock
} from "lucide-react";

type ImportResult = {
  total: number;
  invited: number;
  errors: { email: string; reason: string }[];
};

type PendingInvitation = {
  id: number;
  email: string;
  createdAt: string;
  expiresAt: string;
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

  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);

  const loadInvitations = async () => {
    const data = await apiFetchClient<PendingInvitation[]>("/invitations").catch(() => []);
    setPendingInvitations(data);
  };

  const cancelInvitation = async (id: number) => {
    if (!confirm("Annuler cette invitation ?")) return;
    await apiFetchClient(`/invitations/${id}`, { method: "DELETE" }).catch(() => null);
    setPendingInvitations(prev => prev.filter(i => i.id !== id));
  };

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
      await loadInvitations();
      setTimeout(() => setInviteStatus("idle"), 4000);
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Erreur lors de l'envoi");
      setInviteStatus("error");
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
          await loadInvitations();
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
      <Loader2 className="animate-spin text-zinc-500" size={28} />
    </div>
  );

  const inputClass = "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all";

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Espace Admin</h1>
          <p className="text-sm text-zinc-500">Gérez l&apos;organisation, les accès et les plannings</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-4 py-2">
          <Settings size={13} className="text-blue-400" />
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Administration</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">
          <AlertCircle size={16} className="shrink-0 text-rose-400" />
          <p className="text-sm font-medium text-rose-400">{error}</p>
          <Link href="/login" className="ml-auto rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-500 transition">Se connecter</Link>
        </div>
      )}

      {!error && (
        <div className="grid gap-8 lg:grid-cols-2">

          {/* Organisation */}
          <section className="space-y-4">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
              <Building2 size={13} /> Informations de l&apos;entreprise
            </h3>
            <form onSubmit={handleUpdateOrganization} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Nom de l&apos;entreprise</label>
                <input className={inputClass} placeholder="Nom de l'entreprise" value={orgName} onChange={e => setOrgName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Logo</label>
                <div
                  className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900 py-8 transition hover:border-blue-500/50 hover:bg-zinc-800"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {logoPreview ? (
                    <div className="flex flex-col items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logoPreview} alt="Logo" className="h-14 w-14 rounded-xl object-cover" />
                      <p className="text-xs text-zinc-500">Cliquer pour changer</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <Upload size={18} className="text-zinc-600" />
                      <p className="text-sm font-medium text-zinc-500">Importer un logo</p>
                      <p className="text-xs text-zinc-600">PNG, JPG</p>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" onChange={handleLogoChange} className="hidden" />
                </div>
              </div>
              <button
                type="submit" disabled={updating}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-60 transition-all"
              >
                {updating ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                {updating ? "Enregistrement..." : "Enregistrer"}
              </button>
            </form>
          </section>

          <div className="space-y-8">

            {/* Inviter */}
            <section className="space-y-4">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
                <Users size={13} /> Inviter un employé
              </h3>
              <p className="text-xs text-zinc-500">L&apos;employé recevra un email avec un lien pour créer son compte.</p>
              <form onSubmit={sendInvite} className="space-y-3">
                <input
                  type="email" required placeholder="Email de l'employé"
                  value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                  className={inputClass}
                />
                {inviteStatus === "error" && (
                  <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3.5 py-2.5 text-xs font-bold text-rose-400">
                    <AlertCircle size={12} /> {inviteError}
                  </div>
                )}
                {inviteStatus === "success" && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-bold text-emerald-400">
                    <Check size={12} /> Invitation envoyée !
                  </div>
                )}
                <button
                  type="submit" disabled={inviteStatus === "loading"}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-500 transition disabled:opacity-60"
                >
                  <Send size={13} />
                  {inviteStatus === "loading" ? "Envoi..." : "Envoyer l'invitation"}
                </button>
              </form>
            </section>

            {/* Invitations en attente */}
            {pendingInvitations.length > 0 && (
              <section className="space-y-3">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
                  <Clock size={13} className="text-amber-400" /> Invitations en attente
                  <span className="rounded-full bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">{pendingInvitations.length}</span>
                </h3>
                <div className="rounded-xl border border-zinc-800 overflow-hidden">
                  {pendingInvitations.map((inv, i, arr) => (
                    <div key={inv.id} className={`flex items-center justify-between gap-3 px-4 py-3.5 ${i < arr.length - 1 ? "border-b border-zinc-800" : ""}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <Mail size={12} className="shrink-0 text-zinc-500" />
                        <span className="truncate text-sm text-zinc-300">{inv.email}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[11px] text-zinc-600 hidden sm:block">
                          Expire le {new Date(inv.expiresAt).toLocaleDateString("fr-FR")}
                        </span>
                        <button onClick={() => cancelInvitation(inv.id)} className="text-zinc-600 transition hover:text-rose-400">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Import CSV */}
            <section className="space-y-4">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
                <FileSpreadsheet size={13} /> Importer des employés
              </h3>
              <p className="text-xs text-zinc-500">
                CSV ou Excel — colonnes : <span className="font-mono font-bold text-zinc-300">email</span>, name (optionnel).
              </p>
              <form onSubmit={handleImport} className="space-y-3">
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900 py-6 transition hover:border-emerald-500/50 hover:bg-zinc-800">
                  {importFile ? (
                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
                      <FileSpreadsheet size={15} /> {importFile.name}
                      <button type="button" onClick={e => { e.preventDefault(); setImportFile(null); if (importInputRef.current) importInputRef.current.value = ""; }} className="text-zinc-500 hover:text-rose-400">
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <Upload size={18} className="text-zinc-600" />
                      <span className="text-xs font-bold uppercase text-zinc-500">Choisir un fichier</span>
                      <span className="text-[11px] text-zinc-600">.csv, .xlsx, .xls</span>
                    </div>
                  )}
                  <input ref={importInputRef} type="file" accept=".csv,.xlsx,.xls,text/csv" className="hidden" onChange={e => setImportFile(e.target.files?.[0] ?? null)} />
                </label>
                <button
                  type="submit" disabled={!importFile || importStatus === "loading"}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 transition disabled:opacity-40"
                >
                  {importStatus === "loading" ? <><Loader2 size={13} className="animate-spin" /> Import en cours...</> : <><Send size={13} /> Lancer l&apos;import</>}
                </button>
              </form>
              {importStatus === "done" && importResult && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs font-bold text-emerald-400">
                  <Check size={12} className="mr-1 inline" />
                  {importResult.invited} invitation{importResult.invited !== 1 ? "s" : ""} envoyée{importResult.invited !== 1 ? "s" : ""} sur {importResult.total}
                  {importResult.errors.length > 0 && (
                    <div className="mt-2 space-y-1 font-normal text-rose-400">
                      {importResult.errors.map((err, i) => <p key={i}>{err.email} — {err.reason}</p>)}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Reset password */}
            <section className="space-y-4">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
                <KeyRound size={13} /> Réinitialiser un mot de passe
              </h3>
              <form className="space-y-3" onSubmit={e => e.preventDefault()}>
                <input className={inputClass} placeholder="Email de l'employé" type="email" />
                <input className={inputClass} placeholder="Nouveau mot de passe" type="password" />
                <button className="w-full rounded-xl bg-zinc-800 py-2.5 text-sm font-bold text-white hover:bg-blue-600 transition-colors">
                  Mettre à jour
                </button>
              </form>
            </section>

            {/* Publier planning */}
            <section className="space-y-4">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
                <CalendarDays size={13} /> Publier le planning
              </h3>
              <p className="text-xs text-zinc-500">Informez les employés des nouveaux horaires.</p>
              <form className="space-y-3" onSubmit={e => e.preventDefault()}>
                <input className={inputClass} type="date" />
                <textarea className={`${inputClass} resize-none`} placeholder="Message aux équipes" rows={2} />
                <button className="w-full rounded-xl bg-zinc-800 py-2.5 text-sm font-bold text-white hover:bg-blue-600 transition-colors">
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
