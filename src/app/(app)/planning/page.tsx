"use client";

import React, { useEffect, useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";
import { apiFetchClient, getToken } from "@/lib/clientApi";
import {
  Calendar, Clock, Users, Plus, User,
  Trash2, Pencil, Upload, Download,
  Loader2, ChevronDown, Image as ImageIcon,
  LayoutGrid, List, FileSpreadsheet, X,
  Copy, Repeat, Bookmark
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

type PlanningTemplateEntry = {
  id: number;
  dayOfWeek: number;
  shift: string;
  note?: string | null;
  employeeId?: number | null;
};

type PlanningTemplate = {
  id: number;
  name: string;
  entries: PlanningTemplateEntry[];
};

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

  const [templates, setTemplates] = useState<PlanningTemplate[]>([]);
  const [savingTemplateForPeriod, setSavingTemplateForPeriod] = useState<number | null>(null);
  const [applyTemplateId, setApplyTemplateId] = useState<number | null>(null);
  const [applyDate, setApplyDate] = useState("");
  const [applyingTemplate, setApplyingTemplate] = useState(false);
  const [confirmDeleteTemplateId, setConfirmDeleteTemplateId] = useState<number | null>(null);

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
      apiFetchClient<PlanningTemplate[]>("/planning/templates").catch(() => []),
    ])
      .then(([pds, allEntries, emps, meData, img, tmpls]) => {
        setPeriods(pds);
        const periodEntryIds = new Set(pds.flatMap(p => p.entries.map(e => e.id)));
        setOrphanEntries(allEntries.filter(e => !periodEntryIds.has(e.id)));
        setEmployees(emps);
        setMe(meData);
        setTemplates(tmpls);
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

  const handleSaveAsTemplate = async (periodId: number) => {
    const name = window.prompt("Nom du modèle :");
    if (!name || !name.trim()) return;
    setSavingTemplateForPeriod(periodId);
    try {
      const created = await apiFetchClient<PlanningTemplate>(`/planning/templates/from-period/${periodId}`, {
        method: "POST",
        body: JSON.stringify({ name: name.trim() }),
      });
      setTemplates(prev => [created, ...prev]);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSavingTemplateForPeriod(null);
    }
  };

  const handleApplyTemplate = async (templateId: number) => {
    if (!applyDate) return;
    setApplyingTemplate(true);
    try {
      await apiFetchClient(`/planning/templates/${templateId}/apply`, {
        method: "POST",
        body: JSON.stringify({ startDate: applyDate }),
      });
      await refreshPlanningData();
      setApplyTemplateId(null);
      setApplyDate("");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setApplyingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    try {
      await apiFetchClient(`/planning/templates/${id}`, { method: "DELETE" });
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (err: unknown) {
      alert("Erreur : " + (err instanceof Error ? err.message : "inconnue"));
    } finally {
      setConfirmDeleteTemplateId(null);
    }
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

  const inputClass = "w-full rounded-xl bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-gray-200 transition-all dark:bg-white/5 dark:text-white dark:placeholder:text-white/25 dark:focus:ring-white/10";

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="animate-spin text-gray-300 dark:text-white/20" size={28} />
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Gestion du Planning</h1>
          <p className="text-sm text-gray-400 mt-1 dark:text-white/30">Organisation et suivi des effectifs</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowPeriodForm(!showPeriodForm)}
            className="flex items-center gap-2 rounded-full bg-gray-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800 active:scale-95 dark:bg-[#B4FF39] dark:text-black dark:hover:bg-[#a3ec2e]"
          >
            <Plus size={16} /> Nouvelle période
          </button>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-12">

        {/* Contenu principal */}
        <div className="lg:col-span-8 space-y-6">

          {/* Planning visuel */}
          {(slot1 || slot2 || isAdmin) && (
            <section className="space-y-4">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/30">
                <LayoutGrid size={13} /> Planning visuel
              </h3>
              <div className="space-y-6">
                {([slot1, slot2] as const).map((slot, idx) => (
                  <div key={idx}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs font-extrabold uppercase tracking-widest text-gray-400 dark:text-white/30">
                        Semaine {idx + 1}
                      </span>
                      <div className="flex-1 h-px bg-gray-100 dark:bg-white/5" />
                      {isAdmin && slot && (
                        <button
                          onClick={() => handleDeleteSlot((idx + 1) as 1 | 2)}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold text-rose-500 hover:bg-rose-50 transition-colors dark:hover:bg-rose-500/10"
                        >
                          <Trash2 size={12} /> Supprimer
                        </button>
                      )}
                    </div>

                    {slot ? (
                      slot.type === 'image' ? (
                        <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-white/5 dark:shadow-none">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={slot.url}
                            alt={`Planning Semaine ${idx + 1}`}
                            className="w-full object-contain max-h-[420px] cursor-zoom-in"
                            onClick={() => window.open(slot.url, '_blank')}
                          />
                        </div>
                      ) : (
                        <div className="rounded-2xl bg-white shadow-sm overflow-auto dark:bg-white/5 dark:shadow-none">
                          <div className="px-4 py-2 border-b border-gray-50 flex items-center gap-2 dark:border-white/5">
                            <FileSpreadsheet size={13} className="text-emerald-500" />
                            <span className="text-xs font-semibold text-gray-500 dark:text-white/40">{slot.name}</span>
                          </div>
                          {(() => {
                            if (!myName) return null;
                            const myRowIdx = slot.rows.findIndex((row, i) => i > 0 && row.some(cell => cell.toLowerCase().includes(myName)));
                            if (myRowIdx === -1) return null;
                            const contextStart = Math.max(1, myRowIdx - 2);
                            const previewRows = [slot.rows[0], ...slot.rows.slice(contextStart, myRowIdx + 1)];
                            return (
                              <div className="px-4 pt-4 pb-3 border-b border-gray-50 bg-blue-50/50 dark:border-white/5 dark:bg-blue-500/5">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500 mb-2 flex items-center gap-1.5">
                                  <User size={11} /> Mon planning
                                </p>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs border-collapse">
                                    {previewRows.map((row, ri) => {
                                      const isMyRow = ri > 0 && row.some(cell => cell.toLowerCase().includes(myName));
                                      return (
                                        <tr key={ri} className={ri === 0 ? 'font-bold text-gray-400 dark:text-white/30' : isMyRow ? 'bg-blue-50 font-semibold dark:bg-blue-500/10' : 'text-gray-400 dark:text-white/30'}>
                                          {row.map((cell, ci) => (
                                            <td key={ci} className={`px-3 py-1.5 whitespace-nowrap ${isMyRow ? 'text-blue-600 dark:text-blue-300' : ''}`}>
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
                                      ? 'font-bold text-gray-400 border-b border-gray-100 dark:text-white/30 dark:border-white/10'
                                      : isMe
                                        ? 'bg-blue-50 border-t border-blue-100 font-semibold dark:bg-blue-500/10 dark:border-blue-500/20'
                                        : 'border-t border-gray-50 hover:bg-gray-50/60 dark:border-white/5 dark:hover:bg-white/[0.03]'
                                  }>
                                    {row.map((cell, ci) => (
                                      <td key={ci} className={`px-3 py-2 whitespace-nowrap ${isMe ? 'text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-white/40'}`}>
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
                      <label className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl bg-white py-10 shadow-sm transition-all hover:shadow-md dark:bg-white/5 dark:shadow-none dark:hover:bg-white/10">
                        <Upload size={18} className="text-gray-300 dark:text-white/20" />
                        <span className="text-sm font-medium text-gray-400 dark:text-white/30">Déposer une image ou un fichier Excel</span>
                        <input type="file" className="hidden" accept="image/*,.xlsx,.xls,.csv" onChange={e => handleSlotUpload(e, (idx + 1) as 1 | 2)} />
                      </label>
                    ) : (
                      <div className="rounded-2xl bg-white py-8 text-center text-gray-400 text-sm shadow-sm dark:bg-white/5 dark:text-white/30 dark:shadow-none">
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
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/30">
              <List size={13} /> Périodes actives
            </h3>

            {periods.length === 0 && orphanEntries.length === 0 ? (
              <div className="rounded-2xl bg-white py-16 text-center shadow-sm dark:bg-white/5 dark:shadow-none">
                <Calendar size={32} className="mx-auto mb-3 text-gray-200 dark:text-white/10" />
                <h4 className="font-bold text-gray-400 dark:text-white/30">Aucun planning pour le moment</h4>
                <p className="mt-1 text-sm text-gray-300 dark:text-white/20">Créez une nouvelle période ou importez un fichier Excel.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {periods.map(period => (
                  <div key={period.id} className="group rounded-2xl bg-white shadow-sm overflow-hidden transition-all dark:bg-white/5 dark:shadow-none">
                    <div
                      className="flex cursor-pointer items-center justify-between p-4 sm:p-5"
                      onClick={() => toggleExpand(period.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${expandedIds.has(period.id) ? 'bg-[#B4FF39] text-black' : 'bg-gray-100 text-gray-400 dark:bg-white/10 dark:text-white/40'}`}>
                          <Calendar size={16} />
                        </div>
                        <div className="min-w-0">
                          <h2 className="font-bold text-gray-900 truncate dark:text-white">{period.name}</h2>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-400 dark:text-white/30">{fmtDate(period.startDate)} — {fmtDate(period.endDate)}</span>
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500 dark:bg-white/10 dark:text-white/50">{period.entries.length} créneaux</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isAdmin && (
                          <button
                            onClick={e => { e.stopPropagation(); handleSaveAsTemplate(period.id); }}
                            disabled={savingTemplateForPeriod === period.id}
                            title="Enregistrer comme modèle"
                            className="rounded-lg p-2 text-gray-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 dark:text-white/20 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
                          >
                            {savingTemplateForPeriod === period.id ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />}
                          </button>
                        )}
                        {isAdmin && (
                          confirmDeletePeriodId === period.id ? (
                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                              <button onClick={() => handleDeletePeriod(period.id)} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-500">Supprimer</button>
                              <button onClick={() => setConfirmDeletePeriodId(null)} className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600 dark:bg-white/10 dark:text-white/70">Annuler</button>
                            </div>
                          ) : (
                            <button
                              onClick={e => { e.stopPropagation(); setConfirmDeletePeriodId(period.id); }}
                              className="rounded-lg p-2 text-gray-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-500 dark:text-white/20 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                            >
                              <Trash2 size={14} />
                            </button>
                          )
                        )}
                        <div className={`rounded-lg p-1.5 transition-transform text-gray-400 dark:text-white/30 ${expandedIds.has(period.id) ? 'rotate-180 text-gray-900 dark:text-white' : ''}`}>
                          <ChevronDown size={16} />
                        </div>
                      </div>
                    </div>

                    {expandedIds.has(period.id) && (
                      <div className="border-t border-gray-50 px-2 pb-2 dark:border-white/5">
                        <div className="overflow-x-auto rounded-lg">
                          <table className="w-full text-left">
                            <thead className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">
                              <tr>
                                <th className="px-4 py-3">Date & Horaire</th>
                                <th className="px-4 py-3">Membre</th>
                                <th className="px-4 py-3">Notes</th>
                                {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                              {period.entries.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="px-4 py-10 text-center">
                                    <p className="text-sm italic text-gray-300 dark:text-white/20">Aucun créneau enregistré.</p>
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
                  <div className="rounded-2xl bg-white shadow-sm dark:bg-white/5 dark:shadow-none">
                    <div className="p-4 flex items-center gap-2 text-gray-400 dark:text-white/30">
                      <Clock size={15} />
                      <span className="text-xs font-bold uppercase tracking-tight">Créneaux hors période</span>
                    </div>
                    <div className="px-2 pb-2">
                      <table className="w-full text-left">
                        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
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
          <aside className="lg:col-span-4 space-y-5">

            {/* Formulaire nouvelle période */}
            {showPeriodForm && (
              <div className="rounded-2xl bg-blue-50 p-5 dark:bg-blue-500/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 text-sm dark:text-white">Nouvelle Période</h3>
                  <button onClick={() => setShowPeriodForm(false)} className="text-gray-400 hover:text-gray-700 dark:text-white/30 dark:hover:text-white"><X size={18}/></button>
                </div>
                <form onSubmit={handleCreatePeriod} className="space-y-3">
                  <input
                    placeholder="Nom (ex: Juin Semaine 1)"
                    className="w-full rounded-xl bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-200 dark:bg-white/10 dark:text-white dark:placeholder:text-white/30 dark:focus:ring-white/20"
                    value={periodForm.name}
                    onChange={e => setPeriodForm({ ...periodForm, name: e.target.value })}
                    required
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 dark:text-white/30">Début</label>
                      <input
                        type="date"
                        className="w-full rounded-xl bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-200 dark:bg-white/10 dark:text-white dark:focus:ring-white/20"
                        value={periodForm.startDate}
                        onChange={e => setPeriodForm({ ...periodForm, startDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 dark:text-white/30">Fin</label>
                      <input
                        type="date"
                        className="w-full rounded-xl bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-200 dark:bg-white/10 dark:text-white dark:focus:ring-white/20"
                        value={periodForm.endDate}
                        onChange={e => setPeriodForm({ ...periodForm, endDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <button
                    disabled={savingPeriod}
                    className="w-full rounded-full bg-gray-900 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800 disabled:opacity-50 dark:bg-[#B4FF39] dark:text-black dark:hover:bg-[#a3ec2e]"
                  >
                    {savingPeriod ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Confirmer la création"}
                  </button>
                </form>
              </div>
            )}

            {/* Modèles de planning */}
            {templates.length > 0 && (
              <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-white/5 dark:shadow-none">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 dark:text-white/30">
                  <Bookmark size={13} /> Modèles enregistrés
                </h3>
                <div className="space-y-2">
                  {templates.map(tpl => (
                    <div key={tpl.id} className="rounded-xl bg-gray-50 p-3 dark:bg-white/5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate dark:text-white">{tpl.name}</p>
                          <p className="text-[10px] text-gray-400 dark:text-white/30">{tpl.entries.length} créneaux</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setApplyTemplateId(applyTemplateId === tpl.id ? null : tpl.id)}
                            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
                          >
                            <Repeat size={12} /> Appliquer
                          </button>
                          {confirmDeleteTemplateId === tpl.id ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleDeleteTemplate(tpl.id)} className="rounded-lg bg-rose-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-rose-500">OK</button>
                              <button onClick={() => setConfirmDeleteTemplateId(null)} className="rounded-lg bg-gray-200 px-2 py-1 text-[10px] font-bold text-gray-600 dark:bg-white/10 dark:text-white/70">×</button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDeleteTemplateId(tpl.id)} className="p-1.5 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-md dark:text-white/20 dark:hover:bg-rose-500/10">
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                      {applyTemplateId === tpl.id && (
                        <div className="mt-3 flex items-center gap-2 border-t border-white pt-3 dark:border-white/10">
                          <input
                            type="date"
                            value={applyDate}
                            onChange={e => setApplyDate(e.target.value)}
                            className="flex-1 rounded-lg bg-white px-3 py-2 text-xs text-gray-900 outline-none focus:ring-2 focus:ring-gray-200 dark:bg-white/10 dark:text-white dark:focus:ring-white/20"
                          />
                          <button
                            onClick={() => handleApplyTemplate(tpl.id)}
                            disabled={!applyDate || applyingTemplate}
                            className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-xs font-bold text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-[#B4FF39] dark:text-black"
                          >
                            {applyingTemplate ? <Loader2 size={13} className="animate-spin" /> : "OK"}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Formulaire créneau */}
            <div id="shift-form" className="rounded-2xl bg-white p-5 shadow-sm sticky top-24 dark:bg-white/5 dark:shadow-none">
              <div className="flex items-center gap-3 mb-5">
                <div className={`p-2 rounded-lg ${editId ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' : 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-white/50'}`}>
                  {editId ? <Pencil size={16} /> : <Plus size={16} />}
                </div>
                <h3 className="font-bold text-gray-900 text-sm dark:text-white">{editId ? "Modifier le créneau" : "Ajouter un créneau"}</h3>
              </div>

              <form onSubmit={handleAction} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase dark:text-white/30">Période associée</label>
                  <select
                    className={inputClass}
                    value={form.planningId}
                    onChange={e => setForm({ ...form, planningId: e.target.value })}
                  >
                    <option value="">Aucune (Orphelin)</option>
                    {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase dark:text-white/30">Date</label>
                    <input
                      type="date"
                      className={inputClass}
                      value={form.date}
                      onChange={e => setForm({ ...form, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase dark:text-white/30">Shift</label>
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
                  <label className="text-[11px] font-bold text-gray-400 uppercase dark:text-white/30">Assignation</label>
                  <select
                    className={inputClass}
                    value={form.employeeId}
                    onChange={e => setForm({ ...form, employeeId: e.target.value })}
                  >
                    <option value="">Toute l&apos;équipe</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase dark:text-white/30">Note interne</label>
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
                    className={`w-full rounded-full py-3 text-sm font-bold text-white transition flex justify-center items-center gap-2 ${editId ? 'bg-amber-500 hover:bg-amber-400' : 'bg-gray-900 hover:bg-gray-800 dark:bg-[#B4FF39] dark:text-black dark:hover:bg-[#a3ec2e]'}`}
                  >
                    {saving && <Loader2 size={15} className="animate-spin" />}
                    {editId ? "Mettre à jour" : "Ajouter au planning"}
                  </button>
                  {editId && (
                    <button
                      type="button"
                      onClick={() => { setEditId(null); setForm(EMPTY_FORM); }}
                      className="w-full text-xs font-bold text-gray-400 py-2 hover:text-gray-700 dark:text-white/30 dark:hover:text-white"
                    >
                      Annuler les modifications
                    </button>
                  )}
                </div>
              </form>

              {/* Actions secondaires */}
              <div className="mt-6 pt-5 border-t border-gray-50 space-y-5 dark:border-white/5">

                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase flex items-center justify-between dark:text-white/30">
                    Exporter <Download size={12} className="text-gray-300 dark:text-white/20" />
                  </h4>
                  <button
                    onClick={handleExportExcel}
                    className="flex w-full items-center gap-3 rounded-xl bg-gray-50 px-4 py-2.5 transition hover:bg-gray-100 group dark:bg-white/5 dark:hover:bg-white/10"
                  >
                    <Download size={14} className="text-gray-400 group-hover:text-blue-500 dark:text-white/30" />
                    <span className="text-xs font-semibold text-gray-500 group-hover:text-gray-900 dark:text-white/40 dark:group-hover:text-white">Télécharger Excel</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase flex items-center justify-between dark:text-white/30">
                    Import rapide <FileSpreadsheet size={12} className="text-emerald-500" />
                  </h4>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-gray-50 px-4 py-2.5 transition hover:bg-gray-100 group dark:bg-white/5 dark:hover:bg-white/10">
                    <div className="text-gray-400 group-hover:text-emerald-500 dark:text-white/30">
                      {csvImporting ? <Loader2 className="animate-spin" size={14}/> : <Upload size={14} />}
                    </div>
                    <span className="text-xs font-semibold text-gray-500 group-hover:text-gray-900 dark:text-white/40 dark:group-hover:text-white">Excel / CSV</span>
                    <input type="file" className="hidden" accept=".csv,.xlsx,.xls" onChange={handleCsvImport} />
                  </label>
                  {csvResult && (
                    <div className="rounded-lg bg-emerald-50 p-2.5 text-[10px] text-emerald-600 flex justify-between items-center dark:bg-emerald-500/10 dark:text-emerald-400">
                      <span><strong>{csvResult.ok}</strong> créneaux importés</span>
                      <button onClick={() => setCsvResult(null)}><X size={11}/></button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase dark:text-white/30">Planning visuel</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl bg-gray-50 py-3 transition hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10">
                      {uploading1 ? <Loader2 className="animate-spin text-blue-500" size={13}/> : <ImageIcon className="text-gray-400 dark:text-white/30" size={13}/>}
                      <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase dark:text-white/30">S1</span>
                      <input type="file" className="hidden" accept="image/*,.xlsx,.xls,.csv" onChange={e => handleSlotUpload(e, 1)} />
                    </label>
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl bg-gray-50 py-3 transition hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10">
                      {uploading2 ? <Loader2 className="animate-spin text-blue-500" size={13}/> : <ImageIcon className="text-gray-400 dark:text-white/30" size={13}/>}
                      <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase dark:text-white/30">S2</span>
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
    <tr className="group/row hover:bg-gray-50/60 transition-colors dark:hover:bg-white/[0.03]">
      <td className="px-4 py-3.5">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{fmtShiftDate(entry.date)}</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Clock size={11} className="text-blue-500" />
            <span className="text-xs font-bold text-blue-500 uppercase tracking-tighter">{entry.shift}</span>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold ${employee ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' : 'bg-gray-100 text-gray-400 dark:bg-white/10 dark:text-white/30'}`}>
            {employee ? employee.name.substring(0, 2).toUpperCase() : <Users size={12} />}
          </div>
          <span className={`text-sm font-medium ${employee ? 'text-gray-700 dark:text-white/70' : 'text-gray-300 italic dark:text-white/20'}`}>
            {employee?.name ?? "Équipe complète"}
          </span>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <p className="text-xs text-gray-400 max-w-[180px] line-clamp-2 dark:text-white/30">{entry.note || "—"}</p>
      </td>
      {isAdmin && (
        <td className="px-4 py-3.5 text-right">
          {confirmDeleteId === entry.id ? (
            <div className="flex justify-end gap-1">
              <button onClick={() => onDelete(entry.id)} className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-rose-500">Supprimer</button>
              <button onClick={() => setConfirmDeleteId(null)} className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600 hover:bg-gray-200 dark:bg-white/10 dark:text-white/70">Annuler</button>
            </div>
          ) : (
            <div className="flex justify-end gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
              <button onClick={() => onEdit(entry)} className="p-1.5 text-gray-300 hover:text-amber-500 hover:bg-amber-50 rounded-md transition-colors dark:text-white/20 dark:hover:bg-amber-500/10">
                <Pencil size={13} />
              </button>
              <button onClick={() => setConfirmDeleteId(entry.id)} className="p-1.5 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors dark:text-white/20 dark:hover:bg-rose-500/10">
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </td>
      )}
    </tr>
  );
}
