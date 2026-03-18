"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetchClient, getToken } from "@/lib/clientApi";
import {
  Users, ClipboardList, CalendarDays, Bell,
  Send, Loader2, TrendingUp, Clock, CheckCircle2, XCircle, Info
} from "lucide-react";

type Employee = { id: number; name: string; email: string; role: string; status: string };
type PlanningEntry = { id: number; date: string; shift: string; note?: string | null; employeeId?: number | null };
type RequestItem = { id: number; employeeId: number; type: string; status: string; message?: string | null; createdAt: string };

interface DashboardData {
  planning: PlanningEntry[];
  requests: RequestItem[];
  employees: Employee[];
  me: { role?: string; sub?: number } | null;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });

const statusLabel: Record<string, string> = {
  pending: "En attente", approved: "Approuvée", rejected: "Refusée", office: "Convocation",
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-100",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
  rejected: "bg-rose-50 text-rose-700 border-rose-100",
  office: "bg-blue-50 text-blue-700 border-blue-100",
};

function useDashboard() {
  const [data, setData] = useState<DashboardData>({ planning: [], requests: [], employees: [], me: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    Promise.all([
      apiFetchClient<PlanningEntry[]>("/planning"),
      apiFetchClient<RequestItem[]>("/requests"),
      apiFetchClient<Employee[]>("/employees"),
      apiFetchClient<{ role?: string; sub?: number }>("/auth/me").catch(() => null),
    ])
      .then(([planning, requests, employees, me]) => setData({ planning, requests, employees, me }))
      .catch(err => setError(err instanceof Error ? err.message : "Une erreur est survenue"))
      .finally(() => setLoading(false));
  }, [router]);

  const stats = useMemo(() => {
    const pending = data.requests.filter(r => r.status === "pending").length;
    const approved = data.requests.filter(r => r.status === "approved").length;
    const rejected = data.requests.filter(r => r.status === "rejected").length;
    const office = data.requests.filter(r => r.status === "office").length;
    const total = data.requests.length;
    const upcomingShifts = [...data.planning]
      .filter(s => new Date(s.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 7);
    return { pending, approved, rejected, office, total, activeEmployees: data.employees.length, upcomingShifts };
  }, [data]);

  return { data, loading, error, stats };
}

export default function DashboardPage() {
  const { data, loading, error, stats } = useDashboard();

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
        <p className="text-slate-500 font-medium animate-pulse">Chargement de votre espace...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center max-w-sm shadow-sm">
        <p className="text-slate-600 mb-4">{error}</p>
        <Link href="/login" className="rounded-xl bg-slate-900 px-6 py-2 text-sm font-bold text-white">Connexion</Link>
      </div>
    </div>
  );

  const isAdmin = data.me?.role === "admin";

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Header sticky */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tableau de bord</h1>
            <p className="text-sm text-slate-500">Vue d'ensemble de votre organisation</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-700">
              <Users size={13} /> {stats.activeEmployees} employés
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-4 py-1.5 text-xs font-bold text-amber-700">
              <ClipboardList size={13} /> {stats.pending} en attente
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-4 py-1.5 text-xs font-bold text-indigo-700">
              <CalendarDays size={13} /> {data.planning.length} créneaux
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-3">

          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-8">

            {/* Planning employé */}
            {!isAdmin && (
              <section className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <CalendarDays size={16} /> Mon planning
                </h3>
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  {stats.upcomingShifts.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="mx-auto w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                        <CalendarDays className="text-slate-300" size={28} />
                      </div>
                      <h4 className="font-bold text-slate-900">Aucun créneau prévu</h4>
                      <p className="text-slate-500 text-sm mt-1">Vos prochains créneaux apparaîtront ici.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {stats.upcomingShifts.map(slot => (
                        <div key={slot.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors">
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{slot.shift}</p>
                            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                              <Clock size={11} /> {fmtDate(slot.date)}
                            </p>
                          </div>
                          {slot.note && (
                            <span className="text-xs bg-indigo-50 text-indigo-600 font-medium px-3 py-1 rounded-full">{slot.note}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Graphe admin */}
            {isAdmin && (
              <section className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <TrendingUp size={16} /> Activité de l'organisation
                </h3>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {[
                      { label: "Employés", value: stats.activeEmployees, color: "text-emerald-600", bg: "bg-emerald-50" },
                      { label: "Demandes totales", value: stats.total, color: "text-indigo-600", bg: "bg-indigo-50" },
                    ].map(({ label, value, color, bg }) => (
                      <div key={label} className={`rounded-2xl ${bg} p-5 text-center`}>
                        <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
                        <p className="text-xs text-slate-500 mt-1 font-medium">{label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-3">Répartition des demandes</p>
                    {[
                      { label: "En attente", count: stats.pending, color: "bg-amber-400" },
                      { label: "Approuvées", count: stats.approved, color: "bg-emerald-400" },
                      { label: "Refusées", count: stats.rejected, color: "bg-rose-400" },
                      { label: "Convocations", count: stats.office, color: "bg-blue-400" },
                    ].map(({ label, count, color }) => (
                      <div key={label}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-slate-600 font-medium">{label}</span>
                          <span className="font-bold text-slate-800">{count}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100">
                          <div
                            className={`h-2 rounded-full ${color} transition-all duration-500`}
                            style={{ width: `${stats.total ? Math.round((count / stats.total) * 100) : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Demandes récentes */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Bell size={16} /> Demandes récentes
              </h3>
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {data.requests.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <CheckCircle2 className="mx-auto mb-2 opacity-20" size={32} />
                    <p className="text-sm font-medium">Tout est à jour.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {data.requests.slice(0, 4).map(req => (
                      <div key={req.id} className="px-5 py-4 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-800">{req.type}</span>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${statusColors[req.status] ?? statusColors.pending}`}>
                            {statusLabel[req.status] ?? req.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{req.message || "Sans message"}</p>
                      </div>
                    ))}
                  </div>
                )}
                {data.requests.length > 0 && (
                  <div className="border-t border-slate-100 px-5 py-3">
                    <Link href="/requests" className="text-xs font-bold text-indigo-600 hover:underline">
                      Voir toutes les demandes →
                    </Link>
                  </div>
                )}
              </div>
            </section>

            {/* Contact rapide */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Send size={16} /> Contact rapide
              </h3>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <form className="space-y-3" onSubmit={e => e.preventDefault()}>
                  <input
                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                    placeholder="Destinataire..."
                  />
                  <textarea
                    className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none transition-all"
                    placeholder="Votre message..."
                    rows={3}
                  />
                  <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white hover:bg-black transition-colors">
                    <Send size={14} /> Envoyer
                  </button>
                </form>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
