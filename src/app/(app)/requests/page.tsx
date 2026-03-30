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

const statusConfig: Record<string, { bg: string; text: string; border: string; icon: React.ComponentType<{ size?: number }> }> = {
  approved: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100", icon: CheckCircle2 },
  rejected:  { bg: "bg-rose-50",   text: "text-rose-700",   border: "border-rose-100",    icon: XCircle },
  office:    { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-100",    icon: Info },
  pending:   { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-100",   icon: Clock },
};

function RequestCard({ item, isAdmin, onEdit, onDelete }: {
  item: RequestItem; isAdmin: boolean;
  onEdit: (id: number) => void; onDelete: (id: number) => void;
}) {
  const config = statusConfig[item.status] ?? statusConfig.pending;
  const StatusIcon = config.icon;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">REQ-{item.id}</span>
            <h4 className="mt-0.5 font-bold text-slate-900">{item.type}</h4>
            <Link href={`/employees/${item.employeeId}`} className="mt-1 flex w-fit items-center gap-1 text-xs text-indigo-500 hover:underline">
              <User size={10} /> {item.employeeName ?? `Employé #${item.employeeId}`}
            </Link>
          </div>
          <div className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase ${config.bg} ${config.text} ${config.border}`}>
            <StatusIcon size={11} />
            {statusLabel[item.status] ?? item.status}
          </div>
        </div>

        {item.message && (
          <p className="mt-3 rounded-xl bg-slate-50 px-4 py-2.5 text-sm italic text-slate-600">&quot;{item.message}&quot;</p>
        )}

        {item.adminMessage && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-indigo-100/60 bg-indigo-50/50 px-4 py-3">
            <MessageSquare size={13} className="mt-0.5 shrink-0 text-indigo-400" />
            <div>
              <p className="mb-0.5 text-[10px] font-bold uppercase text-indigo-400">Réponse admin</p>
              <p className="text-xs text-indigo-700">{item.adminMessage}</p>
            </div>
          </div>
        )}

        {item.logs && item.logs.length > 0 && (
          <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Historique</p>
            {item.logs.map(log => (
              <div key={log.id} className="flex items-start gap-2 text-xs text-slate-600">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-300" />
                <div>
                  <span className="font-semibold text-slate-700">{logActionLabel(log.action)}</span>
                  {log.byEmployeeName && <span className="text-slate-400"> par {log.byEmployeeName}</span>}
                  {log.note && <span className="italic text-slate-400"> — {log.note}</span>}
                  <p className="text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleString("fr-FR")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <button
            onClick={() => onEdit(item.id)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-100"
          >
            <Pencil size={12} /> Traiter
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-50"
          >
            <Trash2 size={12} /> Supprimer
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
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
          <Loader2 className="animate-spin text-indigo-600" size={28} />
        </div>
        <p className="text-sm font-medium text-slate-500">Chargement des demandes...</p>
      </div>
    </div>
  );

  const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15 transition-all";

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Demandes & Dossiers</h1>
          <p className="text-sm text-slate-500">Gérez et suivez les demandes de l&apos;équipe</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3.5 py-1.5 text-xs font-bold text-indigo-700">
            <ClipboardList size={12} /> {requests.length} demandes
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-700">
            <Clock size={12} /> {requests.filter(r => r.status === "pending").length} en attente
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Requests list */}
        <div className="lg:col-span-2 space-y-5">
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text" placeholder="Rechercher par type ou employé…"
                value={filterSearch} onChange={e => setFilterSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 py-2.5 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15 shadow-sm transition-all"
              />
              {filterSearch && (
                <button onClick={() => setFilterSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={13} />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["all", "pending", "approved", "rejected", "office"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${
                    filterStatus === s
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-500 hover:border-indigo-300"
                  }`}
                >
                  {s === "all" ? "Tous" : statusLabel[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Pending */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-500">
              <Clock size={14} /> En attente
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                {pendingRequests.length}
              </span>
            </h3>
            {pendingRequests.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center">
                <CheckCircle2 className="mx-auto mb-2 text-emerald-300" size={28} />
                <p className="font-bold text-slate-600">Tout est traité !</p>
                <p className="mt-0.5 text-xs text-slate-400">Aucune demande en attente.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map(item => (
                  <RequestCard key={item.id} item={item} isAdmin={isAdmin} onEdit={(id) => { setEditId(id); setEditForm({ status: item.status, adminMessage: item.adminMessage || "" }); }} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </div>

          {/* Processed */}
          {processedRequests.length > 0 && (
            <div className="space-y-3">
              <button
                onClick={() => setShowProcessed(v => !v)}
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-500 shadow-sm transition hover:bg-slate-50"
              >
                <span className="flex items-center gap-2">
                  <FileText size={14} /> Demandes traitées
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{processedRequests.length}</span>
                </span>
                {showProcessed ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
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
        <div className="space-y-5">
          {/* Edit form */}
          {isAdmin && editId && (
            <div className="rounded-2xl border-2 border-indigo-500 bg-white shadow-xl shadow-indigo-500/10 overflow-hidden">
              <div className="border-b border-slate-100 px-5 py-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Pencil size={13} className="text-indigo-500" /> Traiter REQ-{editId}
                </h3>
                <button onClick={() => setEditId(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleUpdate} className="space-y-4 p-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Nouveau statut</label>
                  <select className={inputClass} value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                    <option value="pending">⏳ En attente</option>
                    <option value="approved">✅ Approuver</option>
                    <option value="office">🏢 Convoquer</option>
                    <option value="rejected">❌ Rejeter</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Réponse à l&apos;employé</label>
                  <textarea
                    className={`${inputClass} resize-none`} rows={3}
                    placeholder="Ex: Document reçu, merci..."
                    value={editForm.adminMessage} onChange={e => setEditForm({ ...editForm, adminMessage: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="submit" disabled={saving}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 transition disabled:opacity-60"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    Confirmer
                  </button>
                  <button type="button" onClick={() => setEditId(null)} className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-600">
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Create form */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4 flex items-center gap-2">
              <PlusCircle size={14} className="text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-700">Nouvelle demande</h3>
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
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white hover:bg-indigo-600 transition-colors"
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
