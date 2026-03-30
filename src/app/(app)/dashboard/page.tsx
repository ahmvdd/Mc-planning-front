"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetchClient, getToken } from "@/lib/clientApi";
import {
  Users, ClipboardList, CalendarDays, Bell,
  Send, Loader2, TrendingUp, Clock, CheckCircle2, ArrowRight, XCircle, AlertCircle
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
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  office: "bg-blue-50 text-blue-700 border-blue-200",
};
const statusIcon: Record<string, React.ReactNode> = {
  pending: <Clock size={10} />, approved: <CheckCircle2 size={10} />,
  rejected: <XCircle size={10} />, office: <AlertCircle size={10} />,
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
      .catch(err => setError(err instanceof Error ? err.message : "Erreur"))
      .finally(() => setLoading(false));
  }, [router]);

  const stats = useMemo(() => {
    const pending = data.requests.filter(r => r.status === "pending").length;
    const approved = data.requests.filter(r => r.status === "approved").length;
    const rejected = data.requests.filter(r => r.status === "rejected").length;
    const office = data.requests.filter(r => r.status === "office").length;
    const total = data.requests.length;
    const upcomingShifts = [...data.planning]
      .filter(s => new Date(s.date) >= new Date(new Date().setHours(0,0,0,0)))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
    return { pending, approved, rejected, office, total, activeEmployees: data.employees.length, upcomingShifts };
  }, [data]);

  return { data, loading, error, stats };
}

