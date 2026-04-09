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
  type SlotData = { type: 'image'; url: string } | { type: 'excel'; rows: string[][]; name: string };
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
        // Init slots depuis le backend
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
    // Scroll smoothly to form
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
        let rows: string[][];
        if (isExcel) {
          const buffer = await file.arrayBuffer();
          const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' });
          rows = (data as unknown[][]).filter((r) => r.length > 0).map((r) =>
            r.map((c) => (c instanceof Date ? c.toISOString().slice(0, 10) : (c != null ? String(c) : '')))
          );
        } else {
          const text = await file.text();
          rows = text.split('\n').filter(Boolean).map(l =>
            l.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
          );
        }
        const slotData: SlotData = { type: 'excel', rows, name: file.name };
        // Sauvegarder en DB via le même endpoint image (préfixe __EXCEL__)
        const endpoint = slot === 2 ? '/admin/planning-image2' : '/admin/planning-image';
        await apiFetchClient<{ planningImageUrl?: string; planningImageUrl2?: string }>(endpoint, {
          method: 'POST',
          body: JSON.stringify({ imageData: '__EXCEL__' + JSON.stringify(slotData) }),
        });
        setSlot(slotData);
      } else {
        // Image upload
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
      // ── Lecture du fichier → tableau de lignes ──────────────────────
      let allRows: string[][];
      const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");

      if (isExcel) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false });
        allRows = (data as unknown[][]).map(r =>
          (r as unknown[]).map(c => (c != null ? String(c) : "").trim())
        );
      } else {
        const text = await file.text();
        const sep = text.includes("\t") ? "\t" : text.includes(";") ? ";" : ",";
        allRows = text.split("\n").filter(l => l.trim()).map(line =>
          line.split(sep).map(c => c.trim().replace(/^"|"$/g, ""))
        );
      }

      const ok_errors: { ok: number; errors: string[] } = { ok: 0, errors: [] };

      // ── Détection du format ─────────────────────────────────────────
      // Format horizontal : les colonnes sont des jours ("Lun 16/06", "Mar 17/06"…)
      const DAY_PREFIXES = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];
      const headerRowIdx = allRows.findIndex(row =>
        row.some(cell => DAY_PREFIXES.some(d => cell.toLowerCase().startsWith(d) && cell.match(/\d{1,2}\/\d{2}/)))
      );

      if (headerRowIdx !== -1) {
        // ── FORMAT HORIZONTAL (planning semaine avec jours en colonnes) ──
        const headers = allRows[headerRowIdx];
        const currentYear = new Date().getFullYear();

        // Trouver les colonnes "jour"
        const dayCols: { idx: number; date: string }[] = [];
        headers.forEach((cell, i) => {
          const m = cell.match(/(\d{1,2})\/(\d{2})(?:\/(\d{4}))?/);
          if (m) {
            const day = m[1].padStart(2, "0");
            const month = m[2].padStart(2, "0");
            const year = m[3] ?? String(currentYear);
            dayCols.push({ idx: i, date: `${year}-${month}-${day}` });
          }
        });

        for (let i = headerRowIdx + 1; i < allRows.length; i++) {
          const row = allRows[i];
          const empName = row[0]?.trim();
          if (!empName || empName.toLowerCase().startsWith("total")) continue;

          const employee = employees.find(emp =>
            emp.name.toLowerCase() === empName.toLowerCase() ||
            emp.name.toLowerCase().includes(empName.toLowerCase()) ||
            empName.toLowerCase().includes(emp.name.toLowerCase())
          );
          if (!employee) {
            ok_errors.errors.push(`Employé "${empName}" introuvable en base — créneaux importés sans assignation`);
          }

          for (const { idx, date } of dayCols) {
            const cell = row[idx]?.trim() ?? "";
            if (!cell || ["repos", "off", "-", ""].includes(cell.toLowerCase())) continue;

            // Parse "09:30 – 18:30 (9h)" → "09:30 – 18:30"
            const shiftMatch = cell.match(/(\d{1,2}:\d{2})\s*[–\-]\s*(\d{1,2}:\d{2})/);
            const shift = shiftMatch ? `${shiftMatch[1]} – ${shiftMatch[2]}` : cell.split("(")[0].trim();

            try {
              await apiFetchClient("/planning", {
                method: "POST",
                body: JSON.stringify({ date: `${date}T00:00:00.000Z`, shift, employeeId: employee?.id }),
              });
              ok_errors.ok++;
            } catch (err: unknown) {
              ok_errors.errors.push(`${empName} ${date}: ${err instanceof Error ? err.message : "erreur"}`);
            }
          }
        }
      } else {
        // ── FORMAT VERTICAL (date, shift, employé, note, planning) ──────
        const dataRows = allRows.filter(r => r.length >= 2 && r[0]);
        for (const cols of dataRows) {
          const [dateRaw, shift, employeeName, note, planningName] = cols;
          if (!dateRaw || !shift) continue;
          let dateStr = dateRaw.trim();
          if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
            const [d, m, y] = dateStr.split("/");
            dateStr = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
          }
          if (isNaN(new Date(dateStr).getTime())) { ok_errors.errors.push(`Date invalide : "${dateRaw}"`); continue; }

          const employee = employeeName ? employees.find(emp => emp.name.toLowerCase() === employeeName.toLowerCase()) : undefined;
          const period = planningName ? periods.find(p => p.name.toLowerCase() === planningName.toLowerCase()) : undefined;
          try {
            await apiFetchClient("/planning", {
              method: "POST",
              body: JSON.stringify({
                date: `${dateStr}T00:00:00.000Z`, shift,
                employeeId: employee?.id,
                note: note || undefined,
                planningId: period?.id,
              }),
            });
            ok_errors.ok++;
          } catch (err: unknown) {
            ok_errors.errors.push(`Ligne "${cols.join(",")}" : ${err instanceof Error ? err.message : "erreur"}`);
          }
        }
      }

      setCsvResult(ok_errors);
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

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center space-y-3">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-gray-200">
          <Loader2 className="animate-spin text-white" size={28} />
        </div>
        <p className="text-sm font-medium text-slate-500">Chargement du planning...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Gestion du Planning</h1>
          <p className="text-sm text-slate-500">Organisation et suivi des effectifs</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowPeriodForm(!showPeriodForm)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-gray-200 transition hover:bg-blue-700 active:scale-95"
          >
            <Plus size={16} /> Nouvelle période
          </button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
          
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-6">

            {/* Planning visuel semaines */}
            {(slot1 || slot2 || isAdmin) && (
              <section className="space-y-4">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                  <LayoutGrid size={14} /> Planning visuel
                </h3>
                <div className="space-y-6">
                  {([slot1, slot2] as const).map((slot, idx) => (
                    <div key={idx}>
                      {/* Séparateur semaine */}
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                          Semaine {idx + 1}
                        </span>
                        <div className="flex-1 h-px bg-slate-200" />
                        {isAdmin && slot && (
                          <button
                            onClick={() => handleDeleteSlot((idx + 1) as 1 | 2)}
                            className="flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold text-rose-500 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 size={13} /> Supprimer
                          </button>
                        )}
                      </div>

                      {slot ? (
                        slot.type === 'image' ? (
                          <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={slot.url}
                              alt={`Planning Semaine ${idx + 1}`}
                              className="w-full object-contain max-h-[420px] cursor-zoom-in"
                              onClick={() => window.open(slot.url, '_blank')}
                            />
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-auto">
                            <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-2">
                              <FileSpreadsheet size={14} className="text-emerald-500" />
                              <span className="text-xs font-semibold text-slate-500">{slot.name}</span>
                            </div>
                            {(() => {
                              if (!myName) return null;
                              const myRowIdx = slot.rows.findIndex((row, i) => i > 0 && row.some(cell => cell.toLowerCase().includes(myName)));
                              if (myRowIdx === -1) return null;
                              const contextStart = Math.max(1, myRowIdx - 2);
                              const previewRows = [slot.rows[0], ...slot.rows.slice(contextStart, myRowIdx + 1)];
                              return (
                                <div className="px-4 pt-4 pb-3 border-b border-slate-100 bg-blue-50/40">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500 mb-2 flex items-center gap-1.5">
                                    <User size={11} /> Mon planning
                                  </p>
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-xs border-collapse">
                                      {previewRows.map((row, ri) => {
                                        const isMyRow = ri > 0 && row.some(cell => cell.toLowerCase().includes(myName));
                                        return (
                                          <tr key={ri} className={ri === 0 ? 'font-bold text-slate-500' : isMyRow ? 'bg-blue-100 font-semibold rounded' : 'text-slate-500'}>
                                            {row.map((cell, ci) => (
                                              <td key={ci} className={`px-3 py-1.5 whitespace-nowrap ${isMyRow ? 'text-blue-700' : ''}`}>
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
                                        ? 'bg-slate-50 font-bold'
                                        : isMe
                                          ? 'bg-blue-50 border-t border-blue-100 font-semibold'
                                          : 'border-t border-slate-100 hover:bg-slate-50/50'
                                    }>
                                      {row.map((cell, ci) => (
                                        <td key={ci} className={`px-3 py-2 whitespace-nowrap ${isMe ? 'text-blue-700' : 'text-slate-700'}`}>
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
                        <label className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-white py-10 transition-all hover:border-blue-300 hover:bg-blue-50/30">
                          <Upload size={20} className="text-slate-300" />
                          <span className="text-sm font-medium text-slate-400">Déposer une image ou un fichier Excel</span>
                          <input type="file" className="hidden" accept="image/*,.xlsx,.xls,.csv" onChange={e => handleSlotUpload(e, (idx + 1) as 1 | 2)} />
                        </label>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-8 text-center text-slate-400 text-sm">
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
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                  <List size={14} /> Périodes actives
                </h3>

                {periods.length === 0 && orphanEntries.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-50">
                      <Calendar className="text-slate-300" size={28} />
                    </div>
                    <h4 className="font-bold text-slate-800">Aucun planning pour le moment</h4>
                    <p className="mt-1.5 text-sm text-slate-400 max-w-xs mx-auto">Créez une nouvelle période ou importez un fichier Excel.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {periods.map(period => (
                      <div key={period.id} className="group rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-blue-200 hover:shadow-md overflow-hidden">
                        <div
                          className="flex cursor-pointer items-center justify-between p-4 sm:p-5"
                          onClick={() => toggleExpand(period.id)}
                        >
                          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${expandedIds.has(period.id) ? 'bg-blue-600 text-white shadow-md shadow-gray-200' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600'}`}>
                              <Calendar size={18} />
                            </div>
                            <div className="min-w-0">
                              <h2 className="font-bold text-slate-900 truncate">{period.name}</h2>
                              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                <span className="text-xs text-slate-400">{fmtDate(period.startDate)} — {fmtDate(period.endDate)}</span>
                                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">{period.entries.length} créneaux</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {isAdmin && (
                              confirmDeletePeriodId === period.id ? (
                                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                  <button onClick={() => handleDeletePeriod(period.id)} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700">Supprimer</button>
                                  <button onClick={() => setConfirmDeletePeriodId(null)} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">Annuler</button>
                                </div>
                              ) : (
                                <button
                                  onClick={e => { e.stopPropagation(); setConfirmDeletePeriodId(period.id); }}
                                  className="rounded-lg p-2 text-slate-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-500"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )
                            )}
                            <div className={`rounded-lg p-1.5 transition-transform ${expandedIds.has(period.id) ? 'rotate-180 text-blue-600' : 'text-slate-300'}`}>
                              <ChevronDown size={18} />
                            </div>
                          </div>
                        </div>

                        {expandedIds.has(period.id) && (
                          <div className="border-t border-slate-50 px-2 pb-2">
                            <div className="overflow-x-auto rounded-xl">
                              <table className="w-full text-left">
                                <thead className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                  <tr>
                                    <th className="px-4 py-4">Date & Horaire</th>
                                    <th className="px-4 py-4">Membre</th>
                                    <th className="px-4 py-4">Notes</th>
                                    {isAdmin && <th className="px-4 py-4 text-right">Actions</th>}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                  {period.entries.length === 0 ? (
                                    <tr>
                                      <td colSpan={4} className="px-4 py-10 text-center">
                                        <p className="text-sm italic text-slate-400">Aucun créneau enregistré pour cette période.</p>
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
                    
                    {/* Orphan entries section */}
                    {orphanEntries.length > 0 && (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50">
                        <div className="p-4 flex items-center gap-2 text-slate-500">
                           <Clock size={18} />
                           <span className="text-sm font-bold uppercase tracking-tight">Créneaux hors période</span>
                        </div>
                        <div className="px-2 pb-2">
                           <table className="w-full text-left">
                              <tbody className="divide-y divide-slate-200/50">
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

          {/* Sidebar - Admin Controls */}
          {isAdmin && (
            <aside className="lg:col-span-4 space-y-6">
              
              {/* Floating Period Form Overlay */}
              {showPeriodForm && (
                <div className="rounded-2xl border-2 border-blue-500 bg-blue-50 p-6 shadow-xl animate-in fade-in slide-in-from-top-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-blue-900">Nouvelle Période</h3>
                    <button onClick={() => setShowPeriodForm(false)} className="text-blue-400 hover:text-blue-600"><X size={20}/></button>
                  </div>
                  <form onSubmit={handleCreatePeriod} className="space-y-4">
                    <input
                      placeholder="Nom (ex: Juin Semaine 1)"
                      className="w-full rounded-xl border-none bg-white px-4 py-3 text-sm shadow-sm focus:ring-2 focus:ring-blue-500"
                      value={periodForm.name}
                      onChange={e => setPeriodForm({ ...periodForm, name: e.target.value })}
                      required
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-blue-400 uppercase ml-1">Début</label>
                        <input
                          type="date"
                          className="w-full rounded-xl border-none bg-white px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-blue-500"
                          value={periodForm.startDate}
                          onChange={e => setPeriodForm({ ...periodForm, startDate: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-blue-400 uppercase ml-1">Fin</label>
                        <input
                          type="date"
                          className="w-full rounded-xl border-none bg-white px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-blue-500"
                          value={periodForm.endDate}
                          onChange={e => setPeriodForm({ ...periodForm, endDate: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <button
                      disabled={savingPeriod}
                      className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-gray-200 transition-all hover:bg-blue-700 disabled:bg-slate-300"
                    >
                      {savingPeriod ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Confirmer la création"}
                    </button>
                  </form>
                </div>
              )}

              {/* Main Shift Form */}
              <div id="shift-form" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sticky top-24">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-2 rounded-lg ${editId ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                    {editId ? <Pencil size={20} /> : <Plus size={20} />}
                  </div>
                  <h3 className="font-bold text-slate-900">{editId ? "Modifier le créneau" : "Ajouter un créneau"}</h3>
                </div>

                <form onSubmit={handleAction} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Période associée</label>
                    <select
                      className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                      value={form.planningId}
                      onChange={e => setForm({ ...form, planningId: e.target.value })}
                    >
                      <option value="">Aucune (Orphelin)</option>
                      {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Date</label>
                      <input
                        type="date"
                        className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                        value={form.date}
                        onChange={e => setForm({ ...form, date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Shift</label>
                      <input
                        placeholder="08h - 16h"
                        className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                        value={form.shift}
                        onChange={e => setForm({ ...form, shift: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Assignation</label>
                    <select
                      className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                      value={form.employeeId}
                      onChange={e => setForm({ ...form, employeeId: e.target.value })}
                    >
                      <option value="">Toute l&apos;équipe</option>
                      {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Note interne</label>
                    <textarea
                      rows={2}
                      placeholder="Informations complémentaires..."
                      className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:bg-white focus:ring-2 focus:ring-blue-500/20 resize-none"
                      value={form.note}
                      onChange={e => setForm({ ...form, note: e.target.value })}
                    />
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      disabled={saving}
                      className={`w-full rounded-xl py-3 text-sm font-bold text-white transition-all flex justify-center items-center gap-2 ${editId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-900 hover:bg-black shadow-lg shadow-slate-200'}`}
                    >
                      {saving && <Loader2 size={16} className="animate-spin" />}
                      {editId ? "Mettre à jour" : "Ajouter au planning"}
                    </button>
                    {editId && (
                      <button
                        type="button"
                        onClick={() => { setEditId(null); setForm(EMPTY_FORM); }}
                        className="w-full text-xs font-bold text-slate-400 py-2 hover:text-slate-600"
                      >
                        Annuler les modifications
                      </button>
                    )}
                  </div>
                </form>

                {/* Secondary Actions (Import/Images) */}
                <div className="mt-8 pt-6 border-t border-slate-100 space-y-6">
                   {/* Export Excel */}
                   <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase">Exporter</h4>
                        <Download size={14} className="text-blue-400" />
                      </div>
                      <button
                        onClick={handleExportExcel}
                        className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition-all hover:bg-blue-50 hover:border-blue-200 group"
                      >
                        <div className="p-2 rounded-lg bg-white shadow-sm group-hover:text-blue-600">
                          <Download size={16} />
                        </div>
                        <span className="text-xs font-semibold text-slate-600">Télécharger Excel</span>
                      </button>
                   </div>

                   {/* CSV Import */}
                   <div className="space-y-3">
                      <div className="flex items-center justify-between">
                         <h4 className="text-[11px] font-bold text-slate-400 uppercase">Import Rapide</h4>
                         <FileSpreadsheet size={14} className="text-emerald-500" />
                      </div>
                      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 transition-all hover:bg-emerald-50 hover:border-emerald-200 group">
                        <div className="p-2 rounded-lg bg-white shadow-sm group-hover:text-emerald-600">
                           {csvImporting ? <Loader2 className="animate-spin" size={16}/> : <Upload size={16} />}
                        </div>
                        <span className="text-xs font-semibold text-slate-600">Excel / CSV</span>
                        <input type="file" className="hidden" accept=".csv,.xlsx,.xls" onChange={handleCsvImport} />
                      </label>
                      {csvResult && (
                        <div className="rounded-lg bg-emerald-50 p-2.5 text-[10px] text-emerald-700 flex justify-between items-center">
                           <span><strong>{csvResult.ok}</strong> créneaux importés</span>
                           <button onClick={() => setCsvResult(null)}><X size={12}/></button>
                        </div>
                      )}
                   </div>

                   {/* Upload Semaine 1 & 2 */}
                   <div className="space-y-3">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase">Planning visuel</h4>
                      <div className="grid grid-cols-2 gap-2">
                         <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 py-3 transition-all hover:bg-blue-50 hover:border-blue-200">
                            {uploading1 ? <Loader2 className="animate-spin text-blue-500" size={14}/> : <ImageIcon className="text-slate-400" size={14}/>}
                            <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase">S1</span>
                            <input type="file" className="hidden" accept="image/*,.xlsx,.xls,.csv" onChange={e => handleSlotUpload(e, 1)} />
                         </label>
                         <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 py-3 transition-all hover:bg-blue-50 hover:border-blue-200">
                            {uploading2 ? <Loader2 className="animate-spin text-blue-500" size={14}/> : <ImageIcon className="text-slate-400" size={14}/>}
                            <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase">S2</span>
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

// ── Subcomponent: EntryRow ──────────────────────────────────────────────────
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
    <tr className="group/row hover:bg-blue-50/30 transition-colors">
      <td className="px-4 py-4">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900">{fmtShiftDate(entry.date)}</span>
          <div className="flex items-center gap-1.5 mt-1">
             <Clock size={12} className="text-blue-500" />
             <span className="text-xs font-bold text-blue-600 uppercase tracking-tighter">{entry.shift}</span>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold ${employee ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
            {employee ? employee.name.substring(0, 2).toUpperCase() : <Users size={14} />}
          </div>
          <span className={`text-sm font-medium ${employee ? 'text-slate-700' : 'text-slate-400 italic'}`}>
            {employee?.name ?? "Équipe complète"}
          </span>
        </div>
      </td>
      <td className="px-4 py-4">
        <p className="text-xs text-slate-500 max-w-[180px] line-clamp-2">{entry.note || "—"}</p>
      </td>
      {isAdmin && (
        <td className="px-4 py-4 text-right">
          <div className="flex justify-end gap-1">
            {confirmDeleteId === entry.id ? (
              <>
                <button onClick={() => onDelete(entry.id)} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700">Supprimer</button>
                <button onClick={() => setConfirmDeleteId(null)} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200">Annuler</button>
              </>
            ) : (
              <div className="flex gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                <button onClick={() => onEdit(entry)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={() => setConfirmDeleteId(entry.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        </td>
      )}
    </tr>
  );
}