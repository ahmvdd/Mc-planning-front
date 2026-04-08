"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetchClient, getToken } from "@/lib/clientApi";
import {
  CheckCircle2, Clock, XCircle, AlertCircle,
  QrCode, Loader2, UserCheck, RefreshCw
} from "lucide-react";

type PointageEntry = {
  id: number;
  shift: string;
  date: string;
  employee: { id: number; name: string } | null;
  pointage: { scannedAt: string; status: string; note?: string } | null;
  status: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  present:    { label: "Présent",     color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: <CheckCircle2 size={14} /> },
  late:       { label: "En retard",   color: "text-amber-700 bg-amber-50 border-amber-200",       icon: <Clock size={14} /> },
  absent:     { label: "Absent",      color: "text-rose-700 bg-rose-50 border-rose-200",           icon: <XCircle size={14} /> },
  non_pointe: { label: "Non pointé",  color: "text-slate-600 bg-slate-100 border-slate-200",       icon: <AlertCircle size={14} /> },
  manual:     { label: "Manuel",      color: "text-blue-700 bg-blue-50 border-blue-200",           icon: <UserCheck size={14} /> },
};

const MANUAL_STATUSES = ["present", "late", "absent"];

export default function PointagePage() {
  const router = useRouter();
  const [entries, setEntries] = useState<PointageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState<{ img: string; entryId: number } | null>(null);
  const [manualModal, setManualModal] = useState<PointageEntry | null>(null);
  const [manualStatus, setManualStatus] = useState("present");
  const [manualNote, setManualNote] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchToday = async () => {
    if (!getToken()) { router.push("/login"); return; }
    setLoading(true);
    try {
      const data = await apiFetchClient<PointageEntry[]>("/pointage/today");
      setEntries(data);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchToday(); }, []);

  const openQR = async (entryId: number) => {
    try {
      const res = await apiFetchClient<string>(`/pointage/qr/${entryId}`, { method: "POST" });
      setQrData({ img: res, entryId });
    } catch (e: any) {
      alert(e?.message || "Erreur génération QR");
    }
  };

  const saveManual = async () => {
    if (!manualModal) return;
    setSaving(true);
    try {
      await apiFetchClient("/pointage/manual", {
        method: "POST",
        body: JSON.stringify({
          planningEntryId: manualModal.id,
          employeeId: manualModal.employee?.id,
          status: manualStatus,
          note: manualNote || undefined,
        }),
      });
      setManualModal(null);
      setManualNote("");
      await fetchToday();
    } catch (e: any) {
      alert(e?.message || "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const stats = {
    present: entries.filter(e => e.status === "present").length,
    late: entries.filter(e => e.status === "late").length,
    absent: entries.filter(e => e.status === "absent").length,
    non_pointe: entries.filter(e => e.status === "non_pointe").length,
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pointages du jour</h1>
          <p className="mt-1 text-sm text-slate-500 capitalize">{today}</p>
        </div>
        <button
          onClick={fetchToday}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { key: "present",    label: "Présents",    color: "text-emerald-600", bg: "bg-emerald-50" },
          { key: "late",       label: "En retard",   color: "text-amber-600",   bg: "bg-amber-50" },
          { key: "absent",     label: "Absents",     color: "text-rose-600",    bg: "bg-rose-50" },
          { key: "non_pointe", label: "Non pointés", color: "text-slate-500",   bg: "bg-slate-100" },
        ].map(s => (
          <div key={s.key} className={`${s.bg} rounded-xl p-4`}>
            <p className={`text-2xl font-bold ${s.color}`}>{stats[s.key as keyof typeof stats]}</p>
            <p className="text-xs font-medium text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Clock size={40} className="text-slate-200 mb-3" />
            <p className="font-bold text-slate-600">Aucun créneau aujourd'hui</p>
            <p className="text-xs text-slate-400 mt-1">Les créneaux du planning apparaîtront ici.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Employé</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Shift</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Pointage</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Statut</th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map(entry => {
                  const cfg = STATUS_CONFIG[entry.status] ?? STATUS_CONFIG.non_pointe;
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {entry.employee?.name ?? <span className="text-slate-400 italic">Non assigné</span>}
                      </td>
                      <td className="px-5 py-4 text-slate-600">{entry.shift}</td>
                      <td className="px-5 py-4 text-slate-500 text-xs">
                        {entry.pointage
                          ? new Date(entry.pointage.scannedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
                          : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${cfg.color}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openQR(entry.id)}
                            title="Générer QR"
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-100"
                          >
                            <QrCode size={14} />
                          </button>
                          {entry.employee && (
                            <button
                              onClick={() => { setManualModal(entry); setManualStatus("present"); setManualNote(""); }}
                              title="Pointage manuel"
                              className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-100"
                            >
                              <UserCheck size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Modal */}
      {qrData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setQrData(null)}>
          <div className="rounded-2xl bg-white p-8 shadow-2xl text-center" onClick={e => e.stopPropagation()}>
            <h3 className="mb-4 text-base font-bold text-slate-900">QR code de pointage</h3>
            <img src={qrData.img} alt="QR Code" className="mx-auto h-56 w-56" />
            <p className="mt-4 text-xs text-slate-400">Valable 8h — Les employés scannent avec leur téléphone</p>
            <button onClick={() => setQrData(null)} className="mt-5 w-full rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800">
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Pointage manuel Modal */}
      {manualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setManualModal(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="mb-1 text-base font-bold text-slate-900">Pointage manuel</h3>
            <p className="mb-5 text-xs text-slate-500">{manualModal.employee?.name} — {manualModal.shift}</p>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">Statut</label>
                <select
                  value={manualStatus}
                  onChange={e => setManualStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-500/15"
                >
                  {MANUAL_STATUSES.map(s => (
                    <option key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">Note (optionnel)</label>
                <input
                  type="text"
                  value={manualNote}
                  onChange={e => setManualNote(e.target.value)}
                  placeholder="Ex: appel téléphonique..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-500/15"
                />
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button onClick={() => setManualModal(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                Annuler
              </button>
              <button onClick={saveManual} disabled={saving} className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60">
                {saving ? "..." : "Valider"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
