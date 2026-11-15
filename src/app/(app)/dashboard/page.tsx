"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetchClient, getToken } from "@/lib/clientApi";
import {
  Bell,
  Clock, CheckCircle2, ArrowUpRight, XCircle, AlertCircle, Plus,
  Calendar, RefreshCw
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
    badge: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10",
    bar: "bg-amber-400",
    icon: <Clock size={13} />
  },
  approved: {
    label: "Validé",
    badge: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10",
    bar: "bg-emerald-400",
    icon: <CheckCircle2 size={13} />
  },
  rejected: {
    label: "Refusé",
    badge: "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10",
    bar: "bg-rose-400",
    icon: <XCircle size={13} />
  },
  office: {
    label: "Bureau",
    badge: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10",
    bar: "bg-blue-400",
    icon: <AlertCircle size={13} />
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
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4">
      <div className="h-9 w-9 rounded-full border-2 border-black/10 border-t-black animate-spin dark:border-white/10 dark:border-t-white" />
      <p className="text-xs font-medium tracking-wide text-gray-400 uppercase dark:text-white/30">Chargement de votre espace...</p>
    </div>
  );

  if (error) {
    const is5xx = error.includes("500") || error.toLowerCase().includes("internal") || error.toLowerCase().includes("server");
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-white/5 dark:shadow-none">
          <div className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${is5xx ? "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400" : "bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400"}`}>
            <AlertCircle size={28} />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            {is5xx ? "Problème serveur" : "Accès non autorisé"}
          </h2>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed dark:text-white/40">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 hover:bg-gray-800 py-3 text-sm font-semibold text-white transition-all active:scale-[0.98] dark:bg-[#B4FF39] dark:text-black dark:hover:bg-[#a3ec2e]"
          >
            <RefreshCw size={15} /> Réessayer
          </button>
        </div>
      </div>
    );
  }

  const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const weekCounts = WEEKDAYS.map((_, i) => {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    const next = new Date(day);
    next.setDate(day.getDate() + 1);
    return data.planning.filter(s => { const d = new Date(s.date); return d >= day && d < next; }).length;
  });
  const maxCount = Math.max(1, ...weekCounts);
  const todayIdx = (new Date().getDay() + 6) % 7;

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 leading-[1.1] dark:text-white">
          {isAdmin ? <>Bonjour,<br />{userName}</> : <>Votre<br />espace</>}
        </h1>

        <div className="flex items-center gap-3">
          {!isAdmin && (
            <Link
              href="/requests"
              className="inline-flex items-center gap-2 rounded-full bg-gray-900 hover:bg-gray-800 px-5 py-3 text-sm font-bold text-white transition-all active:scale-95 dark:bg-[#B4FF39] dark:text-black dark:hover:bg-[#a3ec2e]"
            >
              <Plus size={16} /> Nouvelle demande
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/planning"
              className="inline-flex items-center gap-2 rounded-full bg-gray-900 hover:bg-gray-800 px-5 py-3 text-sm font-bold text-white transition-all active:scale-95 dark:bg-[#B4FF39] dark:text-black dark:hover:bg-[#a3ec2e]"
            >
              <Calendar size={16} /> Gérer le planning
            </Link>
          )}
        </div>
      </div>

      {/* Planning warning */}
      {isAdmin && stats.planningWarning && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-amber-50 p-5 dark:bg-amber-500/10">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-amber-100 p-2 text-amber-600 shrink-0 dark:bg-amber-500/15 dark:text-amber-400">
              <AlertCircle size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-300">Mise à jour requise</h3>
              <p className="text-xs text-amber-700 mt-0.5 dark:text-amber-400/70">Aucun créneau planifié sur les 14 prochains jours pour votre équipe.</p>
            </div>
          </div>
          <Link href="/planning" className="shrink-0 rounded-full bg-amber-900 hover:bg-amber-800 px-4 py-2 text-xs font-bold text-white transition-colors text-center dark:bg-amber-400 dark:text-black dark:hover:bg-amber-300">
            Planifier des shifts
          </Link>
        </div>
      )}

      {/* Stat cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Membres d'équipe", value: stats.totalEmployees, sub: "employés actifs", href: "/employees", hero: true },
          { label: "En attente", value: stats.pending || 0, sub: "demandes à traiter", href: "/requests" },
          { label: "Créneaux planifiés", value: data.planning.length, sub: "sur la période", href: "/planning" },
          { label: "Total demandes", value: stats.totalRequests, sub: "toutes périodes", href: "/requests" },
        ].map(({ label, value, sub, href, hero }) => (
          <Link
            key={label}
            href={href}
            className={`group rounded-2xl p-5 transition-all ${
              hero
                ? "bg-gray-900 text-white dark:bg-[#B4FF39] dark:text-black"
                : "bg-white text-gray-900 shadow-sm hover:shadow-md dark:bg-white/5 dark:text-white dark:shadow-none dark:hover:bg-white/[0.07]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${hero ? "text-white/50 dark:text-black/50" : "text-gray-400 dark:text-white/30"}`}>{label}</span>
              <div className={`flex h-7 w-7 items-center justify-center rounded-full transition-transform group-hover:rotate-45 ${
                hero ? "bg-white/10 text-white dark:bg-black/10 dark:text-black" : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-white/50"
              }`}>
                <ArrowUpRight size={13} />
              </div>
            </div>
            <div className="mt-4 text-3xl font-bold tracking-tight">{value}</div>
            <p className={`mt-1 text-xs ${hero ? "text-white/40 dark:text-black/40" : "text-gray-400 dark:text-white/30"}`}>{sub}</p>
          </Link>
        ))}
      </section>

      {/* Main content */}
      <div className="grid gap-5 lg:grid-cols-12">

        {/* Left: week chart */}
        <section className="lg:col-span-7 rounded-2xl bg-white p-6 sm:p-7 shadow-sm dark:bg-white/5 dark:shadow-none">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Créneaux de la semaine</h2>
              <p className="text-xs text-gray-400 mt-0.5 dark:text-white/30">Répartition par jour</p>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500 dark:bg-white/10 dark:text-white/50">Cette semaine</span>
          </div>

          <div className="flex items-end justify-between gap-3 h-44">
            {WEEKDAYS.map((day, i) => {
              const count = weekCounts[i];
              const heightPct = Math.max(8, (count / maxCount) * 100);
              const isToday = i === todayIdx;
              return (
                <div key={day} className="flex flex-1 flex-col items-center gap-2.5">
                  <span className={`text-xs font-bold ${isToday ? "text-gray-900 dark:text-white" : "text-gray-300 dark:text-white/20"}`}>{count || ""}</span>
                  <div className="flex w-full items-end justify-center h-full">
                    <div
                      className={`w-full max-w-9 rounded-lg transition-all ${isToday ? "bg-[#B4FF39]" : "bg-gray-100 dark:bg-white/10"}`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className={`text-xs font-semibold ${isToday ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-white/30"}`}>{day}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right: activity feed */}
        <aside className="lg:col-span-5 rounded-2xl bg-white p-6 sm:p-7 shadow-sm dark:bg-white/5 dark:shadow-none">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <Bell size={16} className="text-gray-400 dark:text-white/30" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Activité récente</h2>
            </div>
          </div>

          {data.requests.length === 0 ? (
            <p className="text-xs text-gray-400 py-8 text-center dark:text-white/30">Aucune demande pour le moment.</p>
          ) : (
            <div className="space-y-1">
              {data.requests.slice(0, 6).map((req) => (
                <div key={req.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0 dark:border-white/5">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${STATUS_CONFIG[req.status].badge}`}>
                    {STATUS_CONFIG[req.status].icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate dark:text-white">{req.type}</p>
                    <p className="text-xs text-gray-400 truncate dark:text-white/30">{req.message || "Aucune précision"}</p>
                  </div>
                  <span className="text-[10px] text-gray-300 shrink-0 dark:text-white/20">{timeAgo(req.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </aside>

      </div>

      {/* Upcoming planning */}
      <section className="rounded-2xl bg-white p-6 sm:p-7 shadow-sm dark:bg-white/5 dark:shadow-none">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              {isAdmin ? "Planning Général de l'Équipe" : "Mon Planning Prochain"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 dark:text-white/30">Prochains créneaux attribués</p>
          </div>
          <Link href="/planning" className="flex items-center gap-1.5 text-xs font-bold text-gray-900 hover:opacity-60 transition-opacity dark:text-white">
            Voir tout <ArrowUpRight size={13} />
          </Link>
        </div>

        {stats.upcoming.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-sm font-semibold text-gray-500 dark:text-white/40">Aucun créneau programmé</p>
            <p className="text-xs text-gray-400 mt-1 dark:text-white/25">Les créneaux futurs apparaîtront ici.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stats.upcoming
              .filter(slot => isAdmin || !slot.employeeId || slot.employeeId === data.me?.sub)
              .map((slot) => (
                <div key={slot.id} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3.5 dark:bg-white/5">
                  <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-white shadow-sm dark:bg-white/10 dark:shadow-none">
                    <span className="text-sm font-bold leading-none text-gray-900 dark:text-white">{new Date(slot.date).getDate()}</span>
                    <span className="text-[9px] font-medium uppercase text-gray-400 mt-0.5 dark:text-white/30">
                      {new Date(slot.date).toLocaleDateString("fr-FR", { month: "short" })}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-gray-900 truncate dark:text-white">{slot.shift}</h4>
                    <p className="text-[11px] text-gray-400 capitalize truncate dark:text-white/30">{formatDate(slot.date)}</p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}