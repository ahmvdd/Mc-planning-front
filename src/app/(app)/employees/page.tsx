"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { apiFetchClient, getToken } from "@/lib/clientApi";
import {
  Users, UserCheck, Pencil, Trash2,
  UserPlus, Loader2, Mail, Shield, CheckCircle2, X
} from "lucide-react";

type Employee = { id: number; name: string; email: string; role: string; status: string };

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<{ role?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "employee", status: "active", password: "" });

  const isAdmin = me?.role === "admin";

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

  const stats = useMemo(() => {
    const active = employees.filter(e => e.status === "active").length;
    return { total: employees.length, active, inactive: employees.length - active };
  }, [employees]);

  const resetForm = () => {
    setForm({ name: "", email: "", role: "employee", status: "active", password: "" });
    setEditId(null);
    setShowForm(false);
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
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
        <p className="text-slate-500 font-medium animate-pulse">Chargement de l'équipe...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Header sticky */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestion d'Équipe</h1>
            <p className="text-sm text-slate-500">Pilotez vos effectifs et gérez les accès</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-3">
              <div className="rounded-xl bg-indigo-50 px-4 py-2 text-center">
                <p className="text-lg font-bold text-indigo-600">{stats.total}</p>
                <p className="text-[10px] font-bold uppercase text-indigo-400">Total</p>
              </div>
              <div className="rounded-xl bg-emerald-50 px-4 py-2 text-center">
                <p className="text-lg font-bold text-emerald-600">{stats.active}</p>
                <p className="text-[10px] font-bold uppercase text-emerald-400">Actifs</p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={() => { resetForm(); setShowForm(true); }}
                className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200"
              >
                <UserPlus size={16} /> Nouveau membre
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-12">

          {/* Table */}
          <div className="lg:col-span-8 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Users size={16} /> Collaborateurs
            </h3>

            {employees.length === 0 ? (
              <div className="rounded-[2rem] border-2 border-dashed border-slate-200 bg-white p-12 text-center">
                <div className="mx-auto w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                  <Users className="text-slate-300" size={32} />
                </div>
                <h4 className="text-slate-900 font-bold text-lg">Aucun collaborateur</h4>
                <p className="text-slate-500 max-w-xs mx-auto mt-2">Ajoutez votre premier membre via le bouton "Nouveau membre".</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Collaborateur</th>
                      <th className="hidden sm:table-cell px-6 py-4">Rôle / Statut</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employees.map(emp => (
                      <tr key={emp.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 font-bold text-indigo-600 text-sm">
                              {emp.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{emp.name}</p>
                              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                <Mail size={11} /> {emp.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <span className="flex w-fit items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                              <Shield size={10} /> {emp.role.toUpperCase()}
                            </span>
                            <span className={`text-[10px] font-medium ${emp.status === "active" ? "text-emerald-500" : "text-slate-400"}`}>
                              ● {emp.status === "active" ? "En poste" : "Inactif"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => { setEditId(emp.id); setForm({ ...emp, password: "" }); setShowForm(true); }}
                                  className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  onClick={() => deleteEmployee(emp.id)}
                                  disabled={saving}
                                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Form sidebar */}
          {(showForm && isAdmin) && (
            <aside className="lg:col-span-4">
              <div className="rounded-2xl border-2 border-indigo-500 bg-white p-6 shadow-xl shadow-indigo-500/10 sticky top-24 animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${editId ? "bg-amber-50 text-amber-600" : "bg-indigo-50 text-indigo-600"}`}>
                      {editId ? <Pencil size={18} /> : <UserPlus size={18} />}
                    </div>
                    <h3 className="font-bold text-slate-900">{editId ? "Modifier le profil" : "Nouveau membre"}</h3>
                  </div>
                  <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleAction} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Nom complet</label>
                    <input
                      className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Email</label>
                    <input
                      type="email"
                      className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Rôle</label>
                      <select
                        className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                      >
                        <option value="employee">Employé</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Statut</label>
                      <select
                        className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                      >
                        <option value="active">Actif</option>
                        <option value="inactive">Inactif</option>
                      </select>
                    </div>
                  </div>
                  {!editId && (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Mot de passe</label>
                      <input
                        type="password"
                        className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required
                      />
                    </div>
                  )}
                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className={`w-full rounded-xl py-3 text-sm font-bold text-white flex justify-center items-center gap-2 transition-all ${editId ? "bg-amber-500 hover:bg-amber-600" : "bg-slate-900 hover:bg-black shadow-lg shadow-slate-200"}`}
                    >
                      {saving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                      {editId ? "Enregistrer" : "Créer le compte"}
                    </button>
                    <button type="button" onClick={resetForm} className="w-full text-xs font-bold text-slate-400 py-2 hover:text-slate-600">
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}
