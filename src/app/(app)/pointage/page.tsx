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
  present:    { label: "Présent",    color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", icon: <CheckCircle2 size={13} /> },
  late:       { label: "En retard",  color: "text-amber-400 bg-amber-400/10 border-amber-400/20",      icon: <Clock size={13} /> },
  absent:     { label: "Absent",     color: "text-rose-400 bg-rose-400/10 border-rose-400/20",          icon: <XCircle size={13} /> },
  non_pointe: { label: "Non pointé", color: "text-zinc-400 bg-zinc-700/50 border-zinc-600",             icon: <AlertCircle size={13} /> },
  manual:     { label: "Manuel",     color: "text-blue-400 bg-blue-400/10 border-blue-400/20",          icon: <UserCheck size={13} /> },
};

const MANUAL_STATUSES = ["present", "late", "absent"];

export default function PointagePage() {
  const router = useRouter();
  const [entries, setEntries] = useState<PointageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState<{ img: string; entryId: number | null; label: string } | null>(null);
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

  useEffect(() => { fetchToday(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openQR = async (entryId: number) => {
    try {
      const res = await apiFetchClient<{ img: string }>(`/pointage/qr/${entryId}`, { method: "POST" });
      setQrData({ img: res.img, entryId, label: "QR code de créneau" });
    } catch (e: unknown) {
      alert((e instanceof Error ? e.message : null) || "Erreur génération QR");
    }
  };

  const openWorkplaceQR = async () => {
    try {
      const res = await apiFetchClient<{ img: string }>("/pointage/workplace-qr");
      setQrData({ img: res.img, entryId: null, label: "QR code d'entrée" });
    } catch (e: unknown) {
      alert((e instanceof Error ? e.message : null) || "Erreur génération QR");
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
    } catch (e: unknown) {
      alert((e instanceof Error ? e.message : null) || "Erreur");
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-zinc-800 pb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Pointages du jour</h1>
          <p className="mt-1 text-sm text-zinc-500 capitalize">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openWorkplaceQR}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-500"
          >
            <QrCode size={14} /> QR d&apos;entrée
          </button>
          <button
            onClick={fetchToday}
            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-bold text-zinc-300 transition hover:bg-zinc-700 hover:text-white"
          >
            <RefreshCw size={14} /> Actualiser
          </button>
        </div>
      </div>

      {/* Stats — flat row */}
      <div className="flex flex-wrap gap-8 border-b border-zinc-800 pb-8">
        {[
          { key: "present",    label: "Présents",    color: "text-emerald-400" },
          { key: "late",       label: "En retard",   color: "text-amber-400" },
          { key: "absent",     label: "Absents",     color: "text-rose-400" },
          { key: "non_pointe", label: "Non pointés", color: "text-zinc-500" },
        ].map(s => (
          <div key={s.key}>
            <p className={`text-3xl font-bold ${s.color}`}>{stats[s.key as keyof typeof stats]}</p>
            <p className="text-xs font-medium text-zinc-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-800">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-zinc-500" size={28} />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Clock size={32} className="text-zinc-700 mb-3" />
            <p className="font-bold text-zinc-500">Aucun créneau aujourd&apos;hui</p>
            <p className="text-xs text-zinc-600 mt-1">Les créneaux du planning apparaîtront ici.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60">
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-zinc-500">Employé</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-zinc-500">Shift</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-zinc-500">Pointage</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-zinc-500">Statut</th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-zinc-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {entries.map(entry => {
                  const cfg = STATUS_CONFIG[entry.status] ?? STATUS_CONFIG.non_pointe;
                  return (
                    <tr key={entry.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="px-5 py-4 font-semibold text-white">
                        {entry.employee?.name ?? <span className="text-zinc-600 italic">Non assigné</span>}
                      </td>
                      <td className="px-5 py-4 text-zinc-400">{entry.shift}</td>
                      <td className="px-5 py-4 text-zinc-500 text-xs">
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
                            className="rounded-lg border border-zinc-700 bg-zinc-800 p-1.5 text-zinc-400 transition hover:bg-zinc-700 hover:text-white"
                          >
                            <QrCode size={13} />
                          </button>
                          {entry.employee && (
                            <button
                              onClick={() => { setManualModal(entry); setManualStatus("present"); setManualNote(""); }}
                              className="rounded-lg border border-zinc-700 bg-zinc-800 p-1.5 text-zinc-400 transition hover:bg-zinc-700 hover:text-white"
                            >
                              <UserCheck size={13} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setQrData(null)}>
          <div className="rounded-2xl bg-zinc-900 border border-zinc-700 p-8 shadow-2xl text-center" onClick={e => e.stopPropagation()}>
            <h3 className="mb-4 text-base font-bold text-white">{qrData?.label ?? "QR code"}</h3>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrData.img} alt="QR Code" className="mx-auto h-56 w-56 rounded-xl" />
            <p className="mt-4 text-xs text-zinc-500">
              {qrData?.entryId === null
                ? "QR permanent — Imprimez-le et affichez-le à l'entrée"
                : "Valable 8h — Les employés scannent avec leur téléphone"}
            </p>
            <button onClick={() => setQrData(null)} className="mt-5 w-full rounded-xl bg-zinc-800 py-2.5 text-sm font-bold text-white transition hover:bg-zinc-700">
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Modal pointage manuel */}
      {manualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setManualModal(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-700 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="mb-1 text-base font-bold text-white">Pointage manuel</h3>
            <p className="mb-5 text-xs text-zinc-500">{manualModal.employee?.name} — {manualModal.shift}</p>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-zinc-500">Statut</label>
                <select
                  value={manualStatus}
                  onChange={e => setManualStatus(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500"
                >
                  {MANUAL_STATUSES.map(s => (
                    <option key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-zinc-500">Note (optionnel)</label>
                <input
                  type="text"
                  value={manualNote}
                  onChange={e => setManualNote(e.target.value)}
                  placeholder="Ex: appel téléphonique..."
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setManualModal(null)} className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 text-sm font-bold text-zinc-300 transition hover:bg-zinc-700">
                Annuler
              </button>
              <button onClick={saveManual} disabled={saving} className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-60">
                {saving ? "..." : "Valider"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
