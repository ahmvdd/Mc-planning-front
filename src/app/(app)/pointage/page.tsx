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
  present:    { label: "Présent",    color: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10", icon: <CheckCircle2 size={13} /> },
  late:       { label: "En retard",  color: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10",      icon: <Clock size={13} /> },
  absent:     { label: "Absent",     color: "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10",          icon: <XCircle size={13} /> },
  non_pointe: { label: "Non pointé", color: "text-gray-400 bg-gray-100 dark:text-white/30 dark:bg-white/10",             icon: <AlertCircle size={13} /> },
  manual:     { label: "Manuel",     color: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10",          icon: <UserCheck size={13} /> },
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
    <div className="mx-auto max-w-5xl space-y-6 pb-12">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Pointages du jour</h1>
          <p className="mt-1 text-sm text-gray-400 capitalize dark:text-white/30">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openWorkplaceQR}
            className="flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800 dark:bg-[#B4FF39] dark:text-black dark:hover:bg-[#a3ec2e]"
          >
            <QrCode size={14} /> QR d&apos;entrée
          </button>
          <button
            onClick={fetchToday}
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-gray-500 shadow-sm transition hover:text-gray-900 dark:bg-white/5 dark:text-white/50 dark:shadow-none dark:hover:text-white"
          >
            <RefreshCw size={14} /> Actualiser
          </button>
        </div>
      </div>

      {/* Stats — flat row */}
      <div className="flex flex-wrap gap-8 rounded-2xl bg-white p-6 shadow-sm dark:bg-white/5 dark:shadow-none">
        {[
          { key: "present",    label: "Présents",    color: "text-emerald-500" },
          { key: "late",       label: "En retard",   color: "text-amber-500" },
          { key: "absent",     label: "Absents",     color: "text-rose-500" },
          { key: "non_pointe", label: "Non pointés", color: "text-gray-400 dark:text-white/30" },
        ].map(s => (
          <div key={s.key}>
            <p className={`text-3xl font-bold ${s.color}`}>{stats[s.key as keyof typeof stats]}</p>
            <p className="text-xs font-medium text-gray-400 mt-0.5 dark:text-white/30">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-white/5 dark:shadow-none">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-gray-300 dark:text-white/20" size={28} />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Clock size={32} className="text-gray-200 mb-3 dark:text-white/10" />
            <p className="font-bold text-gray-400 dark:text-white/30">Aucun créneau aujourd&apos;hui</p>
            <p className="text-xs text-gray-300 mt-1 dark:text-white/20">Les créneaux du planning apparaîtront ici.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 dark:border-white/5">
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Employé</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Shift</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Pointage</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Statut</th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {entries.map(entry => {
                  const cfg = STATUS_CONFIG[entry.status] ?? STATUS_CONFIG.non_pointe;
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50/60 transition-colors dark:hover:bg-white/[0.03]">
                      <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white">
                        {entry.employee?.name ?? <span className="text-gray-300 italic dark:text-white/20">Non assigné</span>}
                      </td>
                      <td className="px-5 py-4 text-gray-400 dark:text-white/40">{entry.shift}</td>
                      <td className="px-5 py-4 text-gray-400 text-xs dark:text-white/30">
                        {entry.pointage
                          ? new Date(entry.pointage.scannedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
                          : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${cfg.color}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openQR(entry.id)}
                            className="rounded-lg bg-gray-100 p-1.5 text-gray-400 transition hover:bg-gray-200 hover:text-gray-900 dark:bg-white/5 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white"
                          >
                            <QrCode size={13} />
                          </button>
                          {entry.employee && (
                            <button
                              onClick={() => { setManualModal(entry); setManualStatus("present"); setManualNote(""); }}
                              className="rounded-lg bg-gray-100 p-1.5 text-gray-400 transition hover:bg-gray-200 hover:text-gray-900 dark:bg-white/5 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setQrData(null)}>
          <div className="rounded-2xl bg-white p-8 shadow-2xl text-center dark:bg-[#151517]" onClick={e => e.stopPropagation()}>
            <h3 className="mb-4 text-base font-bold text-gray-900 dark:text-white">{qrData?.label ?? "QR code"}</h3>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrData.img} alt="QR Code" className="mx-auto h-56 w-56 rounded-xl" />
            <p className="mt-4 text-xs text-gray-400 dark:text-white/30">
              {qrData?.entryId === null
                ? "QR permanent — Imprimez-le et affichez-le à l'entrée"
                : "Valable 8h — Les employés scannent avec leur téléphone"}
            </p>
            <button onClick={() => setQrData(null)} className="mt-5 w-full rounded-full bg-gray-100 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15">
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Modal pointage manuel */}
      {manualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setManualModal(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#151517]" onClick={e => e.stopPropagation()}>
            <h3 className="mb-1 text-base font-bold text-gray-900 dark:text-white">Pointage manuel</h3>
            <p className="mb-5 text-xs text-gray-400 dark:text-white/30">{manualModal.employee?.name} — {manualModal.shift}</p>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-400 dark:text-white/30">Statut</label>
                <select
                  value={manualStatus}
                  onChange={e => setManualStatus(e.target.value)}
                  className="w-full rounded-xl bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-200 dark:bg-white/5 dark:text-white dark:focus:ring-white/10"
                >
                  {MANUAL_STATUSES.map(s => (
                    <option key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-400 dark:text-white/30">Note (optionnel)</label>
                <input
                  type="text"
                  value={manualNote}
                  onChange={e => setManualNote(e.target.value)}
                  placeholder="Ex: appel téléphonique..."
                  className="w-full rounded-xl bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-gray-200 dark:bg-white/5 dark:text-white dark:placeholder:text-white/25 dark:focus:ring-white/10"
                />
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setManualModal(null)} className="flex-1 rounded-full bg-gray-100 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-gray-200 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/15">
                Annuler
              </button>
              <button onClick={saveManual} disabled={saving} className="flex-1 rounded-full bg-gray-900 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800 disabled:opacity-60 dark:bg-[#B4FF39] dark:text-black dark:hover:bg-[#a3ec2e]">
                {saving ? "..." : "Valider"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
