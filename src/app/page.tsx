"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { apiFetchClient, getToken } from "@/lib/clientApi";
import {
  ArrowRight, Calendar, Users, ClipboardCheck,
  ShieldCheck, Zap, BarChart3, CheckCircle2,
  ChevronRight, Star, AlignLeft, X
} from "lucide-react";

const fadeHidden = { opacity: 0, y: 20 };
const fadeShow = (delay = 0) => ({
  opacity: 1,
  y: 0,
  transition: { duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
});

const FEATURES = [
  {
    icon: Calendar,
    color: "bg-indigo-500",
    light: "bg-indigo-50 text-indigo-600",
    title: "Planning intelligent",
    desc: "Construisez des plannings en quelques clics. Visualisez les disponibilités, gérez les conflits et exportez en Excel instantanément.",
  },
  {
    icon: ClipboardCheck,
    color: "bg-violet-500",
    light: "bg-violet-50 text-violet-600",
    title: "Demandes & congés",
    desc: "Vos employés soumettent leurs demandes directement depuis l'app. Validez ou refusez en un clic, avec historique complet.",
  },
  {
    icon: Users,
    color: "bg-sky-500",
    light: "bg-sky-50 text-sky-600",
    title: "Gestion d'équipe",
    desc: "Onboardez vos collaborateurs par invitation email. Gérez les rôles, profils et accès depuis un tableau de bord centralisé.",
  },
  {
    icon: ShieldCheck,
    color: "bg-emerald-500",
    light: "bg-emerald-50 text-emerald-600",
    title: "Sécurité & conformité",
    desc: "Données chiffrées, hébergement cloud RGPD, tokens JWT rotatifs. Votre sécurité est notre priorité numéro un.",
  },
  {
    icon: Zap,
    color: "bg-amber-500",
    light: "bg-amber-50 text-amber-600",
    title: "Rapide & responsive",
    desc: "Interface optimisée mobile et bureau. Accès instantané au planning depuis n'importe quel appareil, n'importe où.",
  },
  {
    icon: BarChart3,
    color: "bg-rose-500",
    light: "bg-rose-50 text-rose-600",
    title: "Statistiques en temps réel",
    desc: "Suivez le taux de présence, les heures travaillées et les tendances de demandes. Prenez de meilleures décisions.",
  },
];

const STEPS = [
  { n: "01", title: "Créez votre organisation", desc: "Inscrivez-vous et obtenez votre code organisation unique en 30 secondes." },
  { n: "02", title: "Invitez votre équipe", desc: "Partagez le code ou envoyez des invitations email à vos collaborateurs." },
  { n: "03", title: "Gérez en temps réel", desc: "Plannings, demandes, profils — tout au même endroit, tout de suite." },
];

export default function Home() {
  const [me, setMe] = useState<{ email?: string; role?: string } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!getToken()) return;
    apiFetchClient<{ email?: string; role?: string }>("/auth/me")
      .then(setMe)
      .catch(() => setMe(null));
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden font-sans selection:bg-indigo-500 selection:text-white">

      {/* ── NAV ── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-black text-white shadow-md shadow-indigo-200">S</div>
            <span className="text-lg font-black tracking-tighter text-slate-900">Shiftly</span>
          </div>

          <nav className="hidden items-center gap-7 md:flex">
            {["Fonctionnalités", "Comment ça marche", "Tarifs"].map((l, i) => (
              <a key={l} href={["#features", "#how", "#pricing"][i]} className="text-sm font-semibold text-slate-500 transition hover:text-slate-900">
                {l}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {!me && (
              <Link href="/login" className="text-sm font-bold text-slate-600 transition hover:text-slate-900">
                Connexion
              </Link>
            )}
            <Link
              href={me ? "/dashboard" : "/signup"}
              className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 active:scale-95"
            >
              {me ? "Dashboard" : "Essai gratuit"} <ChevronRight size={14} />
            </Link>
          </div>

          <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={18} /> : <AlignLeft size={18} />}
          </button>
        </div>

        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t border-slate-100 bg-white px-5 pb-6 pt-4 md:hidden"
          >
            <div className="flex flex-col gap-4">
              <a href="#features" className="font-semibold text-slate-700" onClick={() => setMobileOpen(false)}>Fonctionnalités</a>
              <a href="#how" className="font-semibold text-slate-700" onClick={() => setMobileOpen(false)}>Comment ça marche</a>
              <a href="#pricing" className="font-semibold text-slate-700" onClick={() => setMobileOpen(false)}>Tarifs</a>
              <div className="mt-2 flex flex-col gap-3 border-t border-slate-100 pt-4">
                {!me && <Link href="/login" className="font-bold text-slate-800" onClick={() => setMobileOpen(false)}>Connexion</Link>}
                <Link href={me ? "/dashboard" : "/signup"} className="rounded-xl bg-indigo-600 py-3 text-center font-bold text-white" onClick={() => setMobileOpen(false)}>
                  {me ? "Mon Dashboard" : "Commencer gratuitement"}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </header>

      {/* ── HERO ── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 pb-20 pt-32 sm:px-8">
        {/* bg gradient blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-indigo-500/10 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-violet-400/10 blur-[100px]" />
        </div>

        <div className="mx-auto max-w-4xl text-center">
          <motion.div initial={fadeHidden} animate={fadeShow(0)} className="mb-7 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600">
            <Star size={11} className="fill-indigo-500 text-indigo-500" /> Nouveau — Scheduling v2.0 disponible
          </motion.div>

          <motion.h1 initial={fadeHidden} animate={fadeShow(0.08)} className="mb-6 text-5xl font-black leading-[1.05] tracking-tight text-slate-900 sm:text-6xl md:text-7xl lg:text-[80px]">
            Gérez vos équipes<br />
            <span className="bg-gradient-to-r from-indigo-600 via-violet-500 to-sky-500 bg-clip-text text-transparent">
              sans friction.
            </span>
          </motion.h1>

          <motion.p initial={fadeHidden} animate={fadeShow(0.16)} className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-500 sm:text-xl">
            Shiftly centralise vos plannings, vos demandes de congés et la gestion de vos collaborateurs dans une seule plateforme moderne — pensée pour les managers qui vont vite.
          </motion.p>

          <motion.div initial={fadeHidden} animate={fadeShow(0.24)} className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="group flex items-center gap-2.5 rounded-2xl bg-indigo-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-indigo-200 transition hover:bg-indigo-700 active:scale-95"
            >
              Démarrer gratuitement
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/login" className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-8 py-4 text-base font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
              Voir la démo
            </Link>
          </motion.div>

          <motion.div initial={fadeHidden} animate={fadeShow(0.32)} className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
            {["Aucune CB requise", "Déploiement en 2 min", "RGPD Friendly"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500" /> {t}
              </span>
            ))}
          </motion.div>
        </div>

        {/* ── PRODUCT MOCKUP ── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="relative mx-auto mt-20 w-full max-w-5xl"
        >
          <div className="rounded-[28px] border border-slate-200 bg-white p-2 shadow-[0_30px_100px_-20px_rgba(79,70,229,0.25)]">
            {/* browser bar */}
            <div className="mb-2 flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-rose-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-emerald-400" />
              </div>
              <div className="mx-auto flex-1 max-w-xs rounded-md bg-white border border-slate-200 px-3 py-1 text-xs text-slate-400 text-center">
                app.shiftly.io/planning
              </div>
            </div>

            {/* fake dashboard */}
            <div className="overflow-hidden rounded-xl bg-[#F8FAFC]">
              {/* top bar */}
              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg bg-indigo-600 text-white text-xs font-black flex items-center justify-center">S</div>
                  <span className="text-sm font-bold text-slate-800">Shiftly</span>
                </div>
                <div className="hidden sm:flex items-center gap-6 text-xs font-semibold text-slate-400">
                  <span className="text-indigo-600">Planning</span>
                  <span>Demandes</span>
                  <span>Employés</span>
                  <span>Admin</span>
                </div>
                <div className="h-7 w-7 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">A</div>
              </div>

              {/* content */}
              <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
                {/* stat cards */}
                {[
                  { label: "Employés actifs", val: "24", color: "text-indigo-600", bg: "bg-indigo-50" },
                  { label: "Demandes en attente", val: "3", color: "text-amber-600", bg: "bg-amber-50" },
                  { label: "Jours planifiés", val: "180", color: "text-emerald-600", bg: "bg-emerald-50" },
                ].map((s) => (
                  <div key={s.label} className={`rounded-xl ${s.bg} px-5 py-4`}>
                    <p className="mb-1 text-xs font-semibold text-slate-500">{s.label}</p>
                    <p className={`text-3xl font-black ${s.color}`}>{s.val}</p>
                  </div>
                ))}

                {/* planning grid */}
                <div className="sm:col-span-3 rounded-xl border border-slate-200 bg-white overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                    <span className="text-sm font-bold text-slate-800">Planning — Semaine 14</span>
                    <span className="rounded-full bg-indigo-50 px-3 py-0.5 text-xs font-bold text-indigo-600">Mars 2026</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="py-2.5 pl-5 pr-4 text-left font-semibold text-slate-400">Employé</th>
                          {["Lun", "Mar", "Mer", "Jeu", "Ven"].map(d => (
                            <th key={d} className="px-3 py-2.5 text-center font-semibold text-slate-400">{d}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { name: "Alice M.", shifts: ["M", "M", "—", "S", "M"] },
                          { name: "Bob D.", shifts: ["S", "—", "S", "M", "S"], me: true },
                          { name: "Clara P.", shifts: ["M", "S", "M", "—", "M"] },
                        ].map((row) => (
                          <tr key={row.name} className={row.me ? "bg-indigo-50" : "border-t border-slate-50 hover:bg-slate-50"}>
                            <td className="py-2.5 pl-5 pr-4 font-semibold text-slate-700 whitespace-nowrap">
                              {row.name}
                              {row.me && <span className="ml-2 rounded-full bg-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-700">Vous</span>}
                            </td>
                            {row.shifts.map((s, i) => (
                              <td key={i} className="px-3 py-2.5 text-center">
                                <span className={`inline-block rounded-md px-2 py-0.5 font-bold ${s === "M" ? "bg-sky-100 text-sky-700" : s === "S" ? "bg-violet-100 text-violet-700" : "text-slate-300"}`}>
                                  {s}
                                </span>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* floating badge */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-4 top-1/3 hidden rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-xl sm:block"
          >
            <p className="text-xs font-bold text-emerald-500">↑ 40%</p>
            <p className="text-[11px] text-slate-500 font-medium">productivité</p>
          </motion.div>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -left-4 bottom-1/4 hidden rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-xl sm:block"
          >
            <p className="text-xs font-bold text-indigo-600">✓ Planning validé</p>
            <p className="text-[11px] text-slate-500 font-medium">il y a 2 min</p>
          </motion.div>
        </motion.div>
      </section>

      {/* ── LOGOS / SOCIAL PROOF ── */}
      <section className="border-y border-slate-100 bg-slate-50 py-10">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <p className="mb-8 text-center text-xs font-bold uppercase tracking-widest text-slate-400">Ils utilisent Shiftly au quotidien</p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {["Hôtel Riviera", "Clinic Pro", "RestauGroup", "LogiTeam", "SportZen"].map((name) => (
              <span key={name} className="text-sm font-black text-slate-300 tracking-tight">{name.toUpperCase()}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
        <div className="mb-16 text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mb-3 text-xs font-bold uppercase tracking-widest text-indigo-500"
          >
            Fonctionnalités
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.05 }}
            className="mb-5 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl"
          >
            Tout ce dont vous avez besoin.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="mx-auto max-w-xl text-lg text-slate-500"
          >
            Une suite d'outils pensés pour les managers modernes qui veulent reprendre le contrôle de leur temps.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="group rounded-2xl border border-slate-100 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-slate-200"
            >
              <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ${f.light}`}>
                <f.icon size={20} />
              </div>
              <h3 className="mb-2.5 text-lg font-bold text-slate-900">{f.title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="bg-slate-950 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-indigo-400">Comment ça marche</p>
            <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl">Opérationnel en 3 étapes.</h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur"
              >
                <span className="mb-6 block text-5xl font-black text-white/10">{s.n}</span>
                <h3 className="mb-3 text-xl font-bold text-white">{s.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <div className="absolute -right-4 top-1/2 hidden -translate-y-1/2 text-white/20 md:block">
                    <ChevronRight size={24} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS BAND ── */}
      <section className="border-y border-slate-100 py-16">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            {[
              { val: "10h", label: "économisées / semaine" },
              { val: "100%", label: "cloud & sécurisé" },
              { val: "< 2min", label: "pour démarrer" },
              { val: "7j/7", label: "support disponible" },
            ].map((s) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                <p className="text-4xl font-black text-indigo-600 sm:text-5xl">{s.val}</p>
                <p className="mt-1.5 text-sm font-medium text-slate-400">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 px-10 py-20 text-center shadow-2xl shadow-indigo-200 sm:px-16"
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute right-0 top-0 h-80 w-80 -translate-y-1/2 translate-x-1/2 rounded-full bg-white/10 blur-[80px]" />
            <div className="absolute bottom-0 left-0 h-80 w-80 -translate-x-1/2 translate-y-1/2 rounded-full bg-violet-400/20 blur-[80px]" />
          </div>

          <div className="relative z-10 mx-auto max-w-2xl">
            <h2 className="mb-5 text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">
              Prêt à simplifier la gestion de votre équipe ?
            </h2>
            <p className="mb-10 text-lg text-indigo-100">
              Rejoignez Shiftly dès aujourd'hui. Gratuit, sans carte bancaire, opérationnel en moins de 2 minutes.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="group flex items-center gap-2.5 rounded-2xl bg-white px-9 py-4 text-base font-bold text-indigo-600 shadow-lg transition hover:bg-indigo-50 active:scale-95"
              >
                Commencer gratuitement
                <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/login" className="rounded-2xl border border-white/25 px-9 py-4 text-base font-bold text-white transition hover:bg-white/10">
                Connexion
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-100 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
          <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
            <div className="col-span-2 md:col-span-2">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-black text-white">S</div>
                <span className="text-lg font-black tracking-tighter text-slate-900">Shiftly</span>
              </div>
              <p className="max-w-xs text-sm leading-relaxed text-slate-400">
                La plateforme de gestion d'équipe nouvelle génération. Conçue pour les entreprises qui bougent vite.
              </p>
            </div>
            <div>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">Produit</h4>
              <ul className="space-y-2.5 text-sm text-slate-500">
                <li><a href="#features" className="transition hover:text-slate-900">Fonctionnalités</a></li>
                <li><a href="#pricing" className="transition hover:text-slate-900">Tarifs</a></li>
                <li><a href="#" className="transition hover:text-slate-900">Sécurité</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">Support</h4>
              <ul className="space-y-2.5 text-sm text-slate-500">
                <li><a href="#" className="transition hover:text-slate-900">Centre d'aide</a></li>
                <li><a href="#" className="transition hover:text-slate-900">Contact</a></li>
                <li><a href="#" className="transition hover:text-slate-900">Statut</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-8 sm:flex-row">
            <p className="text-xs text-slate-400">© 2026 Shiftly. Tous droits réservés. Made in France.</p>
            <div className="flex gap-6 text-xs text-slate-400">
              <a href="#" className="transition hover:text-slate-700">Confidentialité</a>
              <a href="#" className="transition hover:text-slate-700">Conditions</a>
              <a href="#" className="transition hover:text-slate-700">RGPD</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
