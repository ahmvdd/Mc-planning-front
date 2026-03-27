"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetchClient, getToken } from "@/lib/clientApi";
import {
  ClipboardList, Pencil, Trash2, Send, Clock,
  CheckCircle2, XCircle, MessageSquare, User,
  FileText, Loader2, Info, PlusCircle, ChevronDown, ChevronUp, Search, X
} from "lucide-react";

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
  adminMessage?: string | null;
  logs?: RequestLog[];
};

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

const statusConfig: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  approved: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100", icon: CheckCircle2 },
  rejected:  { bg: "bg-rose-50",    text: "text-rose-700",    border: "border-rose-100",    icon: XCircle },
  office:    { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-100",    icon: Info },
  pending:   { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-100",   icon: Clock },
};

function RequestCard({ item, isAdmin, onEdit, onDelete }: {
  item: RequestItem;
  isAdmin: boolean;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const config = statusConfig[item.status] ?? statusConfig.pending;
  const StatusIcon = config.icon;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">REQ-{item.id}</span>
            <h4 className="font-bold text-slate-900 mt-0.5">{item.type}</h4>
            <Link href={`/employees/${item.employeeId}`} className="mt-1 text-xs text-indigo-500 hover:underline flex items-center gap-1 w-fit">
              <User size={11} /> {item.employeeName ?? `Employé #${item.employeeId}`}
            </Link>
          </div>
          <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase ${config.bg} ${config.text} ${config.border}`}>
            <StatusIcon size={12} />
            {statusLabel[item.status] ?? item.status}
          </div>
        </div>

        {item.message && (
          <p className="mt-3 rounded-xl bg-slate-50 px-4 py-2.5 text-sm text-slate-600 italic">"{item.message}"</p>
        )}

        {item.adminMessage && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-indigo-50/50 border border-indigo-100/50 px-4 py-3">
            <MessageSquare size={14} className="mt-0.5 text-indigo-400 shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase text-indigo-400 mb-0.5">Réponse admin</p>
              <p className="text-xs text-indigo-700">{item.adminMessage}</p>
            </div>
          </div>
        )}

        {item.logs && item.logs.length > 0 && (
          <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 space-y-1.5">
            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">Historique</p>
            {item.logs.map(log => (
              <div key={log.id} className="flex items-start gap-2 text-xs text-slate-600">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-300" />
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
      </div>

      {isAdmin && (
        <div className="border-t border-slate-100 px-6 py-3 flex justify-end gap-2">
          <button
            onClick={() => onEdit(item.id)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Pencil size={13} /> Traiter
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Trash2 size={13} /> Supprimer
          </button>
        </div>
      )}
    </div>
  );
}

export default function RequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<{ role?: string; sub?: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [createForm, setCreateForm] = useState({ type: "", message: "", documentUrl: "", employeeId: "" });
  const [editForm, setEditForm] = useState({ status: "pending", adminMessage: "" });
  const [showProcessed, setShowProcessed] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSearch, setFilterSearch] = useState("");

  const isAdmin = me?.role === "admin";

  const filteredRequests = requests.filter(r => {
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    const q = filterSearch.toLowerCase().trim();
    const matchSearch = !q || r.type.toLowerCase().includes(q) || (r.employeeName ?? "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const pendingRequests = filteredRequests.filter(r => r.status === "pending");
  const processedRequests = filteredRequests.filter(r => r.status !== "pending");

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    Promise.all([
      apiFetchClient<RequestItem[]>("/requests"),
      apiFetchClient<{ role?: string; sub?: number }>("/auth/me").catch(() => null),
    ])
      .then(([data, meData]) => { setRequests(data); setMe(meData); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const refreshRequests = async () => {
    const data = await apiFetchClient<RequestItem[]>("/requests").catch(() => null);
    if (data) setRequests(data);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetchClient("/requests", {
        method: "POST",
        body: JSON.stringify({
          ...createForm,
          employeeId: createForm.employeeId ? Number(createForm.employeeId) : undefined,
        }),
      });
      await refreshRequests();
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
      await apiFetchClient(`/requests/${editId}`, { method: "PATCH", body: JSON.stringify(editForm) });
      await refreshRequests();
      setEditId(null);
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
        <p className="text-slate-500 font-medium animate-pulse">Chargement des demandes...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Header sticky */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Demandes & Dossiers</h1>
            <p className="text-sm text-slate-500">Gérez et suivez les demandes de l'équipe</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-4 py-1.5 text-xs font-bold text-indigo-700">
              <ClipboardList size={13} /> {requests.length} demandes
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-4 py-1.5 text-xs font-bold text-amber-700">
              <Clock size={13} /> {requests.filter(r => r.status === "pending").length} en attente
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-3">

          {/* Liste des demandes */}
          <div className="lg:col-span-2 space-y-6">

            {/* — Filtres — */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Rechercher par type ou employé…"
                  value={filterSearch}
                  onChange={e => setFilterSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 shadow-sm transition-all"
                />
                {filterSearch && (
                  <button onClick={() => setFilterSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {(["all", "pending", "approved", "rejected", "office"] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all border ${
                      filterStatus === s
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300"
                    }`}
                  >
                    {s === "all" ? "Tous" : statusLabel[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* — En attente — */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Clock size={16} /> En attente
                <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                  {pendingRequests.length}
                </span>
              </h3>

              {pendingRequests.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
                  <CheckCircle2 className="mx-auto text-emerald-300 mb-3" size={32} />
                  <p className="font-semibold text-slate-600">Tout est traité !</p>
                  <p className="text-slate-400 text-xs mt-1">Aucune demande en attente.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map(item => <RequestCard key={item.id} item={item} isAdmin={isAdmin} onEdit={(id) => { setEditId(id); setEditForm({ status: item.status, adminMessage: item.adminMessage || "" }); }} onDelete={handleDelete} />)}
                </div>
              )}
            </div>

            {/* — Déjà traitées — */}
            {processedRequests.length > 0 && (
              <div className="space-y-3">
                <button
                  onClick={() => setShowProcessed(v => !v)}
                  className="w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <span className="flex items-center gap-2">
                    <FileText size={15} />
                    Demandes déjà traitées
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                      {processedRequests.length}
                    </span>
                  </span>
                  {showProcessed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showProcessed && (
                  <div className="space-y-3">
                    {processedRequests.map(item => (
                      <div key={item.id} className="opacity-70 hover:opacity-100 transition-opacity">
                        <RequestCard item={item} isAdmin={isAdmin} onEdit={(id) => { setEditId(id); setEditForm({ status: item.status, adminMessage: item.adminMessage || "" }); }} onDelete={handleDelete} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Formulaire de traitement */}
            {isAdmin && editId && (
              <section className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Pencil size={16} /> Traiter REQ-{editId}
                </h3>
                <div className="rounded-2xl border-2 border-indigo-500 bg-white p-5 shadow-xl shadow-indigo-500/10 animate-in fade-in slide-in-from-top-4">
                  <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Nouveau statut</label>
                      <select
                        className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                      >
                        <option value="pending">⏳ En attente</option>
                        <option value="approved">✅ Approuver</option>
                        <option value="office">🏢 Convoquer</option>
                        <option value="rejected">❌ Rejeter</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Réponse à l'employé</label>
                      <textarea
                        className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
                        rows={3} placeholder="Ex: Document reçu, merci..."
                        value={editForm.adminMessage} onChange={e => setEditForm({ ...editForm, adminMessage: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-2 pt-1">
                      <button
                        type="submit" disabled={saving}
                        className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700 flex justify-center items-center gap-2 transition-colors"
                      >
                        {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                        Confirmer
                      </button>
                      <button type="button" onClick={() => setEditId(null)} className="w-full text-xs font-bold text-slate-400 py-2 hover:text-slate-600">
                        Annuler
                      </button>
                    </div>
                  </form>
                </div>
              </section>
            )}

            {/* Formulaire de création */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <PlusCircle size={16} /> Nouvelle demande
              </h3>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <form onSubmit={handleCreate} className="space-y-3">
                  <input
                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                    placeholder="Type (ex: Congés, Matériel...)"
                    value={createForm.type} onChange={e => setCreateForm({ ...createForm, type: e.target.value })} required
                  />
                  {isAdmin && (
                    <input
                      className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      placeholder="ID Employé (laisser vide pour soi)"
                      value={createForm.employeeId} onChange={e => setCreateForm({ ...createForm, employeeId: e.target.value })}
                    />
                  )}
                  <textarea
                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none transition-all"
                    placeholder="Détails de votre demande..." rows={3}
                    value={createForm.message} onChange={e => setCreateForm({ ...createForm, message: e.target.value })}
                  />
                  <button
                    disabled={saving}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white hover:bg-black transition-colors"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    Envoyer
                  </button>
                </form>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
