"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { apiFetchClient, getToken } from "@/lib/clientApi";

type RequestItem = {
  id: number;
  employeeId: number;
  type: string;
  status: string;
  message?: string | null;
  createdAt: string;
  managerEmail?: string | null;
  adminMessage?: string | null;
};

export default function RequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<{ role?: string; sub?: number } | null>(null);
  const [createForm, setCreateForm] = useState({
    type: "",
    message: "",
    documentUrl: "",
    employeeId: "",
  });
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    status: "pending",
    message: "",
    documentUrl: "",
    adminMessage: "",
  });
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
      apiFetchClient<RequestItem[]>("/requests"),
      apiFetchClient<{ role?: string; sub?: number }>("/auth/me").catch(() => null),
    ])
      .then(([data, meData]) => {
        setRequests(data);
        if (meData) setMe(meData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setActionError(null);
    try {
      const payload = {
        type: createForm.type.trim(),
        message: createForm.message.trim() || undefined,
        documentUrl: createForm.documentUrl.trim() || undefined,
        employeeId: createForm.employeeId ? Number(createForm.employeeId) : undefined,
      };
      const created = await apiFetchClient<RequestItem>("/requests", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setRequests((prev) => [created, ...prev]);
      setCreateForm({ type: "", message: "", documentUrl: "", employeeId: "" });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: RequestItem) => {
    setEditId(item.id);
    setEditForm({
      status: item.status,
      message: item.message ?? "",
      documentUrl: "",
      adminMessage: item.adminMessage ?? "",
    });
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editId) return;
    setSaving(true);
    setActionError(null);
    try {
      const payload = {
        status: editForm.status as "pending" | "approved" | "rejected",
        message: editForm.message.trim() || undefined,
        documentUrl: editForm.documentUrl.trim() || undefined,
        adminMessage: editForm.adminMessage.trim() || undefined,
      };
      const updated = await apiFetchClient<RequestItem>(`/requests/${editId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setRequests((prev) => prev.map((item) => (item.id === editId ? updated : item)));
      setEditId(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (requestId: number) => {
    if (!confirm("Supprimer cette demande ?")) return;
    setSaving(true);
    setActionError(null);
    try {
      await apiFetchClient(`/requests/${requestId}`, { method: "DELETE" });
      setRequests((prev) => prev.filter((item) => item.id !== requestId));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-10">
      <header className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-lg shadow-indigo-500/10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
          Demandes
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-zinc-900">
          Demandes & documents
        </h1>
        <p className="mt-3 text-zinc-600">
          Les employés peuvent déposer des demandes et des documents. L'équipe
          admin peut les valider et suivre leur statut.
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
              <h2 className="text-lg font-semibold">Demandes en attente</h2>
              {actionError && (
                <span className="text-xs font-semibold text-rose-600">
                  {actionError}
                </span>
              )}
            </div>
            <div className="mt-4 space-y-4">
              {requests.length === 0 ? (
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-500">
                  Aucune demande enregistrée.
                </div>
              ) : (
                requests.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-zinc-100 bg-white p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-zinc-900">
                          Demande #{item.id}
                        </p>
                        <p className="text-sm text-zinc-600">
                          Employé {item.employeeId} · {item.type}
                        </p>
                      </div>
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                        {item.status === "pending" ? "En attente" : item.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-zinc-600">
                      {item.message ?? "Pas de détail"}
                    </p>
                    {item.adminMessage && (
                      <p className="mt-2 rounded-2xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
                        Message admin: {item.adminMessage}
                      </p>
                    )}
                    {item.managerEmail && (
                      <p className="mt-2 text-xs text-zinc-500">
                        Manager: {item.managerEmail}
                      </p>
                    )}
                    {me?.role === "admin" && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600"
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600"
                        >
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {me?.role === "admin" && editId && (
              <form className="mt-6 rounded-2xl border border-zinc-100 bg-zinc-50 p-4" onSubmit={handleUpdate}>
                <h3 className="text-sm font-semibold text-zinc-700">Mettre à jour la demande</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <select
                    className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
                    value={editForm.status}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, status: event.target.value }))
                    }
                  >
                    <option value="pending">En attente</option>
                    <option value="approved">Approuvée</option>
                    <option value="office">Passez au bureau</option>
                    <option value="rejected">Rejetée</option>
                  </select>
                  <input
                    className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
                    placeholder="URL du document"
                    value={editForm.documentUrl}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, documentUrl: event.target.value }))
                    }
                  />
                </div>
                <textarea
                  className="mt-3 w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
                  placeholder="Message"
                  rows={3}
                  value={editForm.message}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, message: event.target.value }))
                  }
                />
                  <textarea
                    className="mt-3 w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
                    placeholder="Message admin pour l'employé"
                    rows={3}
                    value={editForm.adminMessage}
                    onChange={(event) =>
                      setEditForm((prev) => ({ ...prev, adminMessage: event.target.value }))
                    }
                  />
                <div className="mt-3 flex gap-2">
                  <button
                    className="rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
                    disabled={saving}
                  >
                    {saving ? "Enregistrement..." : "Mettre à jour"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditId(null)}
                    className="rounded-2xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-lg shadow-indigo-500/10">
            <h3 className="text-lg font-semibold">Déposer une demande</h3>
            <form className="mt-4 space-y-3" onSubmit={handleCreate}>
              <input
                className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
                placeholder="Type de demande"
                value={createForm.type}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, type: event.target.value }))
                }
                required
              />
              {me?.role === "admin" && (
                <input
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
                  placeholder="ID employé (optionnel)"
                  value={createForm.employeeId}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, employeeId: event.target.value }))
                  }
                />
              )}
              <textarea
                className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
                placeholder="Détails"
                rows={3}
                value={createForm.message}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, message: event.target.value }))
                }
              />
              <input
                className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
                placeholder="URL du document (optionnel)"
                value={createForm.documentUrl}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, documentUrl: event.target.value }))
                }
              />
              <button
                className="w-full rounded-2xl bg-zinc-900 py-2 text-sm font-semibold text-white shadow-md shadow-zinc-900/15 transition hover:-translate-y-0.5"
                disabled={saving}
              >
                {saving ? "Envoi..." : "Envoyer"}
              </button>
            </form>
          </div>
        </section>
      )}
    </div>
  );
}
