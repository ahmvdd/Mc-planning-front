"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetchClient, getToken } from "@/lib/clientApi";
import {
  Users, ClipboardList, CalendarDays, Bell, Loader2,
  TrendingUp, Clock, CheckCircle2, ArrowRight, XCircle, AlertCircle, Plus,
  Sparkles, Calendar, ChevronRight, RefreshCw, Layers
} from "lucide-react";

// --- Types ---
type Role = "admin" | "employee";
type Status = "pending" | "approved" | "rejected" | "office";

interface Employee {
  id: number;
  name: string;
  email: string;
  role: Role;
  status: string;
}

interface PlanningEntry {
  id: number;
  date: string;
  shift: string;
  note?: string | null;
  employeeId?: number | null;
}

interface RequestItem {
  id: number;
  employeeId: number;
  type: string;
  status: Status;
  message?: string | null;
  createdAt: string;
}

interface DashboardData {
  planning: PlanningEntry[];
  requests: RequestItem[];
  employees: Employee[];
  me: { role?: Role; sub?: number; name?: string } | null;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "À l'instant";
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `Il y a ${d}j`;
};

const STATUS_CONFIG: Record<Status, { label: string; badge: string; bar: string; icon: React.ReactNode }> = {
  pending: {
    label: "En attente",
    badge: "text-amber-300 bg-amber-500/10 border-amber-500/30",
    bar: "bg-amber-400",
    icon: <Clock size={12} className="text-amber-400" />
  },
  approved: {
    label: "Validé",
    badge: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
    bar: "bg-emerald-400",
    icon: <CheckCircle2 size={12} className="text-emerald-400" />
  },
  rejected: {
    label: "Refusé",
    badge: "text-rose-300 bg-rose-500/10 border-rose-500/30",
    bar: "bg-rose-400",
    icon: <XCircle size={12} className="text-rose-400" />
  },
  office: {
    label: "Bureau",
    badge: "text-blue-300 bg-blue-500/10 border-blue-500/30",
    bar: "bg-blue-400",
    icon: <AlertCircle size={12} className="text-blue-400" />
  },
};

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS === "true";

