"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetchClient, getToken } from "@/lib/clientApi";
import {
  Mail, Shield, ArrowLeft, Loader2,
  CheckCircle2, XCircle, Clock, Info, Star, ClipboardList
} from "lucide-react";

type Employee = { id: number; name: string; email: string; role: string; status: string };
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    Promise.all([
      apiFetchClient<Employee>(`/employees/${id}`),
      apiFetchClient<RequestItem[]>(`/requests?employeeId=${id}`).catch(() => []),
    ])
      .then(([emp, reqs]) => { setEmployee(emp); setRequests(reqs); })
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
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
          <Loader2 className="animate-spin text-blue-600" size={28} />
        </div>
        <p className="text-sm font-medium text-slate-500">Chargement du profil...</p>
      </div>
    </div>
  );

  if (!employee) return null;

  return (
    <div className="space-y-8">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <Link href="/employees" className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-blue-300 hover:text-blue-600">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">{employee.name}</h1>
          <p className="text-xs text-slate-400">Profil employé</p>
        </div>
        <span className={`ml-auto rounded-full px-3 py-1 text-xs font-bold ${employee.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
          ● {employee.status === "active" ? "En poste" : "Inactif"}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-100 text-3xl font-bold text-blue-600">
              {employee.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-slate-900">{employee.name}</h2>
            <p className="mt-1.5 flex items-center justify-center gap-1.5 text-sm text-slate-500">
              <Mail size={13} /> {employee.email}
            </p>
            <div className="mt-3 flex justify-center">
              <span className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                <Shield size={10} /> {employee.role.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Score */}
          {score && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Implication</p>
              <div className="mb-3 flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} size={18} className={i <= score.stars ? "fill-amber-400 text-amber-400" : "text-slate-200"} />
                ))}
              </div>
              <p className="text-4xl font-bold text-slate-900">{score.pct}%</p>
              <p className="mt-1 text-xs text-slate-400">{score.approved} / {score.total} approuvées</p>
            </div>
          )}

          {/* Requests count */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                <ClipboardList size={15} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{requests.length}</p>
                <p className="text-xs text-slate-400">Demande{requests.length !== 1 ? "s" : ""} au total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Request history */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-500">
            <ClipboardList size={14} /> Historique des demandes
          </h3>

          {requests.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50">
                <ClipboardList className="text-slate-300" size={24} />
              </div>
              <p className="font-bold text-slate-700">Aucune demande</p>
              <p className="mt-1 text-sm text-slate-400">Cet employé n&apos;a pas encore soumis de demande.</p>
            </div>
          ) : (
            requests.map(req => {
              const config = statusConfig[req.status] ?? statusConfig.pending;
              const StatusIcon = config.icon;
              return (
                <div key={req.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="flex items-start justify-between gap-4 p-6">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">REQ-{req.id}</span>
                      <h4 className="mt-0.5 font-bold text-slate-900">{req.type}</h4>
                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(req.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <div className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase ${config.bg} ${config.text} ${config.border}`}>
                      <StatusIcon size={12} />
                      {statusLabel[req.status] ?? req.status}
                    </div>
                  </div>

                  {(req.message || req.adminMessage) && (
                    <div className="border-t border-slate-100 px-6 py-4 space-y-3">
                      {req.message && (
                        <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm italic text-slate-600">&quot;{req.message}&quot;</p>
                      )}
                      {req.adminMessage && (
                        <div className="rounded-xl border border-blue-100/60 bg-blue-50/50 px-4 py-3">
                          <p className="mb-1 text-[10px] font-bold uppercase text-blue-400">Réponse admin</p>
                          <p className="text-xs text-blue-700">{req.adminMessage}</p>
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
