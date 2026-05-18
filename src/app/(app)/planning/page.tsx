"use client";

import React, { useEffect, useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";
import { apiFetchClient, getToken } from "@/lib/clientApi";
import {
  Calendar, Clock, Users, Plus, User,
  Trash2, Pencil, Upload, Download,
  Loader2, ChevronDown, Image as ImageIcon,
  LayoutGrid, List, FileSpreadsheet, X
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
  const [me, setMe] = useState<{ role?: string; sub?: number } | null>(null);
  type SlotData =
    | { type: 'image'; url: string }
    | { type: 'excel'; rows: string[][]; name: string; importedIds?: number[] };
  const [slot1, setSlot1] = useState<SlotData | null>(null);
  const [slot2, setSlot2] = useState<SlotData | null>(null);
  const [uploading1, setUploading1] = useState(false);
  const [uploading2, setUploading2] = useState(false);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResult, setCsvResult] = useState<{ ok: number; errors: string[] } | null>(null);

  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [savingPeriod, setSavingPeriod] = useState(false);
  const [showPeriodForm, setShowPeriodForm] = useState(false);
  const [periodForm, setPeriodForm] = useState(EMPTY_PERIOD);

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [confirmDeleteEntryId, setConfirmDeleteEntryId] = useState<number | null>(null);
  const [confirmDeletePeriodId, setConfirmDeletePeriodId] = useState<number | null>(null);

  const isAdmin = me?.role === "admin";

  const myName = useMemo(() => {
    if (!me?.sub) return null;
    return employees.find(e => e.id === me.sub)?.name?.toLowerCase() ?? null;
  }, [me, employees]);

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
        const periodEntryIds = new Set(pds.flatMap(p => p.entries.map(e => e.id)));
        setOrphanEntries(allEntries.filter(e => !periodEntryIds.has(e.id)));
        setEmployees(emps);
        setMe(meData);
        const parseSlot = (raw: string | null): SlotData | null => {
          if (!raw) return null;
          if (raw.startsWith('__EXCEL__')) {
            try { return JSON.parse(raw.slice(9)); } catch { return null; }
          }
          return { type: 'image', url: raw };
        };
        setSlot1(parseSlot(img.planningImageUrl));
        setSlot2(parseSlot(img.planningImageUrl2));
        if (pds.length > 0) setExpandedIds(new Set([pds[0].id]));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

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
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSavingPeriod(false);
    }
  };

  const handleDeletePeriod = async (id: number) => {
    try {
      await apiFetchClient(`/planning/periods/${id}`, { method: "DELETE" });
      setPeriods(prev => prev.filter(p => p.id !== id));
    } catch (err: unknown) {
      alert("Erreur : " + (err instanceof Error ? err.message : "inconnue"));
    } finally {
      setConfirmDeletePeriodId(null);
    }
  };

  const handleEdit = (entry: PlanningEntry) => {
    setEditId(entry.id);
    setForm({
      date: entry.date.split("T")[0],
      shift: entry.shift,
      employeeId: entry.employeeId ? String(entry.employeeId) : "",
      note: entry.note || "",
      planningId: entry.planningId ? String(entry.planningId) : "",
    });
    const formElement = document.getElementById("shift-form");
    formElement?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDeleteEntry = async (id: number) => {
    try {
      await apiFetchClient(`/planning/${id}`, { method: "DELETE" });
      setPeriods(prev =>
        prev.map(p => ({ ...p, entries: p.entries.filter(e => e.id !== id) }))
      );
      setOrphanEntries(prev => prev.filter(e => e.id !== id));
    } catch (err: unknown) {
      alert("Erreur : " + (err instanceof Error ? err.message : "inconnue"));
    } finally {
      setConfirmDeleteEntryId(null);
    }
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: { date: string; shift: string; employeeId?: number; note?: string; planningId?: number } = {
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
        setPeriods(prev => prev.map(p => ({ ...p, entries: p.entries.filter(e => e.id !== editId) })));
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
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur");
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

  const refreshPlanningData = async () => {
    const [updatedPds, updatedEntries] = await Promise.all([
      apiFetchClient<PlanningPeriod[]>('/planning/periods'),
      apiFetchClient<PlanningEntry[]>('/planning'),
    ]);
    setPeriods(updatedPds);
    const pIds = new Set(updatedPds.flatMap(p => p.entries.map(e => e.id)));
    setOrphanEntries(updatedEntries.filter(e => !pIds.has(e.id)));
  };

  const handleSlotUpload = async (e: React.ChangeEvent<HTMLInputElement>, slot: 1 | 2) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const setUploading = slot === 1 ? setUploading1 : setUploading2;
    const setSlot = slot === 1 ? setSlot1 : setSlot2;
    setUploading(true);

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const isCsv = file.name.endsWith('.csv');

    try {
      if (isExcel || isCsv) {
        const token = getToken();
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3000/api';
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(`${API_BASE}/planning/import`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { message?: string };
          throw new Error(body.message || `Import failed ${res.status}`);
        }

        const result = await res.json() as { created: number; errors: string[]; ids?: number[] };
        await refreshPlanningData();
        alert(`Planning importé (${result.created} créneaux).`);

        if (result.errors?.length) {
          setCsvResult({ ok: result.created, errors: result.errors });
        }

        if (isExcel) {
          const buffer = await file.arrayBuffer();
          const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' });
          const rows = (data as unknown[][]).filter((r) => r.length > 0).map((r) =>
            r.map((c) => (c instanceof Date ? c.toISOString().slice(0, 10) : (c != null ? String(c) : '')))
          );
          setSlot({ type: 'excel', rows, name: file.name, importedIds: result.ids });
        } else {
          const text = await file.text();
          const rows = text.split('\n').filter(Boolean).map(l =>
            l.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
          );
          setSlot({ type: 'excel', rows, name: file.name, importedIds: result.ids });
        }
      } else {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          try {
            const endpoint = slot === 2 ? '/admin/planning-image2' : '/admin/planning-image';
            const response = await apiFetchClient<{ planningImageUrl?: string; planningImageUrl2?: string }>(endpoint, {
              method: 'POST',
              body: JSON.stringify({ imageData: reader.result }),
            });
            const url = slot === 2 ? response.planningImageUrl2 : response.planningImageUrl;
            setSlot({ type: 'image', url: url ?? String(reader.result) });
          } catch (err: unknown) {
            alert('Erreur upload image : ' + (err instanceof Error ? err.message : 'inconnue'));
          } finally {
            setUploading(false);
          }
        };
        return;
      }
    } catch (err: unknown) {
      alert('Erreur upload : ' + (err instanceof Error ? err.message : 'inconnue'));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteSlot = async (slot: 1 | 2) => {
    const setSlot = slot === 1 ? setSlot1 : setSlot2;
    const currentSlot = slot === 1 ? slot1 : slot2;

    if (currentSlot?.type === 'excel' && currentSlot.importedIds?.length) {
      try {
        await apiFetchClient('/planning/import', {
          method: 'DELETE',
          body: JSON.stringify({ ids: currentSlot.importedIds }),
        });
        await refreshPlanningData();
      } catch {}
      setSlot(null);
      return;
    }

    try {
      await apiFetchClient(`/admin/planning-image${slot === 2 ? '2' : ''}`, { method: 'DELETE' });
    } catch {}
    setSlot(null);
  };

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvImporting(true);
    setCsvResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = getToken();
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3000/api";
      const res = await fetch(`${API_BASE}/planning/import`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const result = await res.json() as { created: number; errors: string[] };
      setCsvResult({ ok: result.created, errors: result.errors ?? [] });

      const [updatedPds, updatedEntries] = await Promise.all([
        apiFetchClient<PlanningPeriod[]>("/planning/periods"),
        apiFetchClient<PlanningEntry[]>("/planning"),
      ]);
      setPeriods(updatedPds);
      const pIds = new Set(updatedPds.flatMap(p => p.entries.map(e => e.id)));
      setOrphanEntries(updatedEntries.filter(e => !pIds.has(e.id)));
    } catch {
      alert("Erreur lors de l'import");
    } finally {
      setCsvImporting(false);
      e.target.value = "";
    }
  };

  const handleExportExcel = () => {
    const allEntries = [
      ...periods.flatMap(p => p.entries.map(e => ({ ...e, periodName: p.name }))),
      ...orphanEntries.map(e => ({ ...e, periodName: "" })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const rows = allEntries.map(e => ({
      "Date": new Date(e.date).toLocaleDateString("fr-FR"),
      "Shift": e.shift,
      "Employé": employees.find(emp => emp.id === e.employeeId)?.name ?? "Équipe complète",
      "Note": e.note ?? "",
      "Période": e.periodName,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Planning");
    XLSX.writeFile(wb, `planning_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

  const fmtShiftDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  const inputClass = "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all";

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="animate-spin text-zinc-500" size={28} />
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Gestion du Planning</h1>
          <p className="text-sm text-zinc-500">Organisation et suivi des effectifs</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowPeriodForm(!showPeriodForm)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500 active:scale-95"
          >
            <Plus size={16} /> Nouvelle période
          </button>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-12">

        {/* Contenu principal */}
        <div className="lg:col-span-8 space-y-8">

          {/* Planning visuel */}
          {(slot1 || slot2 || isAdmin) && (
            <section className="space-y-4">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
                <LayoutGrid size={13} /> Planning visuel
              </h3>
              <div className="space-y-6">
                {([slot1, slot2] as const).map((slot, idx) => (
                  <div key={idx}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs font-extrabold uppercase tracking-widest text-blue-400">
                        Semaine {idx + 1}
                      </span>
                      <div className="flex-1 h-px bg-zinc-800" />
                      {isAdmin && slot && (
                        <button
                          onClick={() => handleDeleteSlot((idx + 1) as 1 | 2)}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 size={12} /> Supprimer
                        </button>
                      )}
                    </div>

                    {slot ? (
                      slot.type === 'image' ? (
                        <div className="overflow-hidden rounded-xl border border-zinc-800">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={slot.url}
                            alt={`Planning Semaine ${idx + 1}`}
                            className="w-full object-contain max-h-[420px] cursor-zoom-in"
                            onClick={() => window.open(slot.url, '_blank')}
                          />
                        </div>
                      ) : (
                        <div className="rounded-xl border border-zinc-800 overflow-auto">
                          <div className="px-4 py-2 border-b border-zinc-800 flex items-center gap-2">
                            <FileSpreadsheet size={13} className="text-emerald-400" />
                            <span className="text-xs font-semibold text-zinc-400">{slot.name}</span>
                          </div>
                          {(() => {
                            if (!myName) return null;
                            const myRowIdx = slot.rows.findIndex((row, i) => i > 0 && row.some(cell => cell.toLowerCase().includes(myName)));
                            if (myRowIdx === -1) return null;
                            const contextStart = Math.max(1, myRowIdx - 2);
                            const previewRows = [slot.rows[0], ...slot.rows.slice(contextStart, myRowIdx + 1)];
                            return (
                              <div className="px-4 pt-4 pb-3 border-b border-zinc-800 bg-blue-500/5">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-2 flex items-center gap-1.5">
                                  <User size={11} /> Mon planning
                                </p>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs border-collapse">
                                    {previewRows.map((row, ri) => {
                                      const isMyRow = ri > 0 && row.some(cell => cell.toLowerCase().includes(myName));
                                      return (
                                        <tr key={ri} className={ri === 0 ? 'font-bold text-zinc-500' : isMyRow ? 'bg-blue-500/10 font-semibold' : 'text-zinc-500'}>
                                          {row.map((cell, ci) => (
                                            <td key={ci} className={`px-3 py-1.5 whitespace-nowrap ${isMyRow ? 'text-blue-300' : ''}`}>
                                              {cell}
                                              {isMyRow && ci === 0 && (
                                                <span className="ml-1.5 inline-block rounded-full bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold text-white">Vous</span>
                                              )}
                                            </td>
                                          ))}
                                        </tr>
                                      );
                                    })}
                                  </table>
                                </div>
                              </div>
                            );
                          })()}
                          <div className="overflow-x-auto p-4">
                            <table className="w-full text-xs border-collapse">
                              {slot.rows.map((row, ri) => {
                                const isMe = ri > 0 && myName !== null && row.some(cell => cell.toLowerCase().includes(myName));
                                return (
                                  <tr key={ri} className={
                                    ri === 0
                                      ? 'font-bold text-zinc-500 border-b border-zinc-800'
                                      : isMe
                                        ? 'bg-blue-500/10 border-t border-blue-500/20 font-semibold'
                                        : 'border-t border-zinc-800/50 hover:bg-zinc-800/30'
                                  }>
                                    {row.map((cell, ci) => (
                                      <td key={ci} className={`px-3 py-2 whitespace-nowrap ${isMe ? 'text-blue-300' : 'text-zinc-400'}`}>
                                        {cell}
                                        {isMe && ci === 0 && (
                                          <span className="ml-2 inline-block rounded-full bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wide">Vous</span>
                                        )}
                                      </td>
                                    ))}
                                  </tr>
                                );
                              })}
                            </table>
                          </div>
                        </div>
                      )
                    ) : isAdmin ? (
                      <label className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-zinc-700 py-10 transition-all hover:border-blue-500/50 hover:bg-zinc-900">
                        <Upload size={18} className="text-zinc-600" />
                        <span className="text-sm font-medium text-zinc-500">Déposer une image ou un fichier Excel</span>
                        <input type="file" className="hidden" accept="image/*,.xlsx,.xls,.csv" onChange={e => handleSlotUpload(e, (idx + 1) as 1 | 2)} />
                      </label>
                    ) : (
                      <div className="rounded-xl border border-dashed border-zinc-800 py-8 text-center text-zinc-600 text-sm">
                        Aucun planning pour cette semaine
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Périodes */}
          <section className="space-y-4">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
              <List size={13} /> Périodes actives
            </h3>

            {periods.length === 0 && orphanEntries.length === 0 ? (
              <div className="py-16 text-center">
                <Calendar size={32} className="mx-auto mb-3 text-zinc-700" />
                <h4 className="font-bold text-zinc-500">Aucun planning pour le moment</h4>
                <p className="mt-1 text-sm text-zinc-600">Créez une nouvelle période ou importez un fichier Excel.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {periods.map(period => (
                  <div key={period.id} className="group rounded-xl border border-zinc-800 overflow-hidden transition-all hover:border-zinc-700">
                    <div
                      className="flex cursor-pointer items-center justify-between p-4 sm:p-5"
                      onClick={() => toggleExpand(period.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${expandedIds.has(period.id) ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                          <Calendar size={16} />
                        </div>
                        <div className="min-w-0">
                          <h2 className="font-bold text-white truncate">{period.name}</h2>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            <span className="text-xs text-zinc-500">{fmtDate(period.startDate)} — {fmtDate(period.endDate)}</span>
                            <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400">{period.entries.length} créneaux</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isAdmin && (
                          confirmDeletePeriodId === period.id ? (
                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                              <button onClick={() => handleDeletePeriod(period.id)} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-500">Supprimer</button>
                              <button onClick={() => setConfirmDeletePeriodId(null)} className="rounded-lg bg-zinc-700 px-3 py-1.5 text-xs font-bold text-zinc-200">Annuler</button>
                            </div>
                          ) : (
                            <button
                              onClick={e => { e.stopPropagation(); setConfirmDeletePeriodId(period.id); }}
                              className="rounded-lg p-2 text-zinc-600 opacity-0 transition-all group-hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-400"
                            >
                              <Trash2 size={14} />
                            </button>
                          )
                        )}
                        <div className={`rounded-lg p-1.5 transition-transform text-zinc-500 ${expandedIds.has(period.id) ? 'rotate-180 text-blue-400' : ''}`}>
                          <ChevronDown size={16} />
                        </div>
                      </div>
                    </div>

                    {expandedIds.has(period.id) && (
                      <div className="border-t border-zinc-800 px-2 pb-2">
                        <div className="overflow-x-auto rounded-lg">
                          <table className="w-full text-left">
                            <thead className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                              <tr>
                                <th className="px-4 py-3">Date & Horaire</th>
                                <th className="px-4 py-3">Membre</th>
                                <th className="px-4 py-3">Notes</th>
                                {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/60">
                              {period.entries.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="px-4 py-10 text-center">
                                    <p className="text-sm italic text-zinc-600">Aucun créneau enregistré.</p>
                                  </td>
                                </tr>
                              ) : (
                                period.entries.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(entry => (
                                  <EntryRow
                                    key={entry.id}
                                    entry={entry}
                                    employees={employees}
                                    isAdmin={isAdmin}
                                    fmtShiftDate={fmtShiftDate}
                                    onEdit={handleEdit}
                                    onDelete={handleDeleteEntry}
                                    confirmDeleteId={confirmDeleteEntryId}
                                    setConfirmDeleteId={setConfirmDeleteEntryId}
                                  />
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {orphanEntries.length > 0 && (
                  <div className="rounded-xl border border-dashed border-zinc-700">
                    <div className="p-4 flex items-center gap-2 text-zinc-500">
                      <Clock size={15} />
                      <span className="text-xs font-bold uppercase tracking-tight">Créneaux hors période</span>
                    </div>
                    <div className="px-2 pb-2">
                      <table className="w-full text-left">
                        <tbody className="divide-y divide-zinc-800/50">
                          {orphanEntries.map(entry => (
                            <EntryRow key={entry.id} entry={entry} employees={employees} isAdmin={isAdmin} fmtShiftDate={fmtShiftDate} onEdit={handleEdit} onDelete={handleDeleteEntry} confirmDeleteId={confirmDeleteEntryId} setConfirmDeleteId={setConfirmDeleteEntryId} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar admin */}
        {isAdmin && (
          <aside className="lg:col-span-4 space-y-6">

            {/* Formulaire nouvelle période */}
            {showPeriodForm && (
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white text-sm">Nouvelle Période</h3>
                  <button onClick={() => setShowPeriodForm(false)} className="text-zinc-500 hover:text-zinc-300"><X size={18}/></button>
                </div>
                <form onSubmit={handleCreatePeriod} className="space-y-3">
                  <input
                    placeholder="Nom (ex: Juin Semaine 1)"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-blue-500"
                    value={periodForm.name}
                    onChange={e => setPeriodForm({ ...periodForm, name: e.target.value })}
                    required
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Début</label>
                      <input
                        type="date"
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                        value={periodForm.startDate}
                        onChange={e => setPeriodForm({ ...periodForm, startDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Fin</label>
                      <input
                        type="date"
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                        value={periodForm.endDate}
                        onChange={e => setPeriodForm({ ...periodForm, endDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <button
                    disabled={savingPeriod}
                    className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-50"
                  >
                    {savingPeriod ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Confirmer la création"}
                  </button>
                </form>
              </div>
            )}

            {/* Formulaire créneau */}
            <div id="shift-form" className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 sticky top-24">
              <div className="flex items-center gap-3 mb-5">
                <div className={`p-2 rounded-lg ${editId ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'}`}>
                  {editId ? <Pencil size={16} /> : <Plus size={16} />}
                </div>
                <h3 className="font-bold text-white text-sm">{editId ? "Modifier le créneau" : "Ajouter un créneau"}</h3>
              </div>

              <form onSubmit={handleAction} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase">Période associée</label>
                  <select
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500"
                    value={form.planningId}
                    onChange={e => setForm({ ...form, planningId: e.target.value })}
                  >
                    <option value="">Aucune (Orphelin)</option>
                    {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-500 uppercase">Date</label>
                    <input
                      type="date"
                      className={inputClass}
                      value={form.date}
                      onChange={e => setForm({ ...form, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-500 uppercase">Shift</label>
                    <input
                      placeholder="08h - 16h"
                      className={inputClass}
                      value={form.shift}
                      onChange={e => setForm({ ...form, shift: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase">Assignation</label>
                  <select
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500"
                    value={form.employeeId}
                    onChange={e => setForm({ ...form, employeeId: e.target.value })}
                  >
                    <option value="">Toute l&apos;équipe</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase">Note interne</label>
                  <textarea
                    rows={2}
                    placeholder="Informations complémentaires..."
                    className={`${inputClass} resize-none`}
                    value={form.note}
                    onChange={e => setForm({ ...form, note: e.target.value })}
                  />
                </div>

                <div className="pt-1 flex flex-col gap-2">
                  <button
                    disabled={saving}
                    className={`w-full rounded-xl py-3 text-sm font-bold text-white transition flex justify-center items-center gap-2 ${editId ? 'bg-amber-500 hover:bg-amber-400' : 'bg-blue-600 hover:bg-blue-500'}`}
                  >
                    {saving && <Loader2 size={15} className="animate-spin" />}
                    {editId ? "Mettre à jour" : "Ajouter au planning"}
                  </button>
                  {editId && (
                    <button
                      type="button"
                      onClick={() => { setEditId(null); setForm(EMPTY_FORM); }}
                      className="w-full text-xs font-bold text-zinc-500 py-2 hover:text-zinc-300"
                    >
                      Annuler les modifications
                    </button>
                  )}
                </div>
              </form>

              {/* Actions secondaires */}
              <div className="mt-6 pt-5 border-t border-zinc-800 space-y-5">

                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold text-zinc-500 uppercase flex items-center justify-between">
                    Exporter <Download size={12} className="text-zinc-600" />
                  </h4>
                  <button
                    onClick={handleExportExcel}
                    className="flex w-full items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 transition hover:bg-zinc-700 group"
                  >
                    <Download size={14} className="text-zinc-500 group-hover:text-blue-400" />
                    <span className="text-xs font-semibold text-zinc-400 group-hover:text-white">Télécharger Excel</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold text-zinc-500 uppercase flex items-center justify-between">
                    Import rapide <FileSpreadsheet size={12} className="text-emerald-500" />
                  </h4>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-zinc-700 px-4 py-2.5 transition hover:bg-zinc-800 group">
                    <div className="text-zinc-500 group-hover:text-emerald-400">
                      {csvImporting ? <Loader2 className="animate-spin" size={14}/> : <Upload size={14} />}
                    </div>
                    <span className="text-xs font-semibold text-zinc-400 group-hover:text-white">Excel / CSV</span>
                    <input type="file" className="hidden" accept=".csv,.xlsx,.xls" onChange={handleCsvImport} />
                  </label>
                  {csvResult && (
                    <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-[10px] text-emerald-400 flex justify-between items-center">
                      <span><strong>{csvResult.ok}</strong> créneaux importés</span>
                      <button onClick={() => setCsvResult(null)}><X size={11}/></button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold text-zinc-500 uppercase">Planning visuel</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 py-3 transition hover:bg-zinc-700 hover:border-blue-500/50">
                      {uploading1 ? <Loader2 className="animate-spin text-blue-400" size={13}/> : <ImageIcon className="text-zinc-500" size={13}/>}
                      <span className="text-[10px] font-bold text-zinc-500 mt-1 uppercase">S1</span>
                      <input type="file" className="hidden" accept="image/*,.xlsx,.xls,.csv" onChange={e => handleSlotUpload(e, 1)} />
                    </label>
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 py-3 transition hover:bg-zinc-700 hover:border-blue-500/50">
                      {uploading2 ? <Loader2 className="animate-spin text-blue-400" size={13}/> : <ImageIcon className="text-zinc-500" size={13}/>}
                      <span className="text-[10px] font-bold text-zinc-500 mt-1 uppercase">S2</span>
                      <input type="file" className="hidden" accept="image/*,.xlsx,.xls,.csv" onChange={e => handleSlotUpload(e, 2)} />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

// ── EntryRow ──────────────────────────────────────────────────────────────────
function EntryRow({ entry, employees, isAdmin, fmtShiftDate, onEdit, onDelete, confirmDeleteId, setConfirmDeleteId }: {
  entry: PlanningEntry;
  employees: EmployeeOption[];
  isAdmin: boolean;
  fmtShiftDate: (date: string) => string;
  onEdit: (entry: PlanningEntry) => void;
  onDelete: (id: number) => void;
  confirmDeleteId: number | null;
  setConfirmDeleteId: (id: number | null) => void;
}) {
  const employee = employees.find((e) => e.id === entry.employeeId);

  return (
    <tr className="group/row hover:bg-zinc-800/30 transition-colors">
      <td className="px-4 py-3.5">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white">{fmtShiftDate(entry.date)}</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Clock size={11} className="text-blue-400" />
            <span className="text-xs font-bold text-blue-400 uppercase tracking-tighter">{entry.shift}</span>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold ${employee ? 'bg-blue-500/10 text-blue-400' : 'bg-zinc-800 text-zinc-500'}`}>
            {employee ? employee.name.substring(0, 2).toUpperCase() : <Users size={12} />}
          </div>
          <span className={`text-sm font-medium ${employee ? 'text-zinc-300' : 'text-zinc-600 italic'}`}>
            {employee?.name ?? "Équipe complète"}
          </span>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <p className="text-xs text-zinc-500 max-w-[180px] line-clamp-2">{entry.note || "—"}</p>
      </td>
      {isAdmin && (
        <td className="px-4 py-3.5 text-right">
          {confirmDeleteId === entry.id ? (
            <div className="flex justify-end gap-1">
              <button onClick={() => onDelete(entry.id)} className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-rose-500">Supprimer</button>
              <button onClick={() => setConfirmDeleteId(null)} className="rounded-lg bg-zinc-700 px-2.5 py-1 text-xs font-bold text-zinc-200 hover:bg-zinc-600">Annuler</button>
            </div>
          ) : (
            <div className="flex justify-end gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
              <button onClick={() => onEdit(entry)} className="p-1.5 text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-md transition-colors">
                <Pencil size={13} />
              </button>
              <button onClick={() => setConfirmDeleteId(entry.id)} className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors">
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </td>
      )}
    </tr>
  );
}
