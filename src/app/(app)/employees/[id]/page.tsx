"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetchClient, getToken } from "@/lib/clientApi";
import {
  User, Mail, Shield, ArrowLeft, Loader2,
  CheckCircle2, XCircle, Clock, Info, Star
} from "lucide-react";

type Employee = { id: number; name: string; email: string; role: string; status: string };
type RequestLog = { id: number; action: string; note?: string | null; createdAt: string; byEmployeeName?: string | null };
type RequestItem = {
  id: number; type: string; status: string; message?: string | null;
  createdAt: string; adminMessage?: string | null; logs?: RequestLog[];
};

const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
  approved: { bg: "bg-emerald-50 border-emerald-100", text: "text-emerald-700", icon: CheckCircle2 },
  rejected:  { bg: "bg-rose-50 border-rose-100",    text: "text-rose-700",    icon: XCircle },
  office:    { bg: "bg-blue-50 border-blue-100",    text: "text-blue-700",    icon: Info },
  pending:   { bg: "bg-amber-50 border-amber-100",  text: "text-amber-700",   icon: Clock },
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
      .then(([emp, reqs]) => {
        setEmployee(emp);
        setRequests(reqs);
      })
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
    <div className="flex h-96 items-center justify-center text-indigo-500">
      <Loader2 className="animate-spin" size={40} />
    </div>
  );

  if (!employee) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 md:p-6">
      {/* Back */}
      <Link href="/requests" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">
        <ArrowLeft size={16} /> Retour aux demandes
      </Link>

      {/* Header profil */}
      <div className="rounded-3xl border border-slate-200/60 bg-white p-8 shadow-lg shadow-indigo-500/5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-100 to-indigo-200 text-3xl font-extrabold text-indigo-600 shadow-inner">
            {employee.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-extrabold text-slate-900">{employee.name}</h1>
            <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
              <Mail size={14} /> {employee.email}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                <Shield size={11} /> {employee.role.toUpperCase()}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${employee.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                ● {employee.status === "active" ? "En poste" : "Inactif"}
              </span>
            </div>
          </div>

          {/* Score implication */}
          {score && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center min-w-[140px]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Implication</p>
              <div className="flex justify-center gap-0.5 mb-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} size={18} className={i <= score.stars ? "fill-amber-400 text-amber-400" : "text-slate-200"} />
                ))}
              </div>
              <p className="text-2xl font-extrabold text-slate-900">{score.pct}%</p>
              <p className="text-xs text-slate-400 mt-0.5">{score.approved}/{score.total} approuvées</p>
            </div>
          )}
        </div>
      </div>

      {/* Historique des demandes */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800 px-1">Historique des demandes</h2>
        {requests.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center text-slate-400">
            <User className="mx-auto mb-3 opacity-20" size={40} />
            <p className="font-medium">Aucune demande pour cet employé.</p>
          </div>
        ) : (
          requests.map(req => {
            const config = statusConfig[req.status] || statusConfig.pending;
            const StatusIcon = config.icon;
            return (
              <div key={req.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">REQ-{req.id}</span>
                    <h3 className="font-bold text-slate-900 mt-0.5">{req.type}</h3>
                    <p className="text-xs text-slate-400 mt-1">{new Date(req.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
                  </div>
                  <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase ${config.bg} ${config.text}`}>
                    <StatusIcon size={13} />
                    {statusLabel[req.status] ?? req.status}
                  </div>
                </div>
                {req.message && (
                  <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 italic">"{req.message}"</p>
                )}
                {req.adminMessage && (
                  <p className="mt-3 rounded-2xl bg-indigo-50/50 border border-indigo-100/50 px-4 py-3 text-xs text-indigo-700">
                    <span className="font-bold block mb-1">Réponse admin</span>{req.adminMessage}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
