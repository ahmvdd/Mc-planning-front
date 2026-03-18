"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetchClient, getToken } from "@/lib/clientApi";
import { 
  ClipboardList, Pencil, Trash2, Send, Clock, 
  CheckCircle2, XCircle, MessageSquare, User,
  FileText, Loader2, AlertCircle, Info, ChevronRight 
} from "lucide-react";

// --- Types ---
type RequestLog = {
  id: number;
  action: string;
  note?: string | null;
  createdAt: string;
  byEmployeeName?: string | null;
};

type RequestItem = {
  id: number;
  employeeId: number;
  employeeName?: string | null;
  type: string;
  status: string;
  message?: string | null;
  createdAt: string;
  managerEmail?: string | null;
  adminMessage?: string | null;
  logs?: RequestLog[];
};

// --- Helpers ---
const statusLabel: Record<string, string> = {
  pending: "En attente",
  approved: "Approuvée",
  rejected: "Refusée",
  office: "Convocation",
};

const logActionLabel = (action: string) => ({
  created: "Demande créée",
  pending: "Remise en attente",
  approved: "Approuvée",
  rejected: "Refusée",
  office: "Convocation bureau",
}[action] ?? action);

// --- Styles Dynamiques ---
const statusConfig: Record<string, { bg: string, text: string, icon: any }> = {
  approved: { bg: "bg-emerald-50 border-emerald-100", text: "text-emerald-700", icon: CheckCircle2 },
  rejected: { bg: "bg-rose-50 border-rose-100", text: "text-rose-700", icon: XCircle },
  office: { bg: "bg-blue-50 border-blue-100", text: "text-blue-700", icon: Info },
  pending: { bg: "bg-amber-50 border-amber-100", text: "text-amber-700", icon: Clock },
};

