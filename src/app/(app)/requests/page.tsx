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
  approved: { color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", icon: CheckCircle2 },
  rejected:  { color: "text-rose-400 bg-rose-400/10 border-rose-400/20",         icon: XCircle },
  office:    { color: "text-blue-400 bg-blue-400/10 border-blue-400/20",          icon: Info },
  pending:   { color: "text-amber-400 bg-amber-400/10 border-amber-400/20",       icon: Clock },
};

function RequestRow({ item, isAdmin, onEdit, onDelete }: {
  item: RequestItem; isAdmin: boolean;
  onEdit: (id: number) => void; onDelete: (id: number) => void;
}) {
  const config = statusConfig[item.status] ?? statusConfig.pending;
  const StatusIcon = config.icon;
  return (
    <div className="py-4 border-b border-zinc-800/60 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">REQ-{item.id}</span>
            <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${config.color}`}>
              <StatusIcon size={9} /> {statusLabel[item.status] ?? item.status}
            </span>
          </div>
          <h4 className="font-semibold text-white text-sm">{item.type}</h4>
          <Link href={`/employees/${item.employeeId}`} className="mt-0.5 flex w-fit items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
            <User size={10} /> {item.employeeName ?? `Employé #${item.employeeId}`}
          </Link>

          {item.message && (
            <p className="mt-2 text-xs italic text-zinc-400">&quot;{item.message}&quot;</p>
          )}

          {item.adminMessage && (
            <div className="mt-2 flex items-start gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2">
              <MessageSquare size={11} className="mt-0.5 shrink-0 text-blue-400" />
              <div>
                <p className="mb-0.5 text-[10px] font-bold uppercase text-blue-500">Réponse admin</p>
                <p className="text-xs text-blue-300">{item.adminMessage}</p>
              </div>
            </div>
          )}

          {item.logs && item.logs.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {item.logs.map(log => (
                <div key={log.id} className="flex items-start gap-2 text-xs text-zinc-500">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-zinc-600" />
                  <div>
                    <span className="font-semibold text-zinc-400">{logActionLabel(log.action)}</span>
                    {log.byEmployeeName && <span className="text-zinc-600"> par {log.byEmployeeName}</span>}
                    {log.note && <span className="italic text-zinc-600"> — {log.note}</span>}
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
              className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-white"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-rose-500/10 hover:text-rose-400"
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
      <Loader2 className="animate-spin text-zinc-500" size={28} />
    </div>
  );

  const inputClass = "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all";

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Demandes & Dossiers</h1>
          <p className="text-sm text-zinc-500">Gérez et suivez les demandes de l&apos;équipe</p>
        </div>
        <div className="flex gap-6">
          <div>
            <p className="text-2xl font-bold text-white">{requests.length}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Total</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-400">{requests.filter(r => r.status === "pending").length}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">En attente</p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">

        {/* Liste */}
        <div className="lg:col-span-2 space-y-5">

          {/* Filtres */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              <input
                type="text" placeholder="Rechercher…"
                value={filterSearch} onChange={e => setFilterSearch(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 pl-9 pr-8 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
              />
              {filterSearch && (
                <button onClick={() => setFilterSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
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
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white"
                  }`}
                >
                  {s === "all" ? "Tous" : statusLabel[s]}
                </button>
              ))}
            </div>
          </div>

          {/* En attente */}
          <div>
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">
              <Clock size={13} /> En attente
              <span className="rounded-full bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                {pendingRequests.length}
              </span>
            </h3>
            {pendingRequests.length === 0 ? (
              <div className="py-10 text-center">
                <CheckCircle2 className="mx-auto mb-2 text-zinc-700" size={24} />
                <p className="font-bold text-zinc-500">Tout est traité !</p>
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
                className="flex w-full items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-xs font-bold text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
              >
                <span className="flex items-center gap-2">
                  <FileText size={13} /> Demandes traitées
                  <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-[10px] font-bold text-zinc-400">{processedRequests.length}</span>
                </span>
                {showProcessed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {showProcessed && (
                <div className="mt-1 opacity-70 hover:opacity-100 transition-opacity">
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
            <div className="rounded-xl border border-zinc-700 bg-zinc-900 overflow-hidden">
              <div className="border-b border-zinc-800 px-5 py-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                  <Pencil size={13} className="text-blue-400" /> Traiter REQ-{editId}
                </h3>
                <button onClick={() => setEditId(null)} className="text-zinc-500 hover:text-zinc-300">
                  <X size={15} />
                </button>
              </div>
              <form onSubmit={handleUpdate} className="space-y-4 p-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Nouveau statut</label>
                  <select className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                    <option value="pending">⏳ En attente</option>
                    <option value="approved">✅ Approuver</option>
                    <option value="office">🏢 Convoquer</option>
                    <option value="rejected">❌ Rejeter</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Réponse à l&apos;employé</label>
                  <textarea
                    className={`${inputClass} resize-none`} rows={3}
                    placeholder="Ex: Document reçu, merci..."
                    value={editForm.adminMessage} onChange={e => setEditForm({ ...editForm, adminMessage: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="submit" disabled={saving}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-500 transition disabled:opacity-60"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    Confirmer
                  </button>
                  <button type="button" onClick={() => setEditId(null)} className="w-full py-2 text-xs font-bold text-zinc-500 hover:text-zinc-300">
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Nouvelle demande */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="border-b border-zinc-800 px-5 py-4 flex items-center gap-2">
              <PlusCircle size={14} className="text-blue-400" />
              <h3 className="text-sm font-bold text-white">Nouvelle demande</h3>
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
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-800 py-3 text-sm font-bold text-white hover:bg-blue-600 transition-colors"
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
