"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from "react";
import { apiFetchClient, getToken } from "@/lib/clientApi";

type PlanningEntry = {
  id: number;
  date: string;
  shift: string;
  note?: string | null;
  employeeId?: number | null;
};

type EmployeeOption = {
  id: number;
  name: string;
};

export default function PlanningPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<PlanningEntry[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<{ role?: string } | null>(null);
  const [planningImageUrl, setPlanningImageUrl] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [form, setForm] = useState({
    date: "",
    shift: "",
    employeeId: "",
    note: "",
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
      apiFetchClient<PlanningEntry[]>("/planning"),
      apiFetchClient<EmployeeOption[]>("/employees"),
      apiFetchClient<{ role?: string }>("/auth/me").catch(() => null),
      apiFetchClient<{ planningImageUrl: string | null }>("/planning/image").catch(() => ({ planningImageUrl: null })),
    ])
      .then(([planningData, employeeData, meData, planningImage]) => {
        setEntries(planningData);
        setEmployees(employeeData);
        if (meData) setMe(meData);
        setPlanningImageUrl(planningImage.planningImageUrl);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"))
      .finally(() => setLoading(false));
  }, []);

  const employeeOptions = useMemo(() => employees, [employees]);

  const resetForm = () => {
    setForm({ date: "", shift: "", employeeId: "", note: "" });
    setEditId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setActionError(null);
    try {
      const payload = {
        date: form.date ? `${form.date}T00:00:00.000Z` : "",
        shift: form.shift.trim(),
        employeeId: form.employeeId ? Number(form.employeeId) : undefined,
        note: form.note.trim() || undefined,
      };

      if (editId) {
        const updated = await apiFetchClient<PlanningEntry>(`/planning/${editId}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          },
        );
        setEntries((prev) => prev.map((item) => (item.id === editId ? updated : item)));
      } else {
        const created = await apiFetchClient<PlanningEntry>("/planning", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setEntries((prev) => [created, ...prev]);
      }
      resetForm();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (entry: PlanningEntry) => {
    setEditId(entry.id);
    setForm({
      date: entry.date ? entry.date.slice(0, 10) : "",
      shift: entry.shift,
      employeeId: entry.employeeId ? String(entry.employeeId) : "",
      note: entry.note ?? "",
    });
  };

  const handleDelete = async (entryId: number) => {
    if (!confirm("Supprimer cette entrée de planning ?")) return;
    setSaving(true);
    setActionError(null);
    try {
      await apiFetchClient(`/planning/${entryId}`, { method: "DELETE" });
      setEntries((prev) => prev.filter((item) => item.id !== entryId));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    setImageError(null);
    try {
      const imageData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Lecture image impossible"));
        reader.readAsDataURL(file);
      });

      const response = await apiFetchClient<{ planningImageUrl: string | null }>(
        "/admin/planning-image",
        {
          method: "POST",
          body: JSON.stringify({ imageData }),
        },
      );
      setPlanningImageUrl(response.planningImageUrl ?? imageData);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setImageUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-10">
      <header className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-lg shadow-indigo-500/10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
          Planning
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-zinc-900">
          Gestion du planning
        </h1>
        <p className="mt-3 text-zinc-600">
          Créez des shifts, assignez des employés et mettez à jour les entrées.
        </p>
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
              <h2 className="text-lg font-semibold">Entrées planning</h2>
              {actionError && (
                <span className="text-xs font-semibold text-rose-600">
                  {actionError}
                </span>
              )}
            </div>
            {planningImageUrl && (
              <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-100 bg-white">
                <img
                  src={planningImageUrl}
                  alt="Planning"
                  className="h-auto w-full object-contain"
                />
              </div>
            )}
            <div className="mt-5 overflow-hidden rounded-2xl border border-zinc-100 bg-white">
              <div className="grid grid-cols-5 bg-zinc-50 text-xs font-semibold uppercase text-zinc-500">
                <div className="px-4 py-3">Date</div>
                <div className="px-4 py-3">Shift</div>
                <div className="px-4 py-3">Employé</div>
                <div className="px-4 py-3">Note</div>
                <div className="px-4 py-3 text-right">Actions</div>
              </div>
              {entries.length === 0 ? (
                <div className="border-t border-zinc-100 px-4 py-6 text-sm text-zinc-500">
                  Aucune entrée.
                </div>
              ) : (
                entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="grid grid-cols-5 border-t border-zinc-100 px-4 py-4 text-sm"
                  >
                    <p className="font-semibold text-zinc-900">
                      {new Date(entry.date).toLocaleDateString("fr-FR")}
                    </p>
                    <p>{entry.shift}</p>
                    <p>{entry.employeeId ? `#${entry.employeeId}` : "Toute l'équipe"}</p>
                    <p className="text-zinc-600">{entry.note ?? "—"}</p>
                    <div className="flex justify-end gap-2">
                      {me?.role === "admin" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleEdit(entry)}
                            className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600"
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(entry.id)}
                            className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600"
                            disabled={saving}
                          >
                            Supprimer
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {me?.role === "admin" && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-lg shadow-indigo-500/10">
                <h3 className="text-lg font-semibold">Planning en image</h3>
                <p className="mt-1 text-sm text-zinc-600">
                  Importez une image du planning pour que tous les employés la consultent.
                </p>
                <div className="mt-4 space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2 text-sm"
                  />
                  {imageError && (
                    <p className="text-xs text-rose-600">{imageError}</p>
                  )}
                  <button
                    type="button"
                    className="w-full rounded-2xl bg-zinc-900 py-2 text-sm font-semibold text-white shadow-md shadow-zinc-900/15"
                    disabled={imageUploading}
                  >
                    {imageUploading ? "Upload en cours..." : "Ajouter le planning en image"}
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-lg shadow-indigo-500/10">
                <h3 className="text-lg font-semibold">
                  {editId ? "Mettre à jour une entrée" : "Créer une entrée"}
                </h3>
                <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
                <input
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
                  type="date"
                  value={form.date}
                  onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
                  required
                />
                <input
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
                  placeholder="Shift (ex: 08:00-16:00)"
                  value={form.shift}
                  onChange={(event) => setForm((prev) => ({ ...prev, shift: event.target.value }))}
                  required
                />
                <select
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
                  value={form.employeeId}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, employeeId: event.target.value }))
                  }
                >
                  <option value="">Toute l'équipe</option>
                  {employeeOptions.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
                <textarea
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
                  placeholder="Note"
                  rows={3}
                  value={form.note}
                  onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
                />
                <button
                  className="w-full rounded-2xl bg-zinc-900 py-2 text-sm font-semibold text-white shadow-md shadow-zinc-900/15 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-zinc-400"
                  disabled={saving}
                >
                  {saving ? "Enregistrement..." : editId ? "Mettre à jour" : "Ajouter"}
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
            </div>
          )}
        </section>
      )}
    </div>
  );
}
