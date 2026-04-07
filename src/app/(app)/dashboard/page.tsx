"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetchClient, getToken } from "@/lib/clientApi";
import {
  Users, ClipboardList, CalendarDays, Bell, Send, Loader2, 
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

// --- Helpers & Constants ---
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

const STATUS_CONFIG: Record<Status, { label: string; color: string; bar: string; icon: React.ReactNode }> = {
  pending: { label: "En attente", color: "text-amber-600 bg-amber-50 border-amber-100", bar: "bg-amber-400", icon: <Clock size={12} /> },
  approved: { label: "Validé", color: "text-emerald-600 bg-emerald-50 border-emerald-100", bar: "bg-emerald-500", icon: <CheckCircle2 size={12} /> },
  rejected: { label: "Refusé", color: "text-rose-600 bg-rose-50 border-rose-100", bar: "bg-rose-500", icon: <XCircle size={12} /> },
  office: { label: "Bureau", color: "text-blue-600 bg-blue-50 border-blue-100", bar: "bg-blue-500", icon: <AlertCircle size={12} /> },
};

// --- Sous-Composants ---

const StatCard = ({ label, value, icon: Icon, href }: any) => (
  <Link href={href} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
      </div>
      <div className="rounded-xl bg-slate-50 p-3 text-slate-600 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600">
        <Icon size={24} />
      </div>
    </div>
    <div className="mt-4 flex items-center text-xs font-bold text-blue-600 opacity-0 transition-all group-hover:opacity-100">
      Gérer <ArrowRight size={12} className="ml-1" />
    </div>
  </Link>
);

const EmptyState = ({ icon: Icon, title, desc }: any) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300">
      <Icon size={32} />
    </div>
    <h4 className="text-sm font-bold text-slate-900">{title}</h4>
    <p className="mt-1 text-xs text-slate-500">{desc}</p>
  </div>
);

// --- Mock data (DEV only — NEXT_PUBLIC_DEV_BYPASS=true) ---
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

// --- Hook de données ---
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
    }, {} as Record<string, number>);

    const upcoming = data.planning
      .filter(s => new Date(s.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);

    return { ...counts, totalRequests: data.requests.length, upcoming, totalEmployees: data.employees.length };
  }, [data]);

  return { data, loading, error, stats };
}

export default function DashboardPage() {
  const { data, loading, error, stats } = useDashboard();
  const isAdmin = data.me?.role === "admin";

  if (loading) return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center space-y-4">
      <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      <p className="text-sm font-medium text-slate-500">Préparation de votre espace...</p>
    </div>
  );

  if (error) return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-rose-100 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-500">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Accès restreint</h2>
        <p className="mt-2 text-sm text-slate-500">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-6 w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-slate-800">
          Réessayer
        </button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-10 pb-12">
      
      {/* --- HEADER SECTION --- */}
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Bonjour, {data.me?.name || "utilisateur"} 👋
          </h1>
          <p className="mt-1 text-slate-500 text-sm">
            Voici ce qu&apos;il se passe dans votre organisation aujourd&apos;hui.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/requests" className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 hover:shadow-blue-300">
            <Plus size={18} /> Nouvelle demande
          </Link>
        </div>
      </header>

      {/* --- STATS GRID --- */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Effectif" value={stats.totalEmployees} icon={Users} href="/employees" />
        <StatCard label="En attente" value={stats.pending || 0} icon={Clock} href="/requests" />
        <StatCard label="Planning" value={data.planning.length} icon={CalendarDays} href="/planning" />
        <StatCard label="Total Demandes" value={stats.totalRequests} icon={ClipboardList} href="/requests" />
      </section>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* --- MAIN COLUMN --- */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* User's Planning */}
          <div className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
            <div className="flex items-center justify-between p-4">
              <h3 className="text-sm font-bold text-slate-900">Mon planning à venir</h3>
              <Link href="/planning" className="text-xs font-bold text-blue-600 hover:underline">Voir le calendrier complet</Link>
            </div>
            
            {stats.upcoming.length === 0 ? (
              <EmptyState icon={CalendarDays} title="Aucun créneau" desc="Vous n'avez pas de sessions prévues cette semaine." />
            ) : (
              <div className="space-y-1">
                {stats.upcoming.map((slot) => (
                  <div key={slot.id} className="group flex items-center gap-4 rounded-2xl p-4 transition-colors hover:bg-slate-50">
                    <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-slate-900 text-white transition-transform group-hover:scale-105">
                      <span className="text-sm font-bold">{new Date(slot.date).getDate()}</span>
                      <span className="text-[10px] font-medium uppercase opacity-70">
                        {new Date(slot.date).toLocaleDateString("fr-FR", { month: "short" })}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-900">{slot.shift}</h4>
                      <p className="text-xs text-slate-500 capitalize">{formatDate(slot.date)}</p>
                    </div>
                    {slot.note && (
                      <span className="rounded-lg bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-600">{slot.note}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Admin Insights (Progress bars) */}
          {isAdmin && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-2">
                <TrendingUp size={18} className="text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Répartition des demandes</h3>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                {(["pending", "approved", "rejected", "office"] as Status[]).map((s) => {
                  const count = (stats[s] || 0) as number;
                  const percentage = stats.totalRequests ? (count / stats.totalRequests) * 100 : 0;
                  const config = STATUS_CONFIG[s];
                  return (
                    <div key={s} className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-600">{config.label}</span>
                        <span className="text-slate-900">{count}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${config.bar}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* --- SIDEBAR --- */}
        <aside className="lg:col-span-4 space-y-8">
          
          {/* Notifications / Recent Requests */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Bell size={16} className="text-rose-500" /> Flux d&apos;activité
              </h3>
            </div>
            <div className="space-y-4">
              {data.requests.slice(0, 4).map((req) => (
                <div key={req.id} className="relative flex gap-4 pb-4 last:pb-0 last:after:hidden after:absolute after:left-[11px] after:top-8 after:h-full after:w-[1px] after:bg-slate-100">
                  <div className={`mt-1 h-[22px] w-[22px] shrink-0 rounded-full border-2 border-white ring-2 ring-transparent flex items-center justify-center ${STATUS_CONFIG[req.status].color}`}>
                    {STATUS_CONFIG[req.status].icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{req.type}</p>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{req.message || "Aucun message attaché"}</p>
                    <p className="mt-1 text-[10px] font-medium text-slate-400">{timeAgo(req.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Contact Form */}
          <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-xl">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <Send size={16} className="text-blue-400" /> Support Rapide
            </h3>
            <p className="mt-2 text-xs text-slate-400">Besoin d&apos;aide ou d&apos;un changement urgent ?</p>
            <div className="mt-4 space-y-3">
              <textarea
                className="w-full rounded-xl border-none bg-white/10 p-3 text-xs text-white placeholder-slate-500 outline-none ring-1 ring-white/20 focus:ring-blue-500"
                placeholder="Décrivez votre besoin..."
                rows={3}
              />
              <button className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold transition hover:bg-blue-500">
                Envoyer le message
              </button>
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
}