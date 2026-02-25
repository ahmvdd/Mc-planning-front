"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { apiFetchClient, getToken } from "@/lib/clientApi";
import {
  Users, UserCheck, Pencil, Trash2,
  UserPlus, Loader2, Mail, Shield, CheckCircle2
} from "lucide-react";

// --- Types ---
type Employee = { id: number; name: string; email: string; role: string; status: string };

// --- Sous-composant StatCard ---
const StatCard = ({ icon: Icon, value, label, colorClass }: any) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
    <div className="flex items-center gap-3">
      <div className={`rounded-xl p-2 ${colorClass.bg}`}>
        <Icon size={20} className={colorClass.text} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      </div>
    </div>
  </div>
);

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<{ role?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: "", status: "active", password: "" });

  const isAdmin = me?.role === "admin";

  // Initialisation
  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    
    Promise.all([
      apiFetchClient<Employee[]>("/employees"),
      apiFetchClient<{ role?: string }>("/auth/me").catch(() => null),
    ])
    .then(([data, meData]) => {
      setEmployees(data);
      if (meData) setMe(meData);
    })
    .catch(() => {})
    .finally(() => setLoading(false));
  }, [router]);

  // Statistiques calculées
  const stats = useMemo(() => {
    const active = employees.filter(e => e.status === "active").length;
    return { total: employees.length, active, inactive: employees.length - active };
  }, [employees]);

  // Handlers
  const resetForm = () => {
    setForm({ name: "", email: "", role: "", status: "active", password: "" });
    setEditId(null);
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        const updated = await apiFetchClient<Employee>(`/employees/${editId}`, {
          method: "PATCH",
          body: JSON.stringify({ ...form, password: undefined }),
        });
        setEmployees(prev => prev.map(emp => emp.id === editId ? updated : emp));
      } else {
        const created = await apiFetchClient<Employee>("/employees", {
          method: "POST",
          body: JSON.stringify(form),
        });
        setEmployees(prev => [created, ...prev]);
      }
      resetForm();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteEmployee = async (id: number) => {
    if (!confirm("Supprimer définitivement cet employé ?")) return;
    setSaving(true);
    try {
      await apiFetchClient(`/employees/${id}`, { method: "DELETE" });
      setEmployees(prev => prev.filter(e => e.id !== id));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center text-indigo-500">
      <Loader2 className="animate-spin" size={40} />
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-6">
      {/* Header avec Dégradé Doux */}
      <header className="relative overflow-hidden rounded-[40px] border border-slate-200/60 bg-white p-6 md:p-10 shadow-xl shadow-indigo-500/5">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-50/50 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="space-y-2">
            <span className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-indigo-600">
              Annuaire RH
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Gestion d'Équipe</h1>
            <p className="text-slate-500">Pilotez vos effectifs et gérez les accès plateforme.</p>
          </div>

          <div className="flex gap-3">
            <StatCard icon={Users} value={stats.total} label="Total" colorClass={{bg: "bg-indigo-50", text: "text-indigo-600"}} />
            <StatCard icon={UserCheck} value={stats.active} label="Actifs" colorClass={{bg: "bg-emerald-50", text: "text-emerald-600"}} />
          </div>
        </div>
      </header>

      <section className="grid gap-8 lg:grid-cols-12">
        {/* Table Column */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold text-slate-800">Liste des collaborateurs</h2>
          </div>
          
          <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 text-[11px] font-bold uppercase text-slate-400">
                <tr>
                  <th className="px-6 py-4">Collaborateur</th>
                  <th className="px-6 py-4">Rôle / Statut</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 font-bold text-slate-600 shadow-inner">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{emp.name}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Mail size={12} /> {emp.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="flex w-fit items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                          <Shield size={10} /> {emp.role.toUpperCase()}
                        </span>
                        <span className={`text-[10px] font-medium ${emp.status === 'active' ? 'text-emerald-500' : 'text-slate-400'}`}>
                          ● {emp.status === 'active' ? 'En poste' : 'Inactif'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => { setEditId(emp.id); setForm({...emp, password: ""}); }}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          disabled={!isAdmin}
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => deleteEmployee(emp.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          disabled={!isAdmin || saving}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Form Column */}
        <div className="lg:col-span-4">
          <div className="sticky top-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-indigo-500/5">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              {editId ? <Pencil className="text-indigo-500" size={20} /> : <UserPlus className="text-indigo-500" size={20} />}
              {editId ? "Modifier le profil" : "Nouveau membre"}
            </h3>
            
            <form onSubmit={handleAction} className="mt-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Nom Complet</label>
                <input 
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  value={form.name} onChange={e => setForm({...form, name: e.target.value})} required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Email Professionnel</label>
                <input 
                  type="email"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  value={form.email} onChange={e => setForm({...form, email: e.target.value})} required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Rôle</label>
                  <input 
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                    value={form.role} onChange={e => setForm({...form, role: e.target.value})} required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Statut</label>
                  <select 
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                    value={form.status} onChange={e => setForm({...form, status: e.target.value})}
                  >
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                  </select>
                </div>
              </div>

              {!editId && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Mot de passe</label>
                  <input 
                    type="password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                    value={form.password} onChange={e => setForm({...form, password: e.target.value})} required
                  />
                </div>
              )}

              <div className="pt-4 space-y-3">
                <button 
                  type="submit"
                  disabled={!isAdmin || saving}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white hover:bg-indigo-600 disabled:bg-slate-300 transition-all shadow-lg shadow-slate-900/10"
                >
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                  {editId ? "Enregistrer les modifications" : "Créer le compte"}
                </button>
                {editId && (
                  <button 
                    type="button" onClick={resetForm}
                    className="w-full rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all"
                  >
                    Annuler
                  </button>
                )}
              </div>
              
              {!isAdmin && (
                <p className="text-[10px] text-center text-amber-600 font-bold bg-amber-50 p-2 rounded-lg">
                  Droits d'administrateur requis pour modifier.
                </p>
              )}
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}