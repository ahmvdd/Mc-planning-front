"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetchClient, getToken } from "@/lib/clientApi";
import { 
  Users, ClipboardList, FileText, CalendarDays, 
  Bell, Send, Loader2, AlertCircle 
} from "lucide-react";

// --- Types ---
type Employee = { id: number; name: string; email: string; role: string; status: string };
type PlanningEntry = { id: number; date: string; shift: string; note?: string | null; employeeId?: number | null };
type RequestItem = { id: number; employeeId: number; type: string; status: string; message?: string | null; createdAt: string; managerEmail?: string | null };

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });

interface DashboardData {
  planning: PlanningEntry[];
  requests: RequestItem[];
  employees: Employee[];
  me: { role?: string } | null;
}

// --- Hook de Logique ---
function useDashboard() {
  const [data, setData] = useState<DashboardData>({
    planning: [], requests: [], employees: [], me: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
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
          apiFetchClient<{ role?: string }>("/auth/me").catch(() => null),
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
    const pending = data.requests.filter(r => r.status === "pending").length;
    const approved = data.requests.filter(r => r.status === "approved").length;
    const rejected = data.requests.filter(r => r.status === "rejected").length;
    const office = data.requests.filter(r => r.status === "office").length;
    const total = data.requests.length;
    const upcomingShifts = [...data.planning]
      .filter(s => new Date(s.date) >= new Date(new Date().setHours(0,0,0,0)))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 7);
    return { pending, approved, rejected, office, total, activeEmployees: data.employees.length, upcomingShifts };
  }, [data]);

  return { data, loading, error, stats };
}

// --- Sous-composants UI ---

const StatBadge = ({ icon: Icon, label, color }: { icon: any, label: string, color: string }) => (
  <span className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 font-semibold text-xs ${color}`}>
    <Icon size={13} /> {label}
  </span>
);

const Card = ({ title, icon: Icon, children, className = "" }: any) => (
  <div className={`rounded-3xl border border-slate-200/60 bg-white p-6 shadow-lg shadow-indigo-500/10 ${className}`}>
    {title && (
      <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
        {Icon && <Icon size={18} className="text-indigo-500" />}
        {title}
      </h3>
    )}
    {children}
  </div>
);

// --- Composant Principal ---

export default function DashboardPage() {
  const { data, loading, error, stats } = useDashboard();

  if (loading) return (
    <div className="flex h-96 flex-col items-center justify-center gap-4 text-slate-500">
      <Loader2 className="animate-spin" size={32} />
      <p className="animate-pulse">Chargement de votre espace...</p>
    </div>
  );

  if (error) return (
    <Card className="max-w-md mx-auto mt-10 text-center">
      <AlertCircle className="mx-auto text-red-500 mb-3" size={40} />
      <h2 className="text-xl font-bold text-slate-900">Oups !</h2>
      <p className="text-slate-600 mt-2">{error}</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/login" className="rounded-xl bg-slate-900 px-6 py-2 text-sm font-semibold text-white">Connexion</Link>
      </div>
    </Card>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-6">
      {/* Header Section */}
      <header className="rounded-3xl border border-slate-200/60 bg-white p-6 md:p-8 shadow-lg shadow-indigo-500/10">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-500">Tableau de Bord</p>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Planning de l&apos;équipe</h1>
          <p className="text-slate-500 max-w-2xl">Gérez les horaires et communiquez avec vos collaborateurs en temps réel.</p>
        </div>
        
        <div className="mt-8 flex flex-wrap gap-3">
          <StatBadge icon={Users} label={`${stats.activeEmployees} employés`} color="bg-emerald-50 text-emerald-700" />
          <StatBadge icon={ClipboardList} label={`${stats.pending} en attente`} color="bg-blue-50 text-blue-700" />
          <StatBadge icon={FileText} label={`${stats.total} demandes`} color="bg-amber-50 text-amber-700" />
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        {/* Main Planning Column */}
        {/* Vue employé : mes prochains créneaux */}
        {data.me?.role !== "admin" && (
          <Card title="Mon planning" icon={CalendarDays} className="lg:col-span-2">
            {stats.upcomingShifts.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <CalendarDays className="mx-auto mb-3 opacity-20" size={40} />
                <p className="font-medium text-sm">Aucun créneau prévu.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 overflow-hidden">
                {stats.upcomingShifts.map(slot => (
                  <div key={slot.id} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50/50 transition-colors">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{slot.shift}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{fmtDate(slot.date)}</p>
                    </div>
                    {slot.note && (
                      <span className="text-xs bg-indigo-50 text-indigo-600 font-medium px-3 py-1 rounded-full">{slot.note}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Vue admin : graphe des demandes */}
        {data.me?.role === "admin" && (
          <Card title="Activité de l'entreprise" icon={CalendarDays} className="lg:col-span-2">
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { label: "Employés", value: stats.activeEmployees, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Demandes totales", value: stats.total, color: "text-indigo-600", bg: "bg-indigo-50" },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className={`rounded-2xl ${bg} p-4 text-center`}>
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
          </Card>
        )}

        {/* Sidebar */}
        <div className="space-y-6">
          <Card title="Demandes" icon={Bell}>
            <div className="space-y-3">
              {data.requests.length === 0 ? (
                <p className="text-slate-400 text-sm italic">Tout est à jour.</p>
              ) : (
                data.requests.slice(0, 3).map(req => (
                  <div key={req.id} className="group rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-hover hover:border-indigo-100 hover:bg-white">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-indigo-600">{req.type}</span>
                      <span className="text-[10px] text-slate-400">ID: {req.employeeId}</span>
                    </div>
                    <p className="text-sm text-slate-700 line-clamp-2 leading-relaxed">{req.message || "Sans message"}</p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card title="Contact rapide">
            <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
              <input 
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-focus focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                placeholder="Destinataire..."
              />
              <textarea 
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-focus focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
                placeholder="Votre message..."
                rows={3}
              />
              <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white hover:bg-indigo-600 transition-colors">
                <Send size={14} /> Envoyer
              </button>
            </form>
          </Card>
        </div>
      </section>
    </div>
  );
}