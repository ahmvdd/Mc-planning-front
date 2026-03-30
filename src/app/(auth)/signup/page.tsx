"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, ShieldCheck, Users } from "lucide-react";

export default function SignupPage() {
  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-2xl shadow-black/50">
        {/* Top */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-8 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-lg font-black text-white">S</div>
          <h1 className="text-2xl font-black tracking-tight text-white">Créer un compte</h1>
          <p className="mt-1.5 text-sm text-indigo-100/80">Choisissez votre type de compte</p>
        </div>

        {/* Options */}
        <div className="space-y-3 p-6">
          <Link
            href="/signup/admin"
            className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-50"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
              <ShieldCheck size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900">Administrateur</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Créez votre organisation et gérez vos équipes</p>
            </div>
            <ArrowRight size={16} className="shrink-0 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-indigo-500" />
          </Link>

          <Link
            href="/signup/employee"
            className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-50"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-600">
              <Users size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900">Employé</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Rejoignez une organisation avec votre code</p>
            </div>
            <ArrowRight size={16} className="shrink-0 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-indigo-500" />
          </Link>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-slate-600">
            <ArrowLeft size={13} /> Accueil
          </Link>
          <p className="text-xs text-slate-400">
            Déjà membre ?{" "}
            <Link href="/login" className="font-bold text-indigo-600 hover:text-indigo-700">Connexion</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