const MOCK_DATA: DashboardData = {
  me: { role: "admin", sub: 1, name: "Dev User" },
  employees: [
    { id: 1, name: "Alice Martin", email: "alice@test.com", role: "employee", status: "active" },
    { id: 2, name: "Bob Dupont", email: "bob@test.com", role: "employee", status: "active" },
    { id: 3, name: "Claire Leroy", email: "claire@test.com", role: "admin", status: "active" },
  ],
  planning: [
    { id: 1, date: new Date(Date.now() + 86400000).toISOString(), shift: "Matin 08h - 16h", note: "Site Principal", employeeId: 1 },
    { id: 2, date: new Date(Date.now() + 2 * 86400000).toISOString(), shift: "Après-midi 14h - 22h", note: null, employeeId: 2 },
    { id: 3, date: new Date(Date.now() + 4 * 86400000).toISOString(), shift: "Nuit 22h - 06h", note: "Intervention Urgente", employeeId: 1 },
  ],
  requests: [
    { id: 1, employeeId: 1, type: "Congé annuel", status: "pending", message: "Vacances d'été", createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 2, employeeId: 2, type: "Arrêt maladie", status: "approved", message: "Certificat transmis à la RH", createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 3, employeeId: 1, type: "Convocation bureau", status: "office", message: "Point trimestriel d'équipe", createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
    { id: 4, employeeId: 3, type: "Congé sans solde", status: "rejected", message: "Période de haute activité", createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
  ],
};

function useDashboard() {
  const [data, setData] = useState<DashboardData>({ planning: [], requests: [], employees: [], me: null });
  const [loading, setLoading] = useState(!DEV_BYPASS);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (DEV_BYPASS) {
      setData(MOCK_DATA);
      return;
    }

    if (!getToken()) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const [planning, requests, employees, me] = await Promise.all([
          apiFetchClient<PlanningEntry[]>("/planning"),
          apiFetchClient<RequestItem[]>("/requests"),
          apiFetchClient<Employee[]>("/employees"),
          apiFetchClient<DashboardData["me"]>("/auth/me").catch(() => null),
        ]);
        setData({ planning, requests, employees, me });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const stats = useMemo(() => {
    const counts = data.requests.reduce((acc, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    }, {} as Record<Status, number>);

    const today = new Date(new Date().setHours(0, 0, 0, 0));
    const twoWeeksFromNow = new Date(today.getTime() + 14 * 86400000);

    const upcoming = data.planning
      .filter(s => new Date(s.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);

    const hasUpcomingInTwoWeeks = data.planning.some(
      s => new Date(s.date) >= today && new Date(s.date) <= twoWeeksFromNow
    );
    const planningWarning = data.planning.length > 0 && !hasUpcomingInTwoWeeks;

    return { ...counts, totalRequests: data.requests.length, upcoming, totalEmployees: data.employees.length, planningWarning };
  }, [data]);

  return { data, loading, error, stats };
}

export default function DashboardPage() {
  const { data, loading, error, stats } = useDashboard();
  const isAdmin = data.me?.role === "admin";

  const userName = data.me?.name
    || data.employees.find(e => e.id === data.me?.sub)?.name
    || "utilisateur";

  if (loading) return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center space-y-4">
      <div className="relative flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
        <Sparkles size={16} className="absolute text-blue-400" />
      </div>
      <p className="text-xs font-medium tracking-wide text-zinc-400 uppercase">Chargement de votre espace...</p>
    </div>
  );

  if (error) {
    const is5xx = error.includes("500") || error.toLowerCase().includes("internal") || error.toLowerCase().includes("server");
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-4">
        <div className="glass-panel w-full max-w-md rounded-2xl p-8 text-center shadow-2xl">
          <div className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${is5xx ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
            <AlertCircle size={28} />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            {is5xx ? "Problème serveur" : "Accès non autorisé"}
          </h2>
          <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 py-3 text-sm font-semibold text-white transition-all active:scale-[0.98]"
          >
            <RefreshCw size={15} /> Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-16 px-4 sm:px-6">

      {/* Header Banner */}
      <header className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="absolute -right-10 -top-10 h-60 w-60 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-400 mb-3">
              <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
              Espace {isAdmin ? "Administration" : "Collaborateur"}
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Ravi de vous revoir, <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">{userName}</span>
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Aperçu en temps réel de votre activité et des créneaux d&apos;équipe.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!isAdmin && (
              <Link 
                href="/requests" 
                className="glow-pill inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-3 text-sm font-bold text-white transition-all hover:opacity-95 active:scale-95"
              >
                <Plus size={18} /> Nouvelle demande
              </Link>
            )}
            {isAdmin && (
              <Link 
                href="/planning" 
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-5 py-3 text-sm font-semibold text-white transition-all active:scale-95"
              >
                <Calendar size={16} /> Gérer le planning
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Planning warning */}
      {isAdmin && stats.planningWarning && (
        <div className="glass-panel flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border-l-4 border-l-amber-500 p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400 border border-amber-500/20 shrink-0">
              <AlertCircle size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-200">Mise à jour requise</h3>
              <p className="text-xs text-amber-300/70 mt-0.5">Aucun créneau planifié sur les 14 prochains jours pour votre équipe.</p>
            </div>
          </div>
          <Link href="/planning" className="shrink-0 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 px-4 py-2 text-xs font-bold text-amber-200 transition-colors text-center">
            Planifier des shifts
          </Link>
        </div>
      )}

      {/* Modern Metric Cards Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Membres d'équipe", value: stats.totalEmployees, icon: Users, color: "from-blue-500/20 to-indigo-500/20", iconColor: "text-blue-400", href: "/employees" },
          { label: "En attente de validation", value: stats.pending || 0, icon: Clock, color: "from-amber-500/20 to-orange-500/20", iconColor: "text-amber-400", href: "/requests" },
          { label: "Créneaux planifiés", value: data.planning.length, icon: CalendarDays, color: "from-emerald-500/20 to-teal-500/20", iconColor: "text-emerald-400", href: "/planning" },
          { label: "Total demandes", value: stats.totalRequests, icon: ClipboardList, color: "from-purple-500/20 to-pink-500/20", iconColor: "text-purple-400", href: "/requests" },
        ].map(({ label, value, icon: Icon, color, iconColor, href }) => (
          <Link key={label} href={href} className="glass-panel glass-panel-hover group relative overflow-hidden rounded-2xl p-5">
            <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${color} blur-2xl transition-all group-hover:scale-150`} />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{label}</span>
              <div className={`rounded-xl bg-white/5 p-2.5 ${iconColor} border border-white/5`}>
                <Icon size={18} />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-black tracking-tight text-white">{value}</span>
              <span className="text-xs font-medium text-zinc-500 group-hover:text-zinc-300 flex items-center gap-1 transition-colors">
                Consulter <ChevronRight size={12} />
              </span>
            </div>
          </Link>
        ))}
      </section>

      {/* Main Content Layout */}
      <div className="grid gap-8 lg:grid-cols-12">

        {/* Column Left (8 Cols) */}
        <div className="lg:col-span-8 space-y-8">

          {/* Planning Section */}
          <section className="glass-panel rounded-3xl p-6 sm:p-7">
            <div className="flex items-center justify-between border-b border-white/5 pb-5 mb-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-400 border border-blue-500/20">
                  <CalendarDays size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    {isAdmin ? "Planning Général de l'Équipe" : "Mon Planning Prochain"}
                  </h2>
                  <p className="text-xs text-zinc-400">Prochains créneaux attribués</p>
                </div>
              </div>
              <Link href="/planning" className="flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">
                Voir tout <ArrowRight size={14} />
              </Link>
            </div>

            {stats.upcoming.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-2xl bg-zinc-900/80 p-4 text-zinc-600 mb-3 border border-white/5">
                  <CalendarDays size={32} />
                </div>
                <p className="text-sm font-semibold text-zinc-300">Aucun créneau programmée</p>
                <p className="text-xs text-zinc-500 mt-1">Les créneaux futurs apparaîtront ici.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.upcoming
                  .filter(slot => isAdmin || !slot.employeeId || slot.employeeId === data.me?.sub)
                  .map((slot) => (
                    <div 
                      key={slot.id} 
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 p-4 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 text-white shadow-inner">
                          <span className="text-base font-bold leading-none">{new Date(slot.date).getDate()}</span>
                          <span className="text-[10px] font-medium uppercase text-zinc-400 mt-0.5">
                            {new Date(slot.date).toLocaleDateString("fr-FR", { month: "short" })}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">{slot.shift}</h4>
                          <p className="text-xs text-zinc-400 capitalize mt-0.5">{formatDate(slot.date)}</p>
                        </div>
                      </div>

                      {slot.note && (
                        <div className="inline-flex items-center gap-1.5 self-start sm:self-center rounded-xl bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-300 border border-blue-500/20">
                          <Layers size={12} />
                          {slot.note}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </section>

          {/* Admin Distribution Metrics */}
          {isAdmin && (
            <section className="glass-panel rounded-3xl p-6 sm:p-7">
              <div className="flex items-center gap-3 border-b border-white/5 pb-5 mb-6">
                <div className="rounded-xl bg-purple-500/10 p-2.5 text-purple-400 border border-purple-500/20">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Statistiques des demandes</h2>
                  <p className="text-xs text-zinc-400">Répartition globale des états de demandes</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {(["pending", "approved", "rejected", "office"] as Status[]).map((s) => {
                  const count = (stats[s] || 0) as number;
                  const percentage = stats.totalRequests ? Math.round((count / stats.totalRequests) * 100) : 0;
                  const config = STATUS_CONFIG[s];
                  return (
                    <div key={s} className="rounded-2xl bg-white/[0.02] border border-white/5 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded-md bg-white/5">{config.icon}</span>
                          <span className="text-xs font-semibold text-zinc-300">{config.label}</span>
                        </div>
                        <span className="text-sm font-bold text-white">{count} <span className="text-xs font-normal text-zinc-500">({percentage}%)</span></span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800/80">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${config.bar}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

        </div>

        {/* Sidebar Right (4 Cols) */}
        <aside className="lg:col-span-4 space-y-8">

          {/* Activity Feed */}
          <section className="glass-panel rounded-3xl p-6 sm:p-7">
            <div className="flex items-center gap-3 border-b border-white/5 pb-5 mb-6">
              <div className="rounded-xl bg-indigo-500/10 p-2.5 text-indigo-400 border border-indigo-500/20">
                <Bell size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Activité récente</h2>
                <p className="text-xs text-zinc-400">Dernières requêtes de l&apos;équipe</p>
              </div>
            </div>

            <div className="space-y-4">
              {data.requests.slice(0, 5).map((req) => (
                <div key={req.id} className="relative flex gap-3.5 rounded-2xl bg-white/[0.02] border border-white/5 p-3.5 transition-all hover:bg-white/[0.04]">
                  <div className="mt-0.5 shrink-0">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-xl border ${STATUS_CONFIG[req.status].badge}`}>
                      {STATUS_CONFIG[req.status].icon}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-white truncate">{req.type}</p>
                      <span className="text-[10px] text-zinc-500 shrink-0">{timeAgo(req.createdAt)}</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{req.message || "Aucune précision apportée."}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </aside>

      </div>
    </div>
  );
}