"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { apiFetchClient, getToken } from "@/lib/clientApi";

type Employee = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
};

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<{ role?: string } | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
    status: "active",
    password: "",
  });
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      setError("Connexion requise");
      router.push("/login");
      return;
    }

    Promise.all([
      apiFetchClient<Employee[]>("/employees"),
      apiFetchClient<{ role?: string }>("/auth/me").catch(() => null),
    ])
      .then(([data, meData]) => {
        setEmployees(data);
        if (meData) setMe(meData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"))
      .finally(() => setLoading(false));
  }, []);

  const resetForm = () => {
    setForm({ name: "", email: "", role: "", status: "active", password: "" });
    setEditId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setActionError(null);
    try {
      if (!editId && !form.password.trim()) {
        setActionError("Le mot de passe est obligatoire.");
        return;
      }
      if (editId) {
        const payload = {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role.trim(),
          status: form.status,
        };
        const updated = await apiFetchClient<Employee>(`/employees/${editId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setEmployees((prev) => prev.map((item) => (item.id === editId ? updated : item)));
      } else {
        const payload = {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role.trim(),
          status: form.status,
          password: form.password.trim(),
        };
        const created = await apiFetchClient<Employee>("/employees", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setEmployees((prev) => [created, ...prev]);
      }
      resetForm();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditId(employee.id);
    setForm({
      name: employee.name,
      email: employee.email,
      role: employee.role,
      status: employee.status,
      password: "",
    });
  };

  const handleDelete = async (employeeId: number) => {
    if (!confirm("Supprimer cet employé ?")) return;
    setSaving(true);
    setActionError(null);
    try {
      await apiFetchClient(`/employees/${employeeId}`, { method: "DELETE" });
      setEmployees((prev) => prev.filter((item) => item.id !== employeeId));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const activeCount = employees.filter((employee) => employee.status === "active").length;
  const inactiveCount = employees.length - activeCount;

  return (
    <div className="space-y-10">
      <header className="relative overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-indigo-50 via-white to-rose-50 p-8 shadow-2xl shadow-indigo-500/10">
        <div className="absolute -left-20 -top-20 h-52 w-52 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-52 w-52 rounded-full bg-rose-200/40 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
            Employés
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-zinc-900">
            Gestion des employés
          </h1>
          <p className="mt-3 text-zinc-600">
            Ajoutez des employés, mettez à jour leurs informations et consultez
            leur statut.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 text-sm text-zinc-600 shadow-sm">
              <p className="text-2xl font-semibold text-zinc-900">{employees.length}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                Total employés
              </p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 text-sm text-zinc-600 shadow-sm">
              <p className="text-2xl font-semibold text-emerald-600">{activeCount}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                Actifs
              </p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 text-sm text-zinc-600 shadow-sm">
              <p className="text-2xl font-semibold text-zinc-500">{inactiveCount}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                Inactifs
              </p>
            </div>
          </div>
        </div>
        {loading && <p className="mt-4 text-sm text-zinc-500">Chargement...</p>}
        {error && (
          <div className="mt-4 space-y-3 text-sm text-zinc-700">
            <p>{error}</p>
            <div className="flex gap-3">
              <Link
                href="/login"
                className="rounded bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Se connecter
              </Link>
              <Link
                href="/signup"
                className="rounded border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700"
              >
                S'inscrire
              </Link>
            </div>
          </div>
        )}
      </header>

      {!error && !loading && (
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-lg shadow-indigo-500/10 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Liste des employés</h2>
                <p className="text-xs text-zinc-500">Vue d'ensemble de l'équipe</p>
              </div>
              {actionError && (
                <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">
                  {actionError}
                </span>
              )}
            </div>
            <div className="mt-5 overflow-hidden rounded-2xl border border-zinc-100 bg-white">
              <div className="grid grid-cols-5 bg-zinc-50 text-xs font-semibold uppercase text-zinc-500">
                <div className="px-4 py-3">Nom</div>
                <div className="px-4 py-3">Poste</div>
                <div className="px-4 py-3">Statut</div>
                <div className="px-4 py-3">Contact</div>
                <div className="px-4 py-3 text-right">Actions</div>
              </div>
              {employees.length === 0 ? (
                <div className="border-t border-zinc-100 px-4 py-10 text-sm text-zinc-500">
                  Aucun employé trouvé. Ajoutez votre première recrue.
                </div>
              ) : (
                employees.map((employee) => (
                  <div
                    key={employee.id}
                    className="grid grid-cols-5 border-t border-zinc-100 px-4 py-4 text-sm transition hover:bg-zinc-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">
                        {employee.name
                          .split(" ")
                          .map((part) => part[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </div>
                      <p className="font-semibold text-zinc-900">{employee.name}</p>
                    </div>
                    <p className="text-zinc-600">
                      <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-600">
                        {employee.role}
                      </span>
                    </p>
                    <p
                      className={
                        employee.status === "active"
                          ? "text-emerald-600"
                          : "text-zinc-500"
                      }
                    >
                      <span
                        className={
                          employee.status === "active"
                            ? "rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-600"
                            : "rounded-full bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-500"
                        }
                      >
                        {employee.status === "active" ? "Actif" : "Inactif"}
                      </span>
                    </p>
                    <p className="text-zinc-600">{employee.email}</p>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(employee)}
                        className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600 transition hover:border-zinc-300"
                        disabled={me?.role !== "admin"}
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(employee.id)}
                        className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300"
                        disabled={saving || me?.role !== "admin"}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-lg shadow-indigo-500/10">
            <div>
              <h3 className="text-lg font-semibold">
                {editId ? "Mettre à jour un employé" : "Créer un compte"}
              </h3>
              <p className="mt-1 text-xs text-zinc-500">
                Renseignez les informations principales de l'employé.
              </p>
            </div>
            <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
              <input
                className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-400 focus:outline-none"
                placeholder="Nom complet"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
              <input
                className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-400 focus:outline-none"
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
              <input
                className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-400 focus:outline-none"
                placeholder="Poste"
                value={form.role}
                onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
                required
              />
              <select
                className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-400 focus:outline-none"
                value={form.status}
                onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
              >
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>
              {!editId && (
                <input
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-400 focus:outline-none"
                  placeholder="Mot de passe temporaire"
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                  required
                />
              )}
              {me?.role !== "admin" && (
                <p className="rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  Seuls les admins peuvent créer, modifier ou supprimer des employés.
                </p>
              )}
              <button
                className="w-full rounded-2xl bg-zinc-900 py-2 text-sm font-semibold text-white shadow-md shadow-zinc-900/15 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-zinc-400"
                disabled={saving || me?.role !== "admin"}
              >
                {saving ? "Enregistrement..." : editId ? "Mettre à jour" : "Ajouter l'employé"}
              </button>
              {editId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full rounded-2xl border border-zinc-200 py-2 text-sm font-semibold text-zinc-600"
                >
                  Annuler
                </button>
              )}
            </form>
          </div>
        </section>
      )}
    </div>
  );
}
