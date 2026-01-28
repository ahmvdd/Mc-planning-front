"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetchClient, getToken } from "@/lib/clientApi";

type Employee = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
};

type PlanningEntry = {
  id: number;
  date: string;
  shift: string;
  note?: string | null;
  employeeId: number;
};

type RequestItem = {
  id: number;
  employeeId: number;
  type: string;
  status: string;
  message?: string | null;
  createdAt: string;
  managerEmail?: string | null;
};

export default function DashboardPage() {
  const [planning, setPlanning] = useState<PlanningEntry[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [me, setMe] = useState<{ role?: string } | null>(null);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      setError("Connexion requise");
      router.push("/login");
      return;
    }

    Promise.all([
      apiFetchClient<PlanningEntry[]>("/planning"),
      apiFetchClient<RequestItem[]>("/requests"),
      apiFetchClient<Employee[]>("/employees"),
      apiFetchClient<{ role?: string }>("/auth/me").catch(() => null),
    ])
      .then(([planningData, requestData, employeeData, meData]) => {
        setPlanning(planningData);
        setRequests(requestData);
        setEmployees(employeeData);
        if (meData) setMe(meData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"))
      .finally(() => setLoading(false));
  }, []);

  const pendingRequests = requests.filter((item) => item.status === "pending");
  const documentRequests = requests.filter((item) =>
    item.type.toLowerCase().includes("document"),
  );
  const planningSlots = planning.slice(0, 5);

  return (
    <div className="space-y-10">
      <header className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-lg shadow-indigo-500/10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
          Vue d'ensemble
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-zinc-900">
          Planning de l&apos;équipe
        </h1>
        <p className="mt-3 text-zinc-600">
          Planifiez les horaires, visualisez les affectations et contactez les
          employés en un seul endroit.
        </p>
        {loading && (
          <p className="mt-4 text-sm text-zinc-500">Chargement...</p>
        )}
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
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-emerald-50 px-4 py-1.5 font-semibold text-emerald-700">
            {employees.length} employés actifs
          </span>
          <span className="rounded-full bg-blue-50 px-4 py-1.5 font-semibold text-blue-700">
            {pendingRequests.length} demandes en attente
          </span>
          <span className="rounded-full bg-amber-50 px-4 py-1.5 font-semibold text-amber-700">
            {documentRequests.length} documents à valider
          </span>
        </div>
      </header>

      {!error && !loading && (
        <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-lg shadow-indigo-500/10 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Planning de la semaine</h2>
            {me?.role === "admin" ? (
              <button className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-zinc-900/15 transition hover:-translate-y-0.5">
                Publier le planning
              </button>
            ) : (
              <button className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm">
                Télécharger le planning
              </button>
            )}
          </div>
          <div className="mt-5 overflow-hidden rounded-2xl border border-zinc-100 bg-white">
            <div className="grid grid-cols-5 bg-zinc-50 text-xs font-semibold uppercase text-zinc-500">
              {["Lun", "Mar", "Mer", "Jeu", "Ven"].map((day) => (
                <div key={day} className="px-4 py-3">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-5 text-sm">
              {planningSlots.length === 0 ? (
                <div className="col-span-5 border-t border-zinc-100 px-4 py-6 text-sm text-zinc-500">
                  Aucun planning publié pour le moment.
                </div>
              ) : (
                planningSlots.map((slot, index) => (
                  <div
                    key={slot.id}
                    className={`border-t border-zinc-100 px-4 py-4 ${
                      index % 2 === 0 ? "bg-white" : "bg-zinc-50"
                    }`}
                  >
                    <p className="font-semibold text-zinc-900">
                      {slot.note ?? "Équipe"} · {slot.shift}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Employé #{slot.employeeId}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-lg shadow-indigo-500/10">
            <h3 className="text-lg font-semibold">Demandes récentes</h3>
            <ul className="mt-4 space-y-3 text-sm text-zinc-600">
              {requests.length === 0 ? (
                <li className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3 text-zinc-500">
                  Aucune demande pour le moment.
                </li>
              ) : (
                requests.slice(0, 2).map((request) => (
                  <li
                    key={request.id}
                    className="rounded-2xl border border-zinc-100 bg-white p-3"
                  >
                    <p className="font-semibold text-zinc-900">
                      Employé #{request.employeeId} — {request.type}
                    </p>
                    <p>{request.message ?? "Aucun détail"}</p>
                    {request.managerEmail && (
                      <p className="mt-1 text-xs text-zinc-500">
                        Manager: {request.managerEmail}
                      </p>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-lg shadow-indigo-500/10">
            <h3 className="text-lg font-semibold">Contact rapide</h3>
            <p className="mt-2 text-sm text-zinc-600">
              Envoyez un message à un employé pour une mise à jour urgente.
            </p>
            <form className="mt-4 space-y-3">
              <input
                className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
                placeholder="Employé"
              />
              <textarea
                className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
                placeholder="Message"
                rows={3}
              />
              <button className="w-full rounded-2xl bg-zinc-900 py-2 text-sm font-semibold text-white shadow-md shadow-zinc-900/15 transition hover:-translate-y-0.5">
                Envoyer
              </button>
            </form>
          </div>
        </div>
        </section>
      )}
    </div>
  );
}
