"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { apiFetchClient, getToken } from "@/lib/clientApi";
import {
  Users, Pencil, Trash2,
  UserPlus, Loader2, Mail, Shield, CheckCircle2, X,
  Search, ChevronLeft, ChevronRight
} from "lucide-react";

const PAGE_SIZE = 15;

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
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const isAdmin = me?.role === "admin";

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    Promise.all([
      apiFetchClient<Employee[]>("/employees"),
      apiFetchClient<{ role?: string }>("/auth/me").catch(() => null),
    ])
    .then(([data, meData]) => { setEmployees(data); if (meData) setMe(meData); })
    .catch(() => {})
    .finally(() => setLoading(false));
  }, [router]);

  const stats = useMemo(() => {
    const active = employees.filter(e => e.status === "active").length;
    return { total: employees.length, active, inactive: employees.length - active };
  }, [employees]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return employees;
    return employees.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      e.role.toLowerCase().includes(q)
    );
  }, [employees, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (v: string) => { setSearch(v); setPage(1); };

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
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur");
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
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
          <Loader2 className="animate-spin text-blue-600" size={28} />
        </div>
        <p className="text-sm font-medium text-slate-500">Chargement de l&apos;équipe...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Gestion d&apos;Équipe</h1>
          <p className="text-sm text-slate-500">Pilotez vos effectifs et gérez les accès</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <div className="rounded-xl bg-blue-50 px-4 py-2 text-center">
              <p className="text-lg font-bold text-blue-600">{stats.total}</p>
              <p className="text-[10px] font-bold uppercase text-blue-400">Total</p>
            </div>
            <div className="rounded-xl bg-emerald-50 px-4 py-2 text-center">
              <p className="text-lg font-bold text-emerald-600">{stats.active}</p>
              <p className="text-[10px] font-bold uppercase text-emerald-400">Actifs</p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-gray-200 transition hover:bg-blue-700 active:scale-95"
            >
              <UserPlus size={15} /> Nouveau membre
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Table */}
        <div className="lg:col-span-8 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher par nom, email ou rôle…"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-500/15 shadow-sm transition-all"
            />
            {search && (
              <button onClick={() => handleSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>

          {employees.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-50">
                <Users className="text-slate-300" size={28} />
              </div>
              <h4 className="font-bold text-slate-900">Aucun collaborateur</h4>
              <p className="mx-auto mt-1.5 max-w-xs text-sm text-slate-400">Ajoutez votre premier membre via le bouton &quot;Nouveau membre&quot;.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
              <Search className="mx-auto mb-3 text-slate-300" size={28} />
              <p className="font-bold text-slate-600">Aucun résultat pour &quot;<span className="text-blue-600">{search}</span>&quot;</p>
              <button onClick={() => handleSearch("")} className="mt-2 text-xs text-slate-400 underline hover:text-blue-600">Effacer</button>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70">
                      <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Collaborateur</th>
                      <th className="hidden sm:table-cell px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Rôle / Statut</th>
                      {isAdmin && <th className="px-6 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginated.map(emp => (
                      <tr key={emp.id} className="group hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                              {emp.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{emp.name}</p>
                              <p className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                                <Mail size={10} /> {emp.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="flex w-fit items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                              <Shield size={9} /> {emp.role.toUpperCase()}
                            </span>
                            <span className={`text-[10px] font-medium ${emp.status === "active" ? "text-emerald-500" : "text-slate-400"}`}>
                              ● {emp.status === "active" ? "En poste" : "Inactif"}
                            </span>
                          </div>
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => { setEditId(emp.id); setForm({ ...emp, password: "" }); setShowForm(true); }}
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-amber-50 hover:text-amber-600"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => deleteEmployee(emp.id)}
                                disabled={saving}
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">
                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} sur{" "}
                    <span className="font-bold text-slate-600">{filtered.length}</span>
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft size={13} /> Préc.
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                      .reduce<(number | "…")[]>((acc, n, i, arr) => {
                        if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push("…");
                        acc.push(n);
                        return acc;
                      }, [])
                      .map((n, i) =>
                        n === "…" ? (
                          <span key={`e-${i}`} className="px-1 text-xs text-slate-300">…</span>
                        ) : (
                          <button
                            key={n}
                            onClick={() => setPage(n as number)}
                            className={`min-w-[28px] rounded-lg px-2 py-1.5 text-xs font-bold transition ${page === n ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"}`}
                          >
                            {n}
                          </button>
                        )
                      )}
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                    >
                      Suiv. <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Form sidebar */}
        {showForm && isAdmin && (
          <aside className="lg:col-span-4">
            <div className="sticky top-24 rounded-2xl border-2 border-blue-500 bg-white shadow-xl shadow-gray-200 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${editId ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"}`}>
                    {editId ? <Pencil size={15} /> : <UserPlus size={15} />}
                  </div>
                  <h3 className="font-bold text-slate-900">{editId ? "Modifier le profil" : "Nouveau membre"}</h3>
                </div>
                <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 transition">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAction} className="space-y-4 p-6">
                {[
                  { label: "Nom complet", key: "name", type: "text" },
                  { label: "Email", key: "email", type: "email" },
                ].map(({ label, key, type }) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</label>
                    <input
                      type={type}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-500/15 transition-all"
                      value={form[key as keyof typeof form]}
                      onChange={e => setForm({ ...form, [key]: e.target.value })}
                      required
                    />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Rôle", key: "role", options: [{ v: "employee", l: "Employé" }, { v: "admin", l: "Admin" }] },
                    { label: "Statut", key: "status", options: [{ v: "active", l: "Actif" }, { v: "inactive", l: "Inactif" }] },
                  ].map(({ label, key, options }) => (
                    <div key={key} className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</label>
                      <select
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-500/15"
                        value={form[key as keyof typeof form]}
                        onChange={e => setForm({ ...form, [key]: e.target.value })}
                      >
                        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                {!editId && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Mot de passe</label>
                    <input
                      type="password"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-500/15 transition-all"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      required
                    />
                  </div>
                )}
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={saving}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all ${editId ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-600 hover:bg-blue-700 shadow-md shadow-gray-200"} disabled:opacity-60`}
                  >
                    {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                    {editId ? "Enregistrer" : "Créer le compte"}
                  </button>
                  <button type="button" onClick={resetForm} className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-600">
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
