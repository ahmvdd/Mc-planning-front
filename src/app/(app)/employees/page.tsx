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

  const inputClass = "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all";

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="animate-spin text-zinc-500" size={28} />
    </div>
  );

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Gestion d&apos;Équipe</h1>
          <p className="text-sm text-zinc-500">Pilotez vos effectifs et gérez les accès</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-6">
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Total</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">{stats.active}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Actifs</p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500 active:scale-95"
            >
              <UserPlus size={15} /> Nouveau membre
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">

        {/* Table */}
        <div className="lg:col-span-8 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher par nom, email ou rôle…"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
            />
            {search && (
              <button onClick={() => handleSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                <X size={14} />
              </button>
            )}
          </div>

          {employees.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="mx-auto mb-3 text-zinc-700" size={32} />
              <h4 className="font-bold text-zinc-400">Aucun collaborateur</h4>
              <p className="mt-1 text-sm text-zinc-600">Ajoutez votre premier membre.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Search className="mx-auto mb-3 text-zinc-700" size={24} />
              <p className="font-bold text-zinc-400">Aucun résultat pour &quot;<span className="text-blue-400">{search}</span>&quot;</p>
              <button onClick={() => handleSearch("")} className="mt-2 text-xs text-zinc-500 underline hover:text-zinc-300">Effacer</button>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border border-zinc-800">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/60">
                      <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">Collaborateur</th>
                      <th className="hidden sm:table-cell px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">Rôle / Statut</th>
                      {isAdmin && <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-zinc-500">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {paginated.map(emp => (
                      <tr key={emp.id} className="group hover:bg-zinc-900/40 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-sm font-bold text-blue-400">
                              {emp.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-white">{emp.name}</p>
                              <p className="flex items-center gap-1 text-xs text-zinc-500 mt-0.5">
                                <Mail size={10} /> {emp.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-5 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="flex w-fit items-center gap-1 rounded-md bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                              <Shield size={9} /> {emp.role.toUpperCase()}
                            </span>
                            <span className={`text-[10px] font-medium ${emp.status === "active" ? "text-emerald-400" : "text-zinc-600"}`}>
                              ● {emp.status === "active" ? "En poste" : "Inactif"}
                            </span>
                          </div>
                        </td>
                        {isAdmin && (
                          <td className="px-5 py-4 text-right">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => { setEditId(emp.id); setForm({ ...emp, password: "" }); setShowForm(true); }}
                                className="rounded-lg p-2 text-zinc-500 transition hover:bg-amber-500/10 hover:text-amber-400"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => deleteEmployee(emp.id)}
                                disabled={saving}
                                className="rounded-lg p-2 text-zinc-500 transition hover:bg-rose-500/10 hover:text-rose-400"
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

              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-zinc-500">
                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} sur{" "}
                    <span className="font-bold text-zinc-300">{filtered.length}</span>
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-500 hover:bg-zinc-800 hover:text-white disabled:opacity-30 transition-colors"
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
                          <span key={`e-${i}`} className="px-1 text-xs text-zinc-600">…</span>
                        ) : (
                          <button
                            key={n}
                            onClick={() => setPage(n as number)}
                            className={`min-w-[28px] rounded-lg px-2 py-1.5 text-xs font-bold transition ${page === n ? "bg-blue-600 text-white" : "text-zinc-500 hover:bg-zinc-800 hover:text-white"}`}
                          >
                            {n}
                          </button>
                        )
                      )}
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-500 hover:bg-zinc-800 hover:text-white disabled:opacity-30 transition-colors"
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
            <div className="sticky top-24 rounded-xl border border-zinc-700 bg-zinc-900 overflow-hidden">
              <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${editId ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"}`}>
                    {editId ? <Pencil size={14} /> : <UserPlus size={14} />}
                  </div>
                  <h3 className="font-bold text-white text-sm">{editId ? "Modifier le profil" : "Nouveau membre"}</h3>
                </div>
                <button onClick={resetForm} className="text-zinc-500 hover:text-zinc-300 transition">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAction} className="space-y-4 p-5">
                {[
                  { label: "Nom complet", key: "name", type: "text" },
                  { label: "Email", key: "email", type: "email" },
                ].map(({ label, key, type }) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">{label}</label>
                    <input
                      type={type}
                      className={inputClass}
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
                      <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">{label}</label>
                      <select
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
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
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Mot de passe</label>
                    <input
                      type="password"
                      className={inputClass}
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
                    className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all ${editId ? "bg-amber-500 hover:bg-amber-400" : "bg-blue-600 hover:bg-blue-500"} disabled:opacity-60`}
                  >
                    {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                    {editId ? "Enregistrer" : "Créer le compte"}
                  </button>
                  <button type="button" onClick={resetForm} className="w-full py-2 text-xs font-bold text-zinc-500 hover:text-zinc-300">
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
