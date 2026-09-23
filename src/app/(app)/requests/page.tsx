"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetchClient, getToken } from "@/lib/clientApi";
import {
  Pencil, Trash2, Send, Clock,
  CheckCircle2, XCircle, MessageSquare, User,
  FileText, Loader2, Info, PlusCircle, ChevronDown, ChevronUp, Search, X
} from "lucide-react";

type RequestLog = { id: number; action: string; note?: string | null; createdAt: string; byEmployeeName?: string | null };
type RequestItem = {
  id: number; employeeId: number; employeeName?: string | null; type: string; status: string;
  message?: string | null; createdAt: string; adminMessage?: string | null; logs?: RequestLog[];
};

const statusLabel: Record<string, string> = {
  pending: "En attente", approved: "Approuvée", rejected: "Refusée", office: "Convocation",
};

const logActionLabel = (action: string) => ({
  created: "Demande créée", pending: "Remise en attente", approved: "Approuvée",
  rejected: "Refusée", office: "Convocation bureau",
}[action] ?? action);

const statusConfig: Record<string, { color: string; icon: React.ComponentType<{ size?: number }> }> = {
  approved: { color: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10", icon: CheckCircle2 },
  rejected:  { color: "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10",         icon: XCircle },
  office:    { color: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10",          icon: Info },
  pending:   { color: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10",       icon: Clock },
};

function RequestRow({ item, isAdmin, onEdit, onDelete }: {
  item: RequestItem; isAdmin: boolean;
  onEdit: (id: number) => void; onDelete: (id: number) => void;
}) {
  const config = statusConfig[item.status] ?? statusConfig.pending;
  const StatusIcon = config.icon;
  return (
    <div className="py-4 border-b border-gray-50 last:border-0 dark:border-white/5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider dark:text-white/20">REQ-{item.id}</span>
            <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${config.color}`}>
              <StatusIcon size={9} /> {statusLabel[item.status] ?? item.status}
            </span>
          </div>
          <h4 className="font-semibold text-gray-900 text-sm dark:text-white">{item.type}</h4>
          <Link href={`/employees/${item.employeeId}`} className="mt-0.5 flex w-fit items-center gap-1 text-xs text-gray-400 hover:text-gray-900 transition-colors dark:text-white/30 dark:hover:text-white">
            <User size={10} /> {item.employeeName ?? `Employé #${item.employeeId}`}
          </Link>

          {item.message && (
            <p className="mt-2 text-xs italic text-gray-400 dark:text-white/30">&quot;{item.message}&quot;</p>
          )}

          {item.adminMessage && (
            <div className="mt-2 flex items-start gap-2 rounded-lg bg-blue-50 px-3 py-2 dark:bg-blue-500/10">
              <MessageSquare size={11} className="mt-0.5 shrink-0 text-blue-500" />
              <div>
                <p className="mb-0.5 text-[10px] font-bold uppercase text-blue-500">Réponse admin</p>
                <p className="text-xs text-blue-700 dark:text-blue-300">{item.adminMessage}</p>
              </div>
            </div>
          )}

          {item.logs && item.logs.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {item.logs.map(log => (
                <div key={log.id} className="flex items-start gap-2 text-xs text-gray-400 dark:text-white/25">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gray-300 dark:bg-white/20" />
                  <div>
                    <span className="font-semibold text-gray-500 dark:text-white/40">{logActionLabel(log.action)}</span>
                    {log.byEmployeeName && <span className="text-gray-400 dark:text-white/25"> par {log.byEmployeeName}</span>}
                    {log.note && <span className="italic text-gray-400 dark:text-white/25"> — {log.note}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {isAdmin && (
          <div className="flex shrink-0 gap-1">
            <button
              onClick={() => onEdit(item.id)}
              className="rounded-lg p-1.5 text-gray-300 transition hover:bg-gray-100 hover:text-gray-900 dark:text-white/20 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="rounded-lg p-1.5 text-gray-300 transition hover:bg-rose-50 hover:text-rose-600 dark:text-white/20 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>
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
        body: JSON.stringify({ ...createForm, employeeId: createForm.employeeId ? Number(createForm.employeeId) : undefined }),
      });
      await refreshRequests();
      setCreateForm({ type: "", message: "", documentUrl: "", employeeId: "" });
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "Erreur"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette demande ?")) return;
    try {
      await apiFetchClient(`/requests/${id}`, { method: "DELETE" });
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "Erreur"); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    setSaving(true);
    try {
      await apiFetchClient(`/requests/${editId}`, { method: "PATCH", body: JSON.stringify(editForm) });
      await refreshRequests();
      setEditId(null);
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "Erreur"); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="animate-spin text-gray-300 dark:text-white/20" size={28} />
    </div>
  );

  const inputClass = "w-full rounded-xl bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-gray-200 transition-all dark:bg-white/5 dark:text-white dark:placeholder:text-white/25 dark:focus:ring-white/10";

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Demandes & Dossiers</h1>
          <p className="text-sm text-gray-400 mt-1 dark:text-white/30">Gérez et suivez les demandes de l&apos;équipe</p>
        </div>
        <div className="flex gap-6">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{requests.length}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Total</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-500">{requests.filter(r => r.status === "pending").length}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">En attente</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">

        {/* Liste */}
        <div className="lg:col-span-2 space-y-5">

          {/* Filtres */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none dark:text-white/25" />
              <input
                type="text" placeholder="Rechercher…"
                value={filterSearch} onChange={e => setFilterSearch(e.target.value)}
                className="w-full rounded-full bg-white pl-10 pr-8 py-3 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm outline-none focus:ring-2 focus:ring-gray-200 transition-all dark:bg-white/5 dark:text-white dark:placeholder:text-white/25 dark:shadow-none dark:focus:ring-white/10"
              />
              {filterSearch && (
                <button onClick={() => setFilterSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:text-white/30 dark:hover:text-white">
                  <X size={13} />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["all", "pending", "approved", "rejected", "office"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                    filterStatus === s
                      ? "bg-gray-900 text-white dark:bg-[#B4FF39] dark:text-black"
                      : "bg-white text-gray-400 shadow-sm hover:text-gray-900 dark:bg-white/5 dark:text-white/40 dark:shadow-none dark:hover:text-white"
                  }`}
                >
                  {s === "all" ? "Tous" : statusLabel[s]}
                </button>
              ))}
            </div>
          </div>

          {/* En attente */}
          <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-white/5 dark:shadow-none">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 mb-1 dark:text-white/30">
              <Clock size={13} /> En attente
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                {pendingRequests.length}
              </span>
            </h3>
            {pendingRequests.length === 0 ? (
              <div className="py-10 text-center">
                <CheckCircle2 className="mx-auto mb-2 text-gray-200 dark:text-white/10" size={24} />
                <p className="font-bold text-gray-400 dark:text-white/30">Tout est traité !</p>
              </div>
            ) : (
              <div>
                {pendingRequests.map(item => (
                  <RequestRow key={item.id} item={item} isAdmin={isAdmin}
                    onEdit={(id) => { setEditId(id); setEditForm({ status: item.status, adminMessage: item.adminMessage || "" }); }}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Traitées */}
          {processedRequests.length > 0 && (
            <div>
              <button
                onClick={() => setShowProcessed(v => !v)}
                className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 text-xs font-bold text-gray-400 shadow-sm transition hover:text-gray-900 dark:bg-white/5 dark:text-white/40 dark:shadow-none dark:hover:text-white"
              >
                <span className="flex items-center gap-2">
                  <FileText size={13} /> Demandes traitées
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500 dark:bg-white/10 dark:text-white/50">{processedRequests.length}</span>
                </span>
                {showProcessed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {showProcessed && (
                <div className="mt-2 rounded-2xl bg-white p-5 shadow-sm opacity-70 hover:opacity-100 transition-opacity dark:bg-white/5 dark:shadow-none">
                  {processedRequests.map(item => (
                    <RequestRow key={item.id} item={item} isAdmin={isAdmin}
                      onEdit={(id) => { setEditId(id); setEditForm({ status: item.status, adminMessage: item.adminMessage || "" }); }}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">

          {/* Formulaire traitement */}
          {isAdmin && editId && (
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-white/5 dark:shadow-none">
              <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50 dark:border-white/5">
                <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                  <Pencil size={13} className="text-gray-400 dark:text-white/40" /> Traiter REQ-{editId}
                </h3>
                <button onClick={() => setEditId(null)} className="text-gray-400 hover:text-gray-700 dark:text-white/30 dark:hover:text-white">
                  <X size={15} />
                </button>
              </div>
              <form onSubmit={handleUpdate} className="space-y-4 p-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Nouveau statut</label>
                  <select className={inputClass} value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                    <option value="pending">⏳ En attente</option>
                    <option value="approved">✅ Approuver</option>
                    <option value="office">🏢 Convoquer</option>
                    <option value="rejected">❌ Rejeter</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Réponse à l&apos;employé</label>
                  <textarea
                    className={`${inputClass} resize-none`} rows={3}
                    placeholder="Ex: Document reçu, merci..."
                    value={editForm.adminMessage} onChange={e => setEditForm({ ...editForm, adminMessage: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="submit" disabled={saving}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 py-3 text-sm font-bold text-white hover:bg-gray-800 transition disabled:opacity-60 dark:bg-[#B4FF39] dark:text-black dark:hover:bg-[#a3ec2e]"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    Confirmer
                  </button>
                  <button type="button" onClick={() => setEditId(null)} className="w-full py-2 text-xs font-bold text-gray-400 hover:text-gray-700 dark:text-white/30 dark:hover:text-white">
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Nouvelle demande */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-white/5 dark:shadow-none">
            <div className="px-5 py-4 flex items-center gap-2 border-b border-gray-50 dark:border-white/5">
              <PlusCircle size={14} className="text-gray-400 dark:text-white/40" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Nouvelle demande</h3>
            </div>
            <div className="p-5">
              <form onSubmit={handleCreate} className="space-y-3">
                <input
                  className={inputClass} placeholder="Type (ex: Congés, Matériel...)"
                  value={createForm.type} onChange={e => setCreateForm({ ...createForm, type: e.target.value })} required
                />
                {isAdmin && (
                  <input
                    className={inputClass} placeholder="ID Employé (laisser vide pour soi)"
                    value={createForm.employeeId} onChange={e => setCreateForm({ ...createForm, employeeId: e.target.value })}
                  />
                )}
                <textarea
                  className={`${inputClass} resize-none`} rows={3} placeholder="Détails de votre demande..."
                  value={createForm.message} onChange={e => setCreateForm({ ...createForm, message: e.target.value })}
                />
                <button
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 py-3 text-sm font-bold text-white hover:bg-gray-800 transition-colors dark:bg-[#B4FF39] dark:text-black dark:hover:bg-[#a3ec2e]"
                >
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  Envoyer
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