export default function DashboardPage() {
  const { data, loading, error, stats } = useDashboard();

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center space-y-3">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-200">
          <Loader2 className="animate-spin text-white" size={28} />
        </div>
        <p className="text-sm font-medium text-slate-500">Chargement de votre espace...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="rounded-2xl border border-rose-100 bg-white p-8 text-center shadow-sm max-w-sm">
        <p className="mb-4 text-slate-600">{error}</p>
        <Link href="/login" className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white">Connexion</Link>
      </div>
    </div>
  );

  const isAdmin = data.me?.role === "admin";

  return (
    <div className="space-y-8">

      {/* ── Hero greeting ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 sm:p-8 text-white shadow-xl shadow-indigo-200">
        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-200 mb-1">Tableau de bord</p>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Bonjour 👋</h1>
          <p className="mt-1 text-sm text-indigo-100/80">Vue d&apos;ensemble de votre organisation</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/planning" className="flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold text-white backdrop-blur transition hover:bg-white/30">
              <CalendarDays size={12} /> Voir le planning
            </Link>
            <Link href="/requests" className="flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold text-white backdrop-blur transition hover:bg-white/30">
              <ClipboardList size={12} /> Voir les demandes
            </Link>
          </div>
        </div>
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 opacity-10">
          <div className="absolute right-8 top-4 h-32 w-32 rounded-full bg-white blur-2xl" />
          <div className="absolute right-16 bottom-4 h-20 w-20 rounded-full bg-white blur-xl" />
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Employés", value: stats.activeEmployees, icon: Users, color: "from-emerald-400 to-teal-500", bg: "bg-emerald-50", text: "text-emerald-700", href: "/employees" },
          { label: "En attente", value: stats.pending, icon: Clock, color: "from-amber-400 to-orange-500", bg: "bg-amber-50", text: "text-amber-700", href: "/requests" },
          { label: "Créneaux", value: data.planning.length, icon: CalendarDays, color: "from-indigo-400 to-violet-500", bg: "bg-indigo-50", text: "text-indigo-700", href: "/planning" },
          { label: "Demandes", value: stats.total, icon: ClipboardList, color: "from-sky-400 to-blue-500", bg: "bg-sky-50", text: "text-sky-700", href: "/requests" },
        ].map(({ label, value, icon: Icon, color, bg, text, href }) => (
          <Link key={label} href={href} className={`group rounded-2xl ${bg} p-5 transition hover:-translate-y-0.5 hover:shadow-md`}>
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-md`}>
              <Icon size={18} className="text-white" />
            </div>
            <p className={`text-3xl font-black ${text}`}>{value}</p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Main column ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Employee: upcoming shifts */}
          {!isAdmin && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-4">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100"><CalendarDays size={14} className="text-indigo-600" /></div>
                  Mon planning à venir
                </h3>
                <Link href="/planning" className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition">
                  Tout voir <ArrowRight size={12} />
                </Link>
              </div>
              {stats.upcomingShifts.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
                    <CalendarDays className="text-slate-300" size={26} />
                  </div>
                  <p className="font-bold text-slate-600">Aucun créneau prévu</p>
                  <p className="mt-1 text-xs text-slate-400">Vos prochains créneaux apparaîtront ici.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {stats.upcomingShifts.map(slot => (
                    <div key={slot.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
                      <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-indigo-50 text-center">
                        <span className="text-xs font-black text-indigo-700 leading-none">
                          {new Date(slot.date).getDate()}
                        </span>
                        <span className="text-[9px] font-bold uppercase text-indigo-400">
                          {new Date(slot.date).toLocaleDateString("fr-FR", { month: "short" })}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-sm">{slot.shift}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{fmtDate(slot.date)}</p>
                      </div>
                      {slot.note && (
                        <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-600">{slot.note}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Admin: activity */}
          {isAdmin && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 border-b border-slate-100 bg-slate-50/60 px-5 py-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100">
                  <TrendingUp size={14} className="text-indigo-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-700">Activité de l&apos;organisation</h3>
              </div>
              <div className="p-5 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Employés actifs", value: stats.activeEmployees, color: "text-emerald-600", bg: "from-emerald-50 to-teal-50", border: "border-emerald-100" },
                    { label: "Demandes totales", value: stats.total, color: "text-indigo-600", bg: "from-indigo-50 to-violet-50", border: "border-indigo-100" },
                  ].map(({ label, value, color, bg, border }) => (
                    <div key={label} className={`rounded-2xl border ${border} bg-gradient-to-br ${bg} p-5 text-center`}>
                      <p className={`text-4xl font-black ${color}`}>{value}</p>
                      <p className="text-xs font-medium text-slate-500 mt-1">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Répartition des demandes</p>
                  {[
                    { label: "En attente", count: stats.pending, bar: "bg-amber-400", dot: "bg-amber-400" },
                    { label: "Approuvées", count: stats.approved, bar: "bg-emerald-400", dot: "bg-emerald-400" },
                    { label: "Refusées", count: stats.rejected, bar: "bg-rose-400", dot: "bg-rose-400" },
                    { label: "Convocations", count: stats.office, bar: "bg-blue-400", dot: "bg-blue-400" },
                  ].map(({ label, count, bar, dot }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-slate-600">{label}</span>
                          <span className="font-bold text-slate-800">{count}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100">
                          <div className={`h-1.5 rounded-full ${bar} transition-all duration-700`}
                            style={{ width: `${stats.total ? Math.round((count / stats.total) * 100) : 0}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-5">
          {/* Recent requests */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50"><Bell size={14} className="text-rose-500" /></div>
                Demandes récentes
              </h3>
              <Link href="/requests" className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition">
                Voir tout <ArrowRight size={12} />
              </Link>
            </div>
            {data.requests.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <CheckCircle2 className="mb-2 text-emerald-200" size={28} />
                <p className="text-sm font-medium text-slate-500">Tout est à jour !</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {data.requests.slice(0, 5).map(req => (
                  <div key={req.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/70 transition-colors">
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-[10px] ${statusColors[req.status] ?? statusColors.pending}`}>
                      {statusIcon[req.status]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-bold text-slate-800">{req.type}</p>
                      <p className="truncate text-[11px] text-slate-400">{req.message || "Sans message"}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusColors[req.status] ?? statusColors.pending}`}>
                      {statusLabel[req.status]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick message */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 border-b border-slate-100 bg-slate-50/60 px-5 py-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50">
                <Send size={14} className="text-sky-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">Message rapide</h3>
            </div>
            <div className="p-4 space-y-2.5">
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15 transition-all"
                placeholder="Destinataire..."
              />
              <textarea
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15 resize-none transition-all"
                placeholder="Votre message..."
                rows={3}
              />
              <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-600">
                <Send size={13} /> Envoyer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
