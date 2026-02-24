"use client";

import Link from "next/link";
import { ChevronLeft, ShieldCheck, ArrowRight } from "lucide-react";

export default function SignupPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Bouton Retour */}
      <Link
        href="/"
        className="group inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-12 font-medium"
      >
        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Retour à l'accueil
      </Link>

      <div className="space-y-12">
        {/* Header Section */}
        <header className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-widest mb-6">
            Inscription
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
            Créez votre <br />
            <span className="text-indigo-600">organisation</span>
          </h1>
          <p className="mt-6 text-lg text-slate-500 leading-relaxed">
            Créez votre compte administrateur pour gérer vos équipes et plannings.
          </p>
        </header>

        {/* Carte ADMIN uniquement */}
        <section className="max-w-md">
          <Link
            href="/signup/admin"
            className="group relative p-8 rounded-[32px] bg-white border border-slate-200 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 overflow-hidden flex flex-col"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <ShieldCheck className="w-32 h-32" />
            </div>

            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Compte Administrateur</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">
                Pour les gérants et RH. Créez votre organisation, invitez vos équipes et gérez les plannings de A à Z.
              </p>
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                Créer une organisation
                <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </div>
            </div>
          </Link>
        </section>

        {/* Footer info */}
        <p className="text-sm text-slate-400">
          Vous avez déjà un compte ?{" "}
          <Link href="/login" className="text-indigo-600 font-semibold hover:underline">
            Connectez-vous ici
          </Link>
        </p>
      </div>
    </div>
  );
}
