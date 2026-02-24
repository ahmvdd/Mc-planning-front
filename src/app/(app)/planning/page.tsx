"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetchClient, getToken } from "@/lib/clientApi";
import { 
  Calendar, Clock, User, Users, Plus,
  Trash2, Pencil, Image as ImageIcon, Upload, 
  Loader2, ChevronRight, XCircle 
} from "lucide-react";

// --- Types ---
type PlanningEntry = { id: number; date: string; shift: string; note?: string | null; employeeId?: number | null };
type EmployeeOption = { id: number; name: string };

export default function PlanningPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<PlanningEntry[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<{ role?: string } | null>(null);
  const [planningImageUrl, setPlanningImageUrl] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ date: "", shift: "", employeeId: "", note: "" });

  const isAdmin = me?.role === "admin";

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }

    Promise.all([
      apiFetchClient<PlanningEntry[]>("/planning"),
      apiFetchClient<EmployeeOption[]>("/employees"),
      apiFetchClient<{ role?: string }>("/auth/me").catch(() => null),
      apiFetchClient<{ planningImageUrl: string | null }>("/planning/image").catch(() => ({ planningImageUrl: null })),
    ])
    .then(([planning, emps, meData, img]) => {
      setEntries(planning);
      setEmployees(emps);
      setMe(meData);
      setPlanningImageUrl(img.planningImageUrl);
    })
    .catch(err => setError(err.message))
    .finally(() => setLoading(false));
  }, [router]);

  // --- Fonctions de gestion (Ajoutées/Corrigées) ---

  const handleEdit = (entry: PlanningEntry) => {
    setEditId(entry.id);
    // On formate la date en YYYY-MM-DD pour l'input type="date"
    const formattedDate = entry.date.split('T')[0];
    setForm({
      date: formattedDate,
      shift: entry.shift,
      employeeId: entry.employeeId ? String(entry.employeeId) : "",
      note: entry.note || "",
    });
    // Scroll vers le formulaire sur mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer ce créneau ?")) return;
    try {
      await apiFetchClient(`/planning/${id}`, { method: "DELETE" });
      setEntries(prev => prev.filter(item => item.id !== id));
    } catch (err: any) {
      alert("Erreur lors de la suppression : " + err.message);
    }
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        date: form.date ? `${form.date}T00:00:00.000Z` : "",
        shift: form.shift.trim(),
        employeeId: form.employeeId ? Number(form.employeeId) : undefined,
        note: form.note.trim() || undefined,
      };

      if (editId) {
        const updated = await apiFetchClient<PlanningEntry>(`/planning/${editId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setEntries(prev => prev.map(item => item.id === editId ? updated : item));
      } else {
        const created = await apiFetchClient<PlanningEntry>("/planning", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setEntries(prev => [created, ...prev]);
      }
      setForm({ date: "", shift: "", employeeId: "", note: "" });
      setEditId(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const response = await apiFetchClient<{ planningImageUrl: string | null }>("/admin/planning-image", {
          method: "POST",
          body: JSON.stringify({ imageData: reader.result }),
        });
        setPlanningImageUrl(response.planningImageUrl ?? String(reader.result));
      };
    } catch (err: any) {
      alert(err.message);
    } finally {
      setImageUploading(false);
    }
  };

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
            <h1 className="mt-3 text-4xl font-extrabold text-slate-900 tracking-tight">Planning Hebdomadaire</h1>
            <p className="mt-2 text-slate-500">Gérez les rotations et consultez les affectations d'équipe.</p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-2 border border-slate-100">
              <span className="px-3 text-xs font-bold text-slate-400 uppercase tracking-tighter">Mode Admin</span>
              <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            </div>
          )}
        </div>
      </header>

      <section className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6">
          {/* Image View Area */}
          {planningImageUrl && (
            <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-hover hover:shadow-md">
              <div className="absolute top-4 left-4 z-10">
                <span className="flex items-center gap-2 rounded-full bg-white/90 backdrop-blur px-3 py-1.5 text-[10px] font-bold text-slate-800 shadow-sm uppercase">
                  <ImageIcon size={14} className="text-indigo-500" /> Version Image
                </span>
              </div>
              <img src={planningImageUrl} alt="Planning Global" className="h-auto w-full object-contain max-h-[400px]" />
            </div>
          )}

          {/* Table Data */}
          <div className="rounded-3xl border border-slate-200/60 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/30 px-6 py-4 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Clock size={16} className="text-indigo-500" /> Détails des créneaux
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 text-[10px] font-bold uppercase text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Date & Heure</th>
                    <th className="px-6 py-4">Assignation</th>
                    <th className="px-6 py-4">Note</th>
                    {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {entries.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">Aucune donnée disponible.</td></tr>
                  ) : (
                    entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800">{new Date(entry.date).toLocaleDateString("fr-FR", { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                          <p className="text-xs text-indigo-600 font-medium">{entry.shift}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold ${entry.employeeId ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                              {entry.employeeId ? <User size={14} /> : <Users size={14} />}
                            </div>
                            <span className="font-medium text-slate-700">
                              {employees.find(e => e.id === entry.employeeId)?.name ?? "Toute l'équipe"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 italic max-w-[150px] truncate">
                          {entry.note || "—"}
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1">
                              <button onClick={() => handleEdit(entry)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Pencil size={15} /></button>
                              <button onClick={() => handleDelete(entry.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 size={15} /></button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Admin Sidebar */}
        {isAdmin && (
          <div className="lg:col-span-4 space-y-6">
            {/* Upload Box */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Upload size={16} className="text-indigo-500" /> Planning Image
              </h3>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-8 hover:bg-indigo-50/30 hover:border-indigo-200 transition-all">
                {imageUploading ? (
                  <Loader2 className="animate-spin text-indigo-500" />
                ) : (
                  <>
                    <Upload className="mb-2 text-slate-400" size={24} />
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Choisir un fichier</span>
                  </>
                )}
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>

            {/* Entry Form */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-6">
                {editId ? <Pencil size={16} className="text-indigo-500" /> : <Plus size={16} className="text-indigo-500" />}
                {editId ? "Modifier le shift" : "Nouveau shift"}
              </h3>
              <form onSubmit={handleAction} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Date</label>
                  <input 
                    type="date" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                    value={form.date} onChange={e => setForm({...form, date: e.target.value})} required 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Horaires (Shift)</label>
                  <input 
                    placeholder="ex: 09:00 - 17:00" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                    value={form.shift} onChange={e => setForm({...form, shift: e.target.value})} required 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Employé assigné</label>
                  <select 
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                    value={form.employeeId} onChange={e => setForm({...form, employeeId: e.target.value})}
                  >
                    <option value="">Toute l'équipe</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Note (facultatif)</label>
                  <textarea 
                    rows={2} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 resize-none"
                    value={form.note} onChange={e => setForm({...form, note: e.target.value})}
                  />
                </div>
                <div className="pt-4 flex flex-col gap-2">
                  <button 
                    disabled={saving} 
                    className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white hover:bg-indigo-600 disabled:bg-slate-300 transition-all flex justify-center items-center gap-2"
                  >
                    {saving && <Loader2 size={16} className="animate-spin" />}
                    {editId ? "Mettre à jour" : "Valider le shift"}
                  </button>
                  {editId && (
                    <button type="button" onClick={() => { setEditId(null); setForm({date:"", shift:"", employeeId:"", note:""}); }} className="w-full text-xs font-bold text-slate-400 py-2 hover:text-slate-600">
                      Annuler
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}