export default function RequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<{ role?: string; sub?: number } | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Formulaires
  const [editId, setEditId] = useState<number | null>(null);
  const [createForm, setCreateForm] = useState({ type: "", message: "", documentUrl: "", employeeId: "" });
  const [editForm, setEditForm] = useState({ status: "pending", message: "", documentUrl: "", adminMessage: "" });

  const isAdmin = me?.role === "admin";

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    Promise.all([
      apiFetchClient<RequestItem[]>("/requests"),
      apiFetchClient<{ role?: string; sub?: number }>("/auth/me").catch(() => null),
    ])
    .then(([data, meData]) => {
      setRequests(data);
      setMe(meData);
    })
    .catch(err => setError(err.message))
    .finally(() => setLoading(false));
  }, [router]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await apiFetchClient<RequestItem>("/requests", {
        method: "POST",
        body: JSON.stringify({
          ...createForm,
          employeeId: createForm.employeeId ? Number(createForm.employeeId) : undefined
        }),
      });
      setRequests(prev => [created, ...prev]);
      setCreateForm({ type: "", message: "", documentUrl: "", employeeId: "" });
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette demande ?")) return;
    try {
      await apiFetchClient(`/requests/${id}`, { method: "DELETE" });
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (err: any) { alert(err.message); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    setSaving(true);
    try {
      const updated = await apiFetchClient<RequestItem>(`/requests/${editId}`, {
        method: "PATCH",
        body: JSON.stringify(editForm),
      });
      setRequests(prev => prev.map(item => item.id === editId ? updated : item));
      setEditId(null);
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex h-96 items-center justify-center text-indigo-500">
      <Loader2 className="animate-spin" size={40} />
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-6">
      {/* Header Raffiné */}
      <header className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/60 bg-white p-8 md:p-10 shadow-xl shadow-indigo-500/5">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-50/50 blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-indigo-600">
              <ClipboardList size={12} /> Centre de requêtes
            </span>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight md:text-5xl">Demandes & Docs</h1>
            <p className="max-w-xl text-slate-500">Gérez les demandes de l'équipe et suivez les validations de documents en temps réel.</p>
          </div>
        </div>
      </header>

      <section className="grid gap-8 lg:grid-cols-12">
        {/* Liste des demandes */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold text-slate-800">Flux d'activité</h2>
            <div className="text-xs font-medium text-slate-400">{requests.length} éléments</div>
          </div>
          
          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-slate-200 py-20 text-center text-slate-400">
                <Info className="mx-auto mb-3 opacity-20" size={48} />
                <p className="font-medium">Aucune demande pour le moment.</p>
              </div>
            ) : (
              requests.map((item) => {
                const config = statusConfig[item.status] || statusConfig.pending;
                const StatusIcon = config.icon;
                
                return (
                  <div key={item.id} className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 transition-all hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-500/5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                          <FileText size={22} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">REQ-{item.id}</span>
                            <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{item.type}</h3>
                          </div>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <User size={12} /> {item.employeeName ?? `Employé #${item.employeeId}`}
                          </p>
                        </div>
                      </div>
                      
                      <div className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider ${config.bg} ${config.text}`}>
                        <StatusIcon size={14} />
                        {statusLabel[item.status] ?? item.status}
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl bg-slate-50/50 p-4 border border-slate-100/50">
                      <p className="text-sm leading-relaxed text-slate-600 italic">
                        "{item.message || "Aucune précision supplémentaire."}"
                      </p>
                    </div>

                    {item.adminMessage && (
                      <div className="mt-4 flex items-start gap-3 rounded-2xl bg-indigo-50/40 p-4 border border-indigo-100/50">
                        <MessageSquare size={16} className="mt-0.5 text-indigo-400 shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold uppercase text-indigo-400 mb-1">Note de l'administration</p>
                          <p className="text-xs font-medium text-indigo-700 leading-relaxed">{item.adminMessage}</p>
                        </div>
                      </div>
                    )}

                    {item.logs && item.logs.length > 0 && (
                      <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-2">
                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">Historique</p>
                        {item.logs.map((log) => (
                          <div key={log.id} className="flex items-start gap-2 text-xs text-slate-600">
                            <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-indigo-300" />
                            <div>
                              <span className="font-semibold text-slate-700">{logActionLabel(log.action)}</span>
                              {log.byEmployeeName && <span className="text-slate-400"> par {log.byEmployeeName}</span>}
                              {log.note && <span className="italic text-slate-400"> — {log.note}</span>}
                              <span className="block text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleString("fr-FR")}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {isAdmin && (
                      <div className="mt-6 flex justify-end gap-2 border-t border-slate-50 pt-4">
                        <button 
                          onClick={() => {
                            setEditId(item.id);
                            setEditForm({ status: item.status, message: item.message || "", documentUrl: "", adminMessage: item.adminMessage || "" });
                          }}
                          className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          <Pencil size={14} /> Traiter la demande
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors">
                          <Trash2 size={14} /> Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sidebar : Formulaires */}
        <div className="lg:col-span-4 space-y-6">
          {/* Fenêtre de Traitement (Visible uniquement si editId) */}
          {isAdmin && editId && (
            <div className="rounded-[2rem] border-2 border-indigo-500 bg-white p-6 shadow-2xl shadow-indigo-500/10 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Pencil size={18} className="text-indigo-500" /> Action sur REQ-{editId}
                </h3>
                <button onClick={() => setEditId(null)} className="text-slate-400 hover:text-slate-600"><XCircle size={20} /></button>
              </div>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Nouveau Statut</label>
                  <select 
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                    value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}
                  >
                    <option value="pending">⏳ En attente</option>
                    <option value="approved">✅ Approuver</option>
                    <option value="office">🏢 Convoquer au bureau</option>
                    <option value="rejected">❌ Rejeter</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Réponse à l'employé</label>
                  <textarea 
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 resize-none"
                    rows={4} placeholder="Ex: Document reçu, merci..."
                    value={editForm.adminMessage} onChange={e => setEditForm({...editForm, adminMessage: e.target.value})}
                  />
                </div>
                <button 
                  disabled={saving}
                  className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex justify-center items-center gap-2"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Confirmer la mise à jour
                </button>
              </form>
            </div>
          )}

          {/* Formulaire de création standard */}
          <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <PlusCircle size={18} className="text-indigo-500" /> Nouvelle Demande
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <input 
                placeholder="Type (ex: Congés, Matériel...)" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
                value={createForm.type} onChange={e => setCreateForm({...createForm, type: e.target.value})} required
              />
              {isAdmin && (
                <input 
                  placeholder="ID Employé (laisser vide pour soi)" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                  value={createForm.employeeId} onChange={e => setCreateForm({...createForm, employeeId: e.target.value})}
                />
              )}
              <textarea 
                placeholder="Détails de votre requête..." rows={4}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 resize-none transition-all"
                value={createForm.message} onChange={e => setCreateForm({...createForm, message: e.target.value})}
              />
              <button 
                disabled={saving}
                className="group w-full rounded-xl bg-slate-900 py-4 text-sm font-bold text-white hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10 flex justify-center items-center gap-2"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                Envoyer le dossier
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

// Composant icône manquant dans lucide imports pour l'exemple
const PlusCircle = ({ size, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
);