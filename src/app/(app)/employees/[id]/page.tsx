"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetchClient, getToken } from "@/lib/clientApi";
import {
  Mail, Shield, ArrowLeft, Loader2,
  CheckCircle2, XCircle, Clock, Info, Star, ClipboardList, CalendarClock
} from "lucide-react";

type Employee = { id: number; name: string; email: string; role: string; status: string };
type AvailabilitySlot = { id: number; dayOfWeek: number; startTime: string; endTime: string };

const DAYS_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
type RequestLog = { id: number; action: string; note?: string | null; createdAt: string; byEmployeeName?: string | null };
type RequestItem = {
  id: number; type: string; status: string; message?: string | null;
  createdAt: string; adminMessage?: string | null; logs?: RequestLog[];
};

const statusConfig: Record<string, { bg: string; text: string; border: string; icon: React.ComponentType<{ size?: number }> }> = {
  approved: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100", icon: CheckCircle2 },
  rejected:  { bg: "bg-rose-50",   text: "text-rose-700",   border: "border-rose-100",    icon: XCircle },
  office:    { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-100",    icon: Info },
  pending:   { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-100",   icon: Clock },
};

const statusLabel: Record<string, string> = {
  pending: "En attente", approved: "Approuvée", rejected: "Refusée", office: "Convocation",
};

export default function EmployeeProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    Promise.all([
      apiFetchClient<Employee>(`/employees/${id}`),
      apiFetchClient<RequestItem[]>(`/requests?employeeId=${id}`).catch(() => []),
      apiFetchClient<AvailabilitySlot[]>(`/availability/employee/${id}`).catch(() => []),
    ])
      .then(([emp, reqs, avail]) => { setEmployee(emp); setRequests(reqs); setAvailability(avail); })
      .catch(() => router.push("/employees"))
      .finally(() => setLoading(false));
  }, [id, router]);

  const score = useMemo(() => {
    if (!requests.length) return null;
    const approved = requests.filter(r => r.status === "approved").length;
    const total = requests.length;
    const pct = Math.round((approved / total) * 100);
    const stars = Math.round((pct / 100) * 5);
    return { approved, total, pct, stars };
  }, [requests]);

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-white/5">
          <Loader2 className="animate-spin text-gray-400 dark:text-white/30" size={28} />
        </div>
        <p className="text-sm font-medium text-gray-400 dark:text-white/30">Chargement du profil...</p>
      </div>
    </div>
  );

  if (!employee) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <Link href="/employees" className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm transition hover:text-gray-900 dark:bg-white/5 dark:text-white/40 dark:shadow-none dark:hover:text-white">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{employee.name}</h1>
          <p className="text-xs text-gray-400 dark:text-white/30">Profil employé</p>
        </div>
        <span className={`ml-auto rounded-full px-3 py-1 text-xs font-bold ${employee.status === "active" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-white/40"}`}>
          ● {employee.status === "active" ? "En poste" : "Inactif"}
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Profile card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl bg-white p-6 shadow-sm text-center dark:bg-white/5 dark:shadow-none">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#B4FF39] text-3xl font-bold text-black">
              {employee.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{employee.name}</h2>
            <p className="mt-1.5 flex items-center justify-center gap-1.5 text-sm text-gray-400 dark:text-white/30">
              <Mail size={13} /> {employee.email}
            </p>
            <div className="mt-3 flex justify-center">
              <span className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600 dark:bg-white/10 dark:text-white/60">
                <Shield size={10} /> {employee.role.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Score */}
          {score && (
            <div className="rounded-2xl bg-white p-6 shadow-sm text-center dark:bg-white/5 dark:shadow-none">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-white/30">Implication</p>
              <div className="mb-3 flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} size={18} className={i <= score.stars ? "fill-amber-400 text-amber-400" : "text-gray-200 dark:text-white/10"} />
                ))}
              </div>
              <p className="text-4xl font-bold text-gray-900 dark:text-white">{score.pct}%</p>
              <p className="mt-1 text-xs text-gray-400 dark:text-white/30">{score.approved} / {score.total} approuvées</p>
            </div>
          )}

          {/* Requests count */}
          <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-white/5 dark:shadow-none">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/10">
                <ClipboardList size={15} className="text-gray-500 dark:text-white/50" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{requests.length}</p>
                <p className="text-xs text-gray-400 dark:text-white/30">Demande{requests.length !== 1 ? "s" : ""} au total</p>
              </div>
            </div>
          </div>

          {/* Disponibilités */}
          <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-white/5 dark:shadow-none">
            <p className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-white/30">
              <CalendarClock size={12} /> Disponibilités déclarées
            </p>
            {availability.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-white/30">Aucune disponibilité renseignée.</p>
            ) : (
              <div className="space-y-2">
                {DAYS_SHORT.map((day, i) => {
                  const daySlots = availability.filter((s) => s.dayOfWeek === i);
                  if (daySlots.length === 0) return null;
                  return (
                    <div key={day} className="flex items-center gap-2 text-xs">
                      <span className="w-8 shrink-0 font-bold text-gray-500 dark:text-white/50">{day}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {daySlots.map((s) => (
                          <span key={s.id} className="rounded-full bg-gray-100 px-2 py-0.5 font-semibold text-gray-600 dark:bg-white/10 dark:text-white/60">
                            {s.startTime}–{s.endTime}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Request history */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-gray-400 dark:text-white/30">
            <ClipboardList size={14} /> Historique des demandes
          </h3>

          {requests.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center shadow-sm dark:bg-white/5 dark:shadow-none">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/5">
                <ClipboardList className="text-gray-300 dark:text-white/15" size={24} />
              </div>
              <p className="font-bold text-gray-700 dark:text-white/70">Aucune demande</p>
              <p className="mt-1 text-sm text-gray-400 dark:text-white/30">Cet employé n&apos;a pas encore soumis de demande.</p>
            </div>
          ) : (
            requests.map(req => {
              const config = statusConfig[req.status] ?? statusConfig.pending;
              const StatusIcon = config.icon;
              return (
                <div key={req.id} className="rounded-2xl bg-white shadow-sm overflow-hidden dark:bg-white/5 dark:shadow-none">
                  <div className="flex items-start justify-between gap-4 p-6">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider dark:text-white/30">REQ-{req.id}</span>
                      <h4 className="mt-0.5 font-bold text-gray-900 dark:text-white">{req.type}</h4>
                      <p className="mt-1 text-xs text-gray-400 dark:text-white/30">
                        {new Date(req.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <div className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase ${config.bg} ${config.text} dark:bg-white/10 dark:text-white/70`}>
                      <StatusIcon size={12} />
                      {statusLabel[req.status] ?? req.status}
                    </div>
                  </div>

                  {(req.message || req.adminMessage) && (
                    <div className="border-t border-gray-50 px-6 py-4 space-y-3 dark:border-white/5">
                      {req.message && (
                        <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm italic text-gray-600 dark:bg-white/5 dark:text-white/50">&quot;{req.message}&quot;</p>
                      )}
                      {req.adminMessage && (
                        <div className="rounded-xl bg-blue-50/50 px-4 py-3 dark:bg-blue-500/10">
                          <p className="mb-1 text-[10px] font-bold uppercase text-blue-400">Réponse admin</p>
                          <p className="text-xs text-blue-700 dark:text-blue-300">{req.adminMessage}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
