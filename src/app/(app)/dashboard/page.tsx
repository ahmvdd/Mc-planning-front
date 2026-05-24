"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetchClient, getToken } from "@/lib/clientApi";
import {
  Users, ClipboardList, CalendarDays, Bell, Loader2,
  TrendingUp, Clock, CheckCircle2, ArrowRight, XCircle, AlertCircle, Plus
} from "lucide-react";

// --- Types ---
type Role = "admin" | "employee";
type Status = "pending" | "approved" | "rejected" | "office";

interface Employee { id: number; name: string; email: string; role: Role; status: string }
interface PlanningEntry { id: number; date: string; shift: string; note?: string | null; employeeId?: number | null }
interface RequestItem { id: number; employeeId: number; type: string; status: Status; message?: string | null; createdAt: string }

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

const STATUS_CONFIG: Record<Status, { label: string; color: string; bar: string; dot: string; icon: React.ReactNode }> = {
  pending:  { label: "En attente", color: "text-amber-400 bg-amber-400/10 border-amber-400/20",   bar: "bg-amber-400",   dot: "bg-amber-400",   icon: <Clock size={12} /> },
  approved: { label: "Validé",     color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", bar: "bg-emerald-400", dot: "bg-emerald-400", icon: <CheckCircle2 size={12} /> },
  rejected: { label: "Refusé",     color: "text-rose-400 bg-rose-400/10 border-rose-400/20",       bar: "bg-rose-400",    dot: "bg-rose-400",    icon: <XCircle size={12} /> },
  office:   { label: "Bureau",     color: "text-blue-400 bg-blue-400/10 border-blue-400/20",       bar: "bg-blue-400",    dot: "bg-blue-400",    icon: <AlertCircle size={12} /> },
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
    { id: 1, date: new Date(Date.now() + 86400000).toISOString(), shift: "Matin 8h-16h", note: "Site A" },
    { id: 2, date: new Date(Date.now() + 2 * 86400000).toISOString(), shift: "Après-midi 14h-22h", note: null },
    { id: 3, date: new Date(Date.now() + 4 * 86400000).toISOString(), shift: "Nuit 22h-6h", note: "Urgence" },
  ],
  requests: [
    { id: 1, employeeId: 1, type: "Congé annuel", status: "pending", message: "Vacances été", createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 2, employeeId: 2, type: "Arrêt maladie", status: "approved", message: "Certificat joint", createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 3, employeeId: 1, type: "Convocation bureau", status: "office", message: "Réunion RH", createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
    { id: 4, employeeId: 3, type: "Congé sans solde", status: "rejected", message: "Demande refusée", createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
  ],
};

function useDashboard() {
  const [data, setData] = useState<DashboardData>({ planning: [], requests: [], employees: [], me: null });
  const [loading, setLoading] = useState(!DEV_BYPASS);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (DEV_BYPASS) { setData(MOCK_DATA); return; }
    if (!getToken()) { router.push("/login"); return; }

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
    <div className="flex min-h-[80vh] flex-col items-center justify-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      <p className="text-sm text-zinc-500">Préparation de votre espace...</p>
    </div>
  );

  if (error) {
    const is5xx = error.includes("500") || error.toLowerCase().includes("internal") || error.toLowerCase().includes("server");
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${is5xx ? "bg-amber-500/10 text-amber-400" : "bg-rose-500/10 text-rose-400"}`}>
            <AlertCircle size={24} />
          </div>
          <h2 className="text-lg font-bold text-white">
            {is5xx ? "Erreur serveur" : "Accès restreint"}
          </h2>
          <p className="mt-2 text-sm text-zinc-400">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-6 w-full rounded-xl bg-zinc-800 py-3 text-sm font-bold text-white transition hover:bg-zinc-700">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-10 pb-12">

      {/* Header */}
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-zinc-800 pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Bonjour, {userName}
          </h1>
          <p className="mt-1 text-zinc-500 text-sm">
            Voici ce qu&apos;il se passe dans votre organisation aujourd&apos;hui.
          </p>
        </div>
        <Link href="/requests" className="flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500">
          <Plus size={16} /> Nouvelle demande
        </Link>
      </header>

      {/* Planning warning */}
      {isAdmin && stats.planningWarning && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-5 py-4">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-400" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-300">Planning à mettre à jour</p>
            <p className="text-xs text-amber-400/80 mt-0.5">Aucun créneau planifié dans les 2 prochaines semaines.</p>
          </div>
          <Link href="/planning" className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-amber-400">
            Mettre à jour
          </Link>
        </div>
      )}

      {/* Stats row — flat, no cards */}
      <section className="flex flex-wrap gap-10 border-b border-zinc-800 pb-8">
        {[
          { label: "Effectif", value: stats.totalEmployees, icon: Users, href: "/employees" },
          { label: "En attente", value: stats.pending || 0, icon: Clock, href: "/requests" },
          { label: "Créneaux", value: data.planning.length, icon: CalendarDays, href: "/planning" },
          { label: "Total demandes", value: stats.totalRequests, icon: ClipboardList, href: "/requests" },
        ].map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href} className="group flex flex-col gap-1.5 transition-opacity hover:opacity-80">
            <div className="flex items-center gap-1.5 text-zinc-500">
              <Icon size={14} />
              <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-3xl font-bold text-white">{value}</p>
          </Link>
        ))}
      </section>

      <div className="grid gap-10 lg:grid-cols-12">

        {/* Main column */}
        <div className="lg:col-span-8 space-y-10">

          {/* Planning à venir */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                {isAdmin ? "Planning équipe à venir" : "Mon planning à venir"}
              </h3>
              <Link href="/planning" className="flex items-center gap-1 text-xs font-semibold text-blue-500 hover:text-blue-400 transition-colors">
                Voir tout <ArrowRight size={12} />
              </Link>
            </div>

            {stats.upcoming.length === 0 ? (
              <div className="py-10 text-center">
                <CalendarDays size={28} className="mx-auto mb-3 text-zinc-700" />
                <p className="text-sm font-medium text-zinc-500">Aucun créneau à venir</p>
              </div>
            ) : (
              <div>
                {stats.upcoming
                  .filter(slot => isAdmin || slot.employeeId === data.me?.sub)
                  .map((slot, i, arr) => (
                    <div key={slot.id} className={`flex items-center gap-4 py-4 ${i < arr.length - 1 ? "border-b border-zinc-800/60" : ""}`}>
                      <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-zinc-800 text-white">
                        <span className="text-sm font-bold">{new Date(slot.date).getDate()}</span>
                        <span className="text-[10px] font-medium uppercase text-zinc-400">
                          {new Date(slot.date).toLocaleDateString("fr-FR", { month: "short" })}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-white">{slot.shift}</h4>
                        <p className="text-xs text-zinc-500 capitalize">{formatDate(slot.date)}</p>
                      </div>
                      {slot.note && (
                        <span className="rounded-md bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-400 border border-blue-500/20">
                          {slot.note}
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </section>

          {/* Répartition des demandes (admin) */}
          {isAdmin && (
            <section>
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp size={14} className="text-zinc-500" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Répartition des demandes</h3>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {(["pending", "approved", "rejected", "office"] as Status[]).map((s) => {
                  const count = (stats[s] || 0) as number;
                  const percentage = stats.totalRequests ? (count / stats.totalRequests) * 100 : 0;
                  const config = STATUS_CONFIG[s];
                  return (
                    <div key={s} className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-400">{config.label}</span>
                        <span className="font-bold text-white">{count}</span>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-800">
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

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-8">

          {/* Flux d'activité */}
          <section>
            <div className="flex items-center gap-2 mb-5">
              <Bell size={14} className="text-zinc-500" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Flux d&apos;activité</h3>
            </div>
            <div>
              {data.requests.slice(0, 4).map((req, i, arr) => (
                <div key={req.id} className={`flex gap-3 py-3 ${i < arr.length - 1 ? "border-b border-zinc-800/60" : ""}`}>
                  <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${STATUS_CONFIG[req.status].color}`}>
                    {STATUS_CONFIG[req.status].icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{req.type}</p>
                    <p className="text-[11px] text-zinc-500 line-clamp-1">{req.message || "Aucun message"}</p>
                    <p className="mt-0.5 text-[10px] text-zinc-600">{timeAgo(req.createdAt)}</p>
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
