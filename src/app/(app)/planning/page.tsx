"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetchClient, getToken } from "@/lib/clientApi";
import {
  Calendar, Clock, User, Users, Plus,
  Trash2, Pencil, Upload,
  Loader2, ChevronDown, ChevronRight, Image as ImageIcon,
} from "lucide-react";

// --- Types ---
type PlanningEntry = {
  id: number;
  date: string;
  shift: string;
  note?: string | null;
  employeeId?: number | null;
  planningId?: number | null;
};

type PlanningPeriod = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  entries: PlanningEntry[];
};

type EmployeeOption = { id: number; name: string };

const EMPTY_FORM = { date: "", shift: "", employeeId: "", note: "", planningId: "" };
const EMPTY_PERIOD = { name: "", startDate: "", endDate: "" };

export default function PlanningPage() {
  const router = useRouter();
  const [periods, setPeriods] = useState<PlanningPeriod[]>([]);
  const [orphanEntries, setOrphanEntries] = useState<PlanningEntry[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<{ role?: string } | null>(null);
  const [planningImageUrl, setPlanningImageUrl] = useState<string | null>(null);
  const [planningImageUrl2, setPlanningImageUrl2] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploading2, setImageUploading2] = useState(false);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResult, setCsvResult] = useState<{ ok: number; errors: string[] } | null>(null);

  // Shift form
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // Period form
  const [savingPeriod, setSavingPeriod] = useState(false);
  const [showPeriodForm, setShowPeriodForm] = useState(false);
  const [periodForm, setPeriodForm] = useState(EMPTY_PERIOD);

  // Expanded periods
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const isAdmin = me?.role === "admin";

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }

    Promise.all([
      apiFetchClient<PlanningPeriod[]>("/planning/periods"),
      apiFetchClient<PlanningEntry[]>("/planning"),
      apiFetchClient<EmployeeOption[]>("/employees"),
      apiFetchClient<{ role?: string }>("/auth/me").catch(() => null),
      apiFetchClient<{ planningImageUrl: string | null; planningImageUrl2: string | null }>("/planning/image").catch(() => ({ planningImageUrl: null, planningImageUrl2: null })),
    ])
      .then(([pds, allEntries, emps, meData, img]) => {
        setPeriods(pds);
        // Entries not linked to any period
        const periodEntryIds = new Set(pds.flatMap(p => p.entries.map(e => e.id)));
        setOrphanEntries(allEntries.filter(e => !periodEntryIds.has(e.id)));
        setEmployees(emps);
        setMe(meData);
        setPlanningImageUrl(img.planningImageUrl);
        setPlanningImageUrl2(img.planningImageUrl2 ?? null);
        // Auto-expand first period
        if (pds.length > 0) setExpandedIds(new Set([pds[0].id]));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Period actions ──────────────────────────────────────────────

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPeriod(true);
    try {
      const created = await apiFetchClient<PlanningPeriod>("/planning/periods", {
        method: "POST",
        body: JSON.stringify({
          name: periodForm.name.trim(),
          startDate: `${periodForm.startDate}T00:00:00.000Z`,
          endDate: `${periodForm.endDate}T23:59:59.999Z`,
        }),
      });
      setPeriods(prev => [{ ...created, entries: [] }, ...prev]);
      setPeriodForm(EMPTY_PERIOD);
      setShowPeriodForm(false);
      setExpandedIds(prev => new Set([...prev, created.id]));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingPeriod(false);
    }
  };

  const handleDeletePeriod = async (id: number, name: string) => {
    if (!confirm(`Supprimer le planning "${name}" et tous ses créneaux ?`)) return;
    try {
      await apiFetchClient(`/planning/periods/${id}`, { method: "DELETE" });
      setPeriods(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      alert("Erreur : " + err.message);
    }
  };

  // ── Shift actions ───────────────────────────────────────────────

  const handleEdit = (entry: PlanningEntry) => {
    setEditId(entry.id);
    setForm({
      date: entry.date.split("T")[0],
      shift: entry.shift,
      employeeId: entry.employeeId ? String(entry.employeeId) : "",
      note: entry.note || "",
      planningId: entry.planningId ? String(entry.planningId) : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteEntry = async (id: number) => {
    if (!confirm("Supprimer ce créneau ?")) return;
    try {
      await apiFetchClient(`/planning/${id}`, { method: "DELETE" });
      setPeriods(prev =>
        prev.map(p => ({ ...p, entries: p.entries.filter(e => e.id !== id) }))
      );
      setOrphanEntries(prev => prev.filter(e => e.id !== id));
    } catch (err: any) {
      alert("Erreur : " + err.message);
    }
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        date: form.date ? `${form.date}T00:00:00.000Z` : "",
        shift: form.shift.trim(),
        employeeId: form.employeeId ? Number(form.employeeId) : undefined,
        note: form.note.trim() || undefined,
        planningId: form.planningId ? Number(form.planningId) : undefined,
      };

      if (editId) {
        const updated = await apiFetchClient<PlanningEntry>(`/planning/${editId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        // Remove from old location, add to new
        setPeriods(prev =>
          prev.map(p => ({
            ...p,
            entries: p.entries.filter(e => e.id !== editId),
          }))
        );
        setOrphanEntries(prev => prev.filter(e => e.id !== editId));
        placeEntry(updated);
      } else {
        const created = await apiFetchClient<PlanningEntry>("/planning", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        placeEntry(created);
      }

      setForm(EMPTY_FORM);
      setEditId(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const placeEntry = (entry: PlanningEntry) => {
    if (entry.planningId) {
      setPeriods(prev =>
        prev.map(p =>
          p.id === entry.planningId
            ? { ...p, entries: [entry, ...p.entries.filter(e => e.id !== entry.id)] }
            : p
        )
      );
    } else {
      setOrphanEntries(prev => [entry, ...prev.filter(e => e.id !== entry.id)]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const response = await apiFetchClient<{ planningImageUrl: string | null }>("/admin/planning-image", {
          method: "POST",
          body: JSON.stringify({ imageData: reader.result }),
        });
        setPlanningImageUrl(response.planningImageUrl ?? String(reader.result));
      } catch (err: any) {
        alert("Erreur upload image : " + err.message);
      } finally {
        setImageUploading(false);
      }
    };
    reader.onerror = () => {
      alert("Impossible de lire le fichier.");
      setImageUploading(false);
    };
  };

  const handleImageUpload2 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading2(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const response = await apiFetchClient<{ planningImageUrl2: string | null }>("/admin/planning-image2", {
          method: "POST",
          body: JSON.stringify({ imageData: reader.result }),
        });
        setPlanningImageUrl2(response.planningImageUrl2 ?? String(reader.result));
      } catch (err: any) {
        alert("Erreur upload image 2 : " + err.message);
      } finally {
        setImageUploading2(false);
      }
    };
    reader.onerror = () => {
      alert("Impossible de lire le fichier.");
      setImageUploading2(false);
    };
  };

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvImporting(true);
    setCsvResult(null);
    const text = await file.text();
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    // Skip header row
    const rows = lines[0]?.toLowerCase().includes("date") ? lines.slice(1) : lines;
    let ok = 0;
    const errors: string[] = [];
    for (const row of rows) {
      const cols = row.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
      const [dateRaw, shift, employeeName, note, planningName] = cols;
      if (!dateRaw || !shift) { errors.push(`Ligne ignorée : "${row}"`); continue; }
      try {
        const employee = employeeName ? employees.find(emp => emp.name.toLowerCase() === employeeName.toLowerCase()) : undefined;
        const period = planningName ? periods.find(p => p.name.toLowerCase() === planningName.toLowerCase()) : undefined;
        await apiFetchClient("/planning", {
          method: "POST",
          body: JSON.stringify({
            date: `${dateRaw}T00:00:00.000Z`,
            shift,
            employeeId: employee?.id ?? undefined,
            note: note || undefined,
            planningId: period?.id ?? undefined,
          }),
        });
        ok++;
      } catch (err: any) {
        errors.push(`Erreur ligne "${row}" : ${err.message}`);
      }
    }
    setCsvResult({ ok, errors });
    setCsvImporting(false);
    // Refresh data
    const [pds, allEntries] = await Promise.all([
      apiFetchClient<PlanningEntry[]>("/planning/periods").catch(() => []),
      apiFetchClient<PlanningEntry[]>("/planning").catch(() => []),
    ]);
    if (Array.isArray(pds)) {
      setPeriods(pds as unknown as PlanningPeriod[]);
      const periodEntryIds = new Set((pds as unknown as PlanningPeriod[]).flatMap((p: PlanningPeriod) => p.entries.map((e: PlanningEntry) => e.id)));
      setOrphanEntries(allEntries.filter(e => !periodEntryIds.has(e.id)));
    }
    e.target.value = "";
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

  const fmtShiftDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });

  if (loading) return (
    <div className="flex h-96 items-center justify-center text-indigo-500">
      <Loader2 className="animate-spin" size={40} />
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      {/* Header */}
      <header className="rounded-3xl border border-slate-200/60 bg-white p-8 shadow-lg shadow-indigo-500/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">Organisation</span>
            <h1 className="mt-3 text-4xl font-extrabold text-slate-900 tracking-tight">Plannings</h1>
            <p className="mt-2 text-slate-500">Gérez vos périodes de planning et les créneaux associés.</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowPeriodForm(v => !v)}
              className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-500 transition-all shadow-md shadow-indigo-500/20"
            >
              <Plus size={16} /> Nouveau planning
            </button>
          )}
        </div>
      </header>

      <section className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6">

          {/* Planning Images */}
          {(planningImageUrl || planningImageUrl2) && (
            <div className={`grid gap-4 ${planningImageUrl && planningImageUrl2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
              {planningImageUrl && (
                <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="absolute top-4 left-4 z-10">
                    <span className="flex items-center gap-2 rounded-full bg-white/90 backdrop-blur px-3 py-1.5 text-[10px] font-bold text-slate-800 shadow-sm uppercase">
                      <ImageIcon size={14} className="text-indigo-500" /> Semaine 1
                    </span>
                  </div>
                  <img src={planningImageUrl} alt="Planning Semaine 1" className="h-auto w-full object-contain max-h-[400px]" />
                </div>
              )}
              {planningImageUrl2 && (
                <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="absolute top-4 left-4 z-10">
                    <span className="flex items-center gap-2 rounded-full bg-white/90 backdrop-blur px-3 py-1.5 text-[10px] font-bold text-slate-800 shadow-sm uppercase">
                      <ImageIcon size={14} className="text-indigo-500" /> Semaine 2
                    </span>
                  </div>
                  <img src={planningImageUrl2} alt="Planning Semaine 2" className="h-auto w-full object-contain max-h-[400px]" />
                </div>
              )}
            </div>
          )}

          {/* Period List */}
          {periods.length === 0 && orphanEntries.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-16 text-center">
              <Calendar size={40} className="mx-auto mb-4 text-slate-300" />
              <p className="text-slate-400 font-medium">Aucun planning créé.</p>
              {isAdmin && <p className="text-slate-400 text-sm mt-1">Cliquez sur "Nouveau planning" pour commencer.</p>}
            </div>
          ) : (
            <div className="space-y-4">
              {periods.map(period => (
                <div key={period.id} className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  {/* Period header */}
                  <div
                    className="flex items-center justify-between px-6 py-5 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => toggleExpand(period.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <h2 className="font-bold text-slate-900">{period.name}</h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {fmtDate(period.startDate)} → {fmtDate(period.endDate)}
                          <span className="ml-2 text-indigo-500 font-medium">{period.entries.length} créneau{period.entries.length !== 1 ? "x" : ""}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <button
                          onClick={e => { e.stopPropagation(); handleDeletePeriod(period.id, period.name); }}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      {expandedIds.has(period.id)
                        ? <ChevronDown size={18} className="text-slate-400" />
                        : <ChevronRight size={18} className="text-slate-400" />
                      }
                    </div>
                  </div>

                  {/* Entries table */}
                  {expandedIds.has(period.id) && (
                    <div className="border-t border-slate-100 overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/50 text-[10px] font-bold uppercase text-slate-400">
                          <tr>
                            <th className="px-6 py-3">Date & Horaire</th>
                            <th className="px-6 py-3">Assignation</th>
                            <th className="px-6 py-3">Note</th>
                            {isAdmin && <th className="px-6 py-3 text-right">Actions</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {period.entries.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic text-xs">
                                Aucun créneau dans ce planning.
                              </td>
                            </tr>
                          ) : (
                            period.entries.map(entry => (
                              <EntryRow
                                key={entry.id}
                                entry={entry}
                                employees={employees}
                                isAdmin={isAdmin}
                                fmtShiftDate={fmtShiftDate}
                                onEdit={handleEdit}
                                onDelete={handleDeleteEntry}
                              />
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}

              {/* Orphan entries (no period) */}
              {orphanEntries.length > 0 && (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-slate-100">
                    <h2 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                      <Clock size={16} className="text-slate-400" /> Créneaux sans planning
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50/50 text-[10px] font-bold uppercase text-slate-400">
                        <tr>
                          <th className="px-6 py-3">Date & Horaire</th>
                          <th className="px-6 py-3">Assignation</th>
                          <th className="px-6 py-3">Note</th>
                          {isAdmin && <th className="px-6 py-3 text-right">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {orphanEntries.map(entry => (
                          <EntryRow
                            key={entry.id}
                            entry={entry}
                            employees={employees}
                            isAdmin={isAdmin}
                            fmtShiftDate={fmtShiftDate}
                            onEdit={handleEdit}
                            onDelete={handleDeleteEntry}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Admin Sidebar */}
        {isAdmin && (
          <div className="lg:col-span-4 space-y-6">

            {/* New Period Form */}
            {showPeriodForm && (
              <div className="rounded-3xl border border-indigo-200 bg-indigo-50/30 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-6">
                  <Calendar size={16} className="text-indigo-500" /> Nouveau planning
                </h3>
                <form onSubmit={handleCreatePeriod} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Nom</label>
                    <input
                      placeholder="ex: Semaine 12, Mars 2026…"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                      value={periodForm.name}
                      onChange={e => setPeriodForm({ ...periodForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Date de début</label>
                    <input
                      type="date"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                      value={periodForm.startDate}
                      onChange={e => setPeriodForm({ ...periodForm, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Date de fin</label>
                    <input
                      type="date"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                      value={periodForm.endDate}
                      onChange={e => setPeriodForm({ ...periodForm, endDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      disabled={savingPeriod}
                      className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-500 disabled:bg-slate-300 transition-all flex justify-center items-center gap-2"
                    >
                      {savingPeriod && <Loader2 size={16} className="animate-spin" />}
                      Créer le planning
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowPeriodForm(false); setPeriodForm(EMPTY_PERIOD); }}
                      className="w-full text-xs font-bold text-slate-400 py-2 hover:text-slate-600"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Shift Form */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-6">
                {editId ? <Pencil size={16} className="text-indigo-500" /> : <Plus size={16} className="text-indigo-500" />}
                {editId ? "Modifier le créneau" : "Nouveau créneau"}
              </h3>
              <form onSubmit={handleAction} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Planning</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                    value={form.planningId}
                    onChange={e => setForm({ ...form, planningId: e.target.value })}
                  >
                    <option value="">Sans planning</option>
                    {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Date</label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Horaires (Shift)</label>
                  <input
                    placeholder="ex: 09:00 - 17:00"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                    value={form.shift}
                    onChange={e => setForm({ ...form, shift: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Employé assigné</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                    value={form.employeeId}
                    onChange={e => setForm({ ...form, employeeId: e.target.value })}
                  >
                    <option value="">Toute l'équipe</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Note (facultatif)</label>
                  <textarea
                    rows={2}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 resize-none"
                    value={form.note}
                    onChange={e => setForm({ ...form, note: e.target.value })}
                  />
                </div>
                <div className="pt-4 flex flex-col gap-2">
                  <button
                    disabled={saving}
                    className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white hover:bg-indigo-600 disabled:bg-slate-300 transition-all flex justify-center items-center gap-2"
                  >
                    {saving && <Loader2 size={16} className="animate-spin" />}
                    {editId ? "Mettre à jour" : "Valider le créneau"}
                  </button>
                  {editId && (
                    <button
                      type="button"
                      onClick={() => { setEditId(null); setForm(EMPTY_FORM); }}
                      className="w-full text-xs font-bold text-slate-400 py-2 hover:text-slate-600"
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Upload Images */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Upload size={16} className="text-indigo-500" /> Images planning
              </h3>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400 ml-1 mb-2">Semaine 1</p>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-6 hover:bg-indigo-50/30 hover:border-indigo-200 transition-all">
                  {imageUploading ? (
                    <Loader2 className="animate-spin text-indigo-500" />
                  ) : (
                    <>
                      <Upload className="mb-2 text-slate-400" size={20} />
                      <span className="text-[11px] font-bold text-slate-500 uppercase">{planningImageUrl ? "Remplacer" : "Choisir"}</span>
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400 ml-1 mb-2">Semaine 2</p>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-6 hover:bg-indigo-50/30 hover:border-indigo-200 transition-all">
                  {imageUploading2 ? (
                    <Loader2 className="animate-spin text-indigo-500" />
                  ) : (
                    <>
                      <Upload className="mb-2 text-slate-400" size={20} />
                      <span className="text-[11px] font-bold text-slate-500 uppercase">{planningImageUrl2 ? "Remplacer" : "Choisir"}</span>
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload2} />
                </label>
              </div>
            </div>

            {/* Import CSV */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Upload size={16} className="text-emerald-500" /> Import CSV
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Format : <span className="font-mono text-slate-600">date, shift, employé, note, planning</span><br />
                Exemple : <span className="font-mono text-slate-600">2026-03-17, 09:00-17:00, Jean, Ouverture, Semaine 12</span>
              </p>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-6 hover:bg-emerald-50/30 hover:border-emerald-200 transition-all">
                {csvImporting ? (
                  <><Loader2 className="animate-spin text-emerald-500 mb-1" /><span className="text-[11px] text-slate-500">Import en cours…</span></>
                ) : (
                  <>
                    <Upload className="mb-2 text-slate-400" size={20} />
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Importer un CSV</span>
                  </>
                )}
                <input type="file" className="hidden" accept=".csv,text/csv" onChange={handleCsvImport} />
              </label>
              {csvResult && (
                <div className={`rounded-xl p-3 text-xs ${csvResult.errors.length === 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  <p className="font-bold">{csvResult.ok} créneau{csvResult.ok !== 1 ? "x" : ""} importé{csvResult.ok !== 1 ? "s" : ""}</p>
                  {csvResult.errors.map((err, i) => <p key={i} className="mt-1 opacity-80">{err}</p>)}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

// ── Shared row component ──────────────────────────────────────────────────────
function EntryRow({
  entry,
  employees,
  isAdmin,
  fmtShiftDate,
  onEdit,
  onDelete,
}: {
  entry: PlanningEntry;
  employees: EmployeeOption[];
  isAdmin: boolean;
  fmtShiftDate: (iso: string) => string;
  onEdit: (e: PlanningEntry) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="px-6 py-4">
        <p className="font-bold text-slate-800">{fmtShiftDate(entry.date)}</p>
        <p className="text-xs text-indigo-600 font-medium">{entry.shift}</p>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${entry.employeeId ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"}`}>
            {entry.employeeId ? <User size={14} /> : <Users size={14} />}
          </div>
          <span className="font-medium text-slate-700">
            {employees.find(e => e.id === entry.employeeId)?.name ?? "Toute l'équipe"}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 text-slate-500 italic max-w-[150px] truncate">{entry.note || "—"}</td>
      {isAdmin && (
        <td className="px-6 py-4 text-right">
          <div className="flex justify-end gap-1">
            <button onClick={() => onEdit(entry)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
              <Pencil size={15} />
            </button>
            <button onClick={() => onDelete(entry.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
              <Trash2 size={15} />
            </button>
          </div>
        </td>
      )}
    </tr>
  );
}
