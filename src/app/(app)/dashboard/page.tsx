"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetchClient, getToken } from "@/lib/clientApi";
import {
  Users, ClipboardList, CalendarDays, Bell,
  Send, Loader2, TrendingUp, Clock, CheckCircle2, ArrowRight
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
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
          <Loader2 className="animate-spin text-indigo-600" size={28} />
        </div>
        <p className="text-sm font-medium text-slate-500">Chargement de votre espace...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm max-w-sm">
        <p className="mb-4 text-slate-600">{error}</p>
        <Link href="/login" className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200">Connexion</Link>
      </div>
    </div>
  );

  const isAdmin = data.me?.role === "admin";

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Tableau de bord</h1>
          <p className="text-sm text-slate-500">Vue d&apos;ensemble de votre organisation</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700">
            <Users size={12} /> {stats.activeEmployees} employés
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-700">
            <ClipboardList size={12} /> {stats.pending} en attente
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3.5 py-1.5 text-xs font-bold text-indigo-700">
            <CalendarDays size={12} /> {data.planning.length} créneaux
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Employee planning */}
          {!isAdmin && (
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <CalendarDays size={15} className="text-indigo-500" /> Mon planning
                </h3>
                <Link href="/planning" className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700">
                  Voir tout <ArrowRight size={12} />
                </Link>
              </div>
              {stats.upcomingShifts.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50">
                    <CalendarDays className="text-slate-300" size={24} />
                  </div>
                  <p className="font-bold text-slate-700">Aucun créneau prévu</p>
                  <p className="mt-1 text-xs text-slate-400">Vos prochains créneaux apparaîtront ici.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {stats.upcomingShifts.map(slot => (
                    <div key={slot.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/70 transition-colors">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{slot.shift}</p>
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                          <Clock size={10} /> {fmtDate(slot.date)}
                        </p>
                      </div>
                      {slot.note && (
                        <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-600">{slot.note}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Admin activity */}
          {isAdmin && (
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-4 flex items-center gap-2">
                <TrendingUp size={15} className="text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-700">Activité de l&apos;organisation</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[
                    { label: "Employés actifs", value: stats.activeEmployees, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Demandes totales", value: stats.total, color: "text-indigo-600", bg: "bg-indigo-50" },
                  ].map(({ label, value, color, bg }) => (
                    <div key={label} className={`rounded-2xl ${bg} p-5 text-center`}>
                      <p className={`text-3xl font-black ${color}`}>{value}</p>
                      <p className="text-xs text-slate-500 mt-1 font-medium">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-4">Répartition des demandes</p>
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
                      <div className="h-1.5 w-full rounded-full bg-slate-100">
                        <div
                          className={`h-1.5 rounded-full ${color} transition-all duration-700`}
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
          {/* Recent requests */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <Bell size={15} className="text-indigo-500" /> Demandes récentes
              </h3>
              <Link href="/requests" className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700">
                Voir tout <ArrowRight size={12} />
              </Link>
            </div>
            {data.requests.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <CheckCircle2 className="mx-auto mb-2 text-emerald-200" size={28} />
                <p className="text-sm font-medium text-slate-500">Tout est à jour.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {data.requests.slice(0, 4).map(req => (
                  <div key={req.id} className="px-5 py-3.5 hover:bg-slate-50/70 transition-colors">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-xs font-bold text-slate-800 truncate">{req.type}</span>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${statusColors[req.status] ?? statusColors.pending}`}>
                        {statusLabel[req.status] ?? req.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">{req.message || "Sans message"}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Quick contact */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4 flex items-center gap-2">
              <Send size={15} className="text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-700">Contact rapide</h3>
            </div>
            <div className="p-5">
              <form className="space-y-2.5" onSubmit={e => e.preventDefault()}>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15 transition-all"
                  placeholder="Destinataire..."
                />
                <textarea
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15 resize-none transition-all"
                  placeholder="Votre message..."
                  rows={3}
                />
                <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white hover:bg-indigo-600 transition-colors">
                  <Send size={13} /> Envoyer
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
