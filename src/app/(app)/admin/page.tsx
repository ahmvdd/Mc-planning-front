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
          await loadInvitations();
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"))
      .finally(() => setLoading(false));
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
      const response = await apiFetchClient("/admin/organization", {
        method: "PATCH",
        body: JSON.stringify({ name: orgName }),
      });
      if (response) {
        alert("Informations mises à jour avec succès");
        setLogoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de la mise à jour");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
        <p className="text-slate-500 font-medium animate-pulse">Chargement de l'espace admin...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Header sticky */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Espace Admin</h1>
            <p className="text-sm text-slate-500">Gérez l'organisation, les accès et les plannings</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2">
            <Settings size={14} className="text-indigo-500" />
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Administration</span>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {error && (
          <div className="mb-6 rounded-2xl border border-rose-100 bg-rose-50 p-4 flex items-center gap-3">
            <AlertCircle size={18} className="text-rose-500 shrink-0" />
            <p className="text-sm text-rose-700 font-medium">{error}</p>
            <Link href="/login" className="ml-auto rounded-xl bg-rose-600 px-4 py-1.5 text-xs font-bold text-white">
              Se connecter
            </Link>
          </div>
        )}

        {!error && (
          <div className="grid gap-6 lg:grid-cols-2">

            {/* Organisation */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-6">
                <Building2 size={16} /> Informations de l'entreprise
              </h3>
              <form onSubmit={handleUpdateOrganization} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Nom de l'entreprise</label>
                  <input
                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    placeholder="Nom de l'entreprise"
                    value={orgName}
                    onChange={e => setOrgName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Logo</label>
                  <div
                    className="w-full rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center cursor-pointer transition hover:border-indigo-300 hover:bg-indigo-50/30"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {logoPreview ? (
                      <div className="space-y-2">
                        <img src={logoPreview} alt="Logo" className="h-16 w-16 object-cover rounded-xl mx-auto" />
                        <p className="text-xs text-slate-500">Cliquez pour changer</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload size={18} className="mx-auto text-slate-400" />
                        <p className="text-sm text-slate-500">Cliquez pour importer un logo</p>
                        <p className="text-xs text-slate-400">PNG, JPG</p>
                      </div>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" onChange={handleLogoChange} className="hidden" />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={updating}
                  className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition-all flex justify-center items-center gap-2"
                >
                  {updating ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                  {updating ? "Mise à jour..." : "Enregistrer"}
                </button>
              </form>
            </div>

            <div className="space-y-6">
              {/* Inviter un employé */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-4">
                  <Users size={16} /> Inviter un employé
                </h3>
                <p className="text-xs text-slate-500 mb-4">L'employé recevra un email avec un lien pour créer son compte.</p>
                <form onSubmit={sendInvite} className="space-y-3">
                  <input
                    type="email"
                    required
                    placeholder="Email de l'employé"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
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
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-all disabled:opacity-50"
                  >
                    <Send size={14} />
                    {inviteStatus === "loading" ? "Envoi..." : "Envoyer l'invitation"}
                  </button>
                </form>
              </div>

              {/* Invitations en attente */}
              {pendingInvitations.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-4">
                    <Clock size={16} /> Invitations en attente
                    <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-600">{pendingInvitations.length}</span>
                  </h3>
                  <div className="space-y-2">
                    {pendingInvitations.map(inv => (
                      <div key={inv.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <Mail size={13} className="text-slate-400 shrink-0" />
                          <span className="text-sm text-slate-700 truncate">{inv.email}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[11px] text-slate-400">
                            Expire le {new Date(inv.expiresAt).toLocaleDateString("fr-FR")}
                          </span>
                          <button
                            onClick={() => cancelInvitation(inv.id)}
                            className="text-rose-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Import CSV/Excel */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-4">
                  <FileSpreadsheet size={16} /> Importer des employés
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  CSV ou Excel — colonnes : <span className="font-mono font-bold">email</span>, name (optionnel).
                </p>
                <form onSubmit={handleImport} className="space-y-3">
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-5 hover:bg-emerald-50/30 hover:border-emerald-200 transition-all">
                    {importFile ? (
                      <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                        <FileSpreadsheet size={16} />
                        {importFile.name}
                        <button
                          type="button"
                          onClick={e => { e.preventDefault(); setImportFile(null); if (importInputRef.current) importInputRef.current.value = ""; }}
                          className="ml-1 text-slate-400 hover:text-rose-500"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload size={18} className="mb-1 text-slate-400" />
                        <span className="text-xs font-bold text-slate-500 uppercase">Choisir un fichier</span>
                        <span className="text-[11px] text-slate-400 mt-0.5">.csv, .xlsx, .xls</span>
                      </>
                    )}
                    <input
                      ref={importInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls,text/csv"
                      className="hidden"
                      onChange={e => setImportFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={!importFile || importStatus === "loading"}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-all disabled:opacity-40"
                  >
                    {importStatus === "loading"
                      ? <><Loader2 size={14} className="animate-spin" /> Import en cours...</>
                      : <><Send size={14} /> Lancer l'import</>}
                  </button>
                </form>
                {importStatus === "done" && importResult && (
                  <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-xs font-bold text-emerald-700">
                    <Check size={13} className="inline mr-1" />
                    {importResult.invited} invitation{importResult.invited !== 1 ? "s" : ""} envoyée{importResult.invited !== 1 ? "s" : ""} sur {importResult.total}
                    {importResult.errors.length > 0 && (
                      <div className="mt-2 space-y-1 text-rose-600 font-normal">
                        {importResult.errors.map((err, i) => <p key={i}>{err.email} — {err.reason}</p>)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Reset MDP */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-4">
                  <KeyRound size={16} /> Réinitialiser un mot de passe
                </h3>
                <form className="space-y-3">
                  <input
                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    placeholder="Email de l'employé"
                    type="email"
                  />
                  <input
                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    placeholder="Nouveau mot de passe"
                    type="password"
                  />
                  <button className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white hover:bg-black transition-all">
                    Mettre à jour
                  </button>
                </form>
              </div>

              {/* Publier planning */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-2">
                  <CalendarDays size={16} /> Publier le planning
                </h3>
                <p className="text-xs text-slate-500 mb-4">Informez les employés des nouveaux horaires.</p>
                <form className="space-y-3">
                  <input className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none" type="date" />
                  <textarea
                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
                    placeholder="Message aux équipes"
                    rows={2}
                  />
                  <button className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white hover:bg-black transition-all">
                    Publier
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
