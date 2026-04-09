"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { apiFetchClient, getToken } from "@/lib/clientApi";
import {
  ArrowRight, Calendar, Users, ClipboardCheck,
  ShieldCheck, Zap, BarChart3, CheckCircle2,
  Star, X, Sparkles, Menu
} from "lucide-react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
});

const FEATURES = [
  { icon: Calendar, color: "text-blue-400", bg: "bg-blue-500/10", title: "Shifts sans conflits", desc: "Glissez-déposez les shifts, les chevauchements se détectent tout seuls. Vos plannings sont prêts en minutes, pas en heures." },
  { icon: ClipboardCheck, color: "text-cyan-400", bg: "bg-cyan-500/10", title: "Congés en 10 secondes", desc: "Un employé pose une demande, vous recevez une alerte. Validez ou refusez d'un tap — l'historique se met à jour seul." },
  { icon: Users, color: "text-indigo-400", bg: "bg-indigo-500/10", title: "Onboarding en 2 minutes", desc: "Envoyez un lien d'invitation. Votre collaborateur rejoint l'équipe et voit son planning immédiatement. Zéro formation." },
  { icon: ShieldCheck, color: "text-emerald-400", bg: "bg-emerald-500/10", title: "Vos données restent les vôtres", desc: "Hébergement européen, chiffrement AES-256, conformité RGPD totale. Vous gardez le contrôle, on assure la protection." },
  { icon: Zap, color: "text-amber-400", bg: "bg-amber-500/10", title: "Conçu pour le terrain", desc: "Utilisable d'une main dans un couloir. L'interface s'adapte à votre téléphone, votre tablette et votre bureau." },
  { icon: BarChart3, color: "text-rose-400", bg: "bg-rose-500/10", title: "Décisions basées sur des faits", desc: "Taux de présence, heures effectuées, pics d'activité. Vos données RH en un coup d'œil, sans ouvrir un tableur." },
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
    <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/50 overflow-x-hidden">

      {/* ── AMBIANCE GLOWS ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-indigo-600/10 blur-[120px] rounded-full" />
      </div>

      {/* ── NAV ── */}
      <header className="fixed inset-x-0 top-0 z-[100] border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2 group cursor-pointer">
            <span className="text-xl font-black tracking-tighter">SHIFTLY</span>
          </div>

          <nav className="hidden md:flex items-center gap-10">
            {[["Fonctionnalités", "#features"], ["Comment ça marche", "#how"], ["Tarifs", "#pricing"]].map(([l, h]) => (
              <a key={l} href={h} className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 transition hover:text-blue-400">
                {l}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {!me && (
              <Link href="/login" className="hidden sm:block text-sm font-bold text-slate-400 hover:text-white transition">Connexion</Link>
            )}
            <Link
              href={me ? "/dashboard" : "/signup"}
              className="relative inline-flex h-10 items-center justify-center rounded-full bg-white px-6 text-sm font-bold text-black transition-all hover:scale-105 active:scale-95"
            >
              {me ? "Dashboard" : "Commencer"}
            </Link>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t border-white/5 bg-black/80 backdrop-blur-md px-6 pb-6 pt-4 md:hidden"
          >
            <div className="flex flex-col gap-4">
              <a href="#features" className="text-sm font-bold text-slate-300 hover:text-white" onClick={() => setMobileOpen(false)}>Fonctionnalités</a>
              <a href="#how" className="text-sm font-bold text-slate-300 hover:text-white" onClick={() => setMobileOpen(false)}>Comment ça marche</a>
              <a href="#pricing" className="text-sm font-bold text-slate-300 hover:text-white" onClick={() => setMobileOpen(false)}>Tarifs</a>
              <div className="flex flex-col gap-3 border-t border-white/5 pt-4">
                {!me && <Link href="/login" className="text-sm font-bold text-slate-400" onClick={() => setMobileOpen(false)}>Connexion</Link>}
                <Link href={me ? "/dashboard" : "/signup"} className="rounded-xl bg-white py-3 text-center text-sm font-black text-black" onClick={() => setMobileOpen(false)}>
                  {me ? "Mon Dashboard" : "Commencer gratuitement"}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </header>

      {/* ── HERO ── */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-48 pb-32">
        <motion.div {...fadeUp(0)} className="mb-6 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
          <Sparkles size={12} className="text-blue-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200">Gestion d&apos;équipe simplifiée</span>
        </motion.div>

        <motion.h1
          {...fadeUp(0.1)}
          className="max-w-5xl text-center text-6xl font-black leading-[0.9] tracking-tighter sm:text-8xl md:text-9xl"
        >
          MAÎTRISEZ <br />
          <span className="bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">L&apos;INSTANT.</span>
        </motion.h1>

        <motion.p
          {...fadeUp(0.2)}
          className="mt-10 max-w-2xl text-center text-lg leading-relaxed text-slate-400 sm:text-xl"
        >
          Plannings construits en minutes. Absences gérées en un clic. Équipe notifiée instantanément. Shiftly remplace vos fichiers Excel — pour toujours.
        </motion.p>

        <motion.div {...fadeUp(0.3)} className="mt-12 flex flex-col items-center gap-6 sm:flex-row">
          <Link href="/signup" className="group relative flex h-14 items-center justify-center overflow-hidden rounded-2xl bg-blue-600 px-10 font-black text-white transition-all hover:bg-blue-500 hover:shadow-[0_0_40px_rgba(37,99,235,0.4)]">
            <span className="relative z-10 flex items-center gap-2">DÉMARRER MAINTENANT <ArrowRight size={20} /></span>
            <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-[100%]" />
          </Link>
          <Link href="/login" className="text-sm font-bold uppercase tracking-widest text-slate-400 hover:text-white transition underline decoration-blue-500 underline-offset-8">
            Voir la démo
          </Link>
        </motion.div>

        {/* Trust badges */}
        <motion.div {...fadeUp(0.4)} className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
          {["Aucune CB requise", "Déploiement en 2 min", "RGPD Friendly"].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-500" /> {t}
            </span>
          ))}
        </motion.div>

        {/* ── PRODUCT MOCKUP ── */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto mt-24 w-full max-w-5xl"
        >
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-2 shadow-[0_30px_100px_-20px_rgba(0,0,0,0.8)] backdrop-blur-sm">
            {/* browser bar */}
            <div className="mb-2 flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-rose-500/60" />
                <div className="h-3 w-3 rounded-full bg-amber-500/60" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/60" />
              </div>
              <div className="mx-auto flex-1 max-w-xs rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-500 text-center">
                app.shiftly.io/planning
              </div>
            </div>
            {/* fake dashboard */}
            <div className="overflow-hidden rounded-xl bg-[#0A0A0A]">
              <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-white">Shiftly</span>
                </div>
                <div className="hidden sm:flex items-center gap-6 text-xs font-semibold text-slate-500">
                  <span className="text-blue-400">Planning</span>
                  <span>Demandes</span>
                  <span>Employés</span>
                  <span>Admin</span>
                </div>
                <div className="h-7 w-7 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center">A</div>
              </div>
              <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
                {[
                  { label: "Employés actifs", val: "24", color: "text-blue-400", bg: "bg-blue-500/10" },
                  { label: "Demandes en attente", val: "3", color: "text-amber-400", bg: "bg-amber-500/10" },
                  { label: "Jours planifiés", val: "180", color: "text-emerald-400", bg: "bg-emerald-500/10" },
                ].map((s) => (
                  <div key={s.label} className={`rounded-xl ${s.bg} px-5 py-4 border border-white/5`}>
                    <p className="mb-1 text-xs font-semibold text-slate-500">{s.label}</p>
                    <p className={`text-3xl font-bold ${s.color}`}>{s.val}</p>
                  </div>
                ))}
                <div className="sm:col-span-3 rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
                    <span className="text-sm font-bold text-white">Planning — Semaine 14</span>
                    <span className="rounded-full bg-blue-500/10 px-3 py-0.5 text-xs font-bold text-blue-400">Mars 2026</span>
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="py-2.5 pl-5 pr-4 text-left font-semibold text-slate-600">Employé</th>
                        {["Lun", "Mar", "Mer", "Jeu", "Ven"].map(d => (
                          <th key={d} className="px-3 py-2.5 text-center font-semibold text-slate-600">{d}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: "Alice M.", shifts: ["M", "M", "—", "S", "M"] },
                        { name: "Bob D.", shifts: ["S", "—", "S", "M", "S"], me: true },
                        { name: "Clara P.", shifts: ["M", "S", "M", "—", "M"] },
                      ].map((row) => (
                        <tr key={row.name} className={row.me ? "bg-blue-500/10" : "border-t border-white/5"}>
                          <td className="py-2.5 pl-5 pr-4 font-semibold text-slate-300 whitespace-nowrap">
                            {row.name}
                            {row.me && <span className="ml-2 rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400">Vous</span>}
                          </td>
                          {row.shifts.map((s, i) => (
                            <td key={i} className="px-3 py-2.5 text-center">
                              <span className={`inline-block rounded-md px-2 py-0.5 font-bold ${s !== "—" ? "bg-blue-500/20 text-blue-400" : "text-slate-700"}`}>{s}</span>
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
          {/* floating badges */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-4 top-1/3 hidden rounded-2xl border border-white/10 bg-[#0A0A0A] px-4 py-3 shadow-xl sm:block"
          >
            <p className="text-xs font-bold text-emerald-400">↑ 40%</p>
            <p className="text-[11px] text-slate-500 font-medium">productivité</p>
          </motion.div>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -left-4 bottom-1/4 hidden rounded-2xl border border-white/10 bg-[#0A0A0A] px-4 py-3 shadow-xl sm:block"
          >
            <p className="text-xs font-bold text-blue-400">✓ Planning validé</p>
            <p className="text-[11px] text-slate-500 font-medium">il y a 2 min</p>
          </motion.div>
        </motion.div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="border-y border-white/5 bg-white/[0.01] py-10">
        <div className="mx-auto max-w-5xl px-6">
          <p className="mb-8 text-center text-[10px] font-black uppercase tracking-widest text-slate-600">Des équipes qui travaillent mieux</p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {["Hôtel Riviera", "Clinic Pro", "RestauGroup", "LogiTeam", "SportZen"].map((name) => (
              <span key={name} className="text-sm font-black tracking-tight text-white/10">{name.toUpperCase()}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENTO GRID FEATURES ── */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-16 text-center">
          <motion.p {...fadeUp(0)} className="mb-3 text-[10px] font-black uppercase tracking-widest text-blue-500">Fonctionnalités</motion.p>
          <motion.h2 {...fadeUp(0.05)} className="text-5xl font-black tracking-tighter sm:text-6xl">UN SEUL OUTIL.<br />TOUT LE CONTRÔLE.</motion.h2>
          <motion.p {...fadeUp(0.1)} className="mx-auto mt-6 max-w-xl text-slate-500">Fini les fichiers partagés, les messages WhatsApp et les doublons. Tout au même endroit, accessible depuis n&apos;importe où.</motion.p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6 md:grid-rows-2 mb-8">
          <motion.div
            {...fadeUp(0.1)}
            className="group relative col-span-1 flex flex-col justify-end overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/[0.02] p-8 md:col-span-3 md:row-span-2 min-h-[400px]"
          >
            <div className="absolute top-0 right-0 p-8">
              <Calendar size={120} className="text-blue-500/10 group-hover:text-blue-500/20 transition-colors" />
            </div>
            <h3 className="text-3xl font-bold tracking-tighter">Planning Visuel</h3>
            <p className="mt-4 max-w-xs text-slate-400">Visualisez 4 semaines d&apos;un seul coup d&apos;œil. Détectez les conflits avant qu&apos;ils arrivent. Exportez en Excel en un clic.</p>
            <div className="mt-8 flex gap-2">
              <div className="h-1 flex-1 rounded-full bg-blue-600" />
              <div className="h-1 flex-1 rounded-full bg-white/10" />
              <div className="h-1 flex-1 rounded-full bg-white/10" />
            </div>
          </motion.div>
          <motion.div {...fadeUp(0.2)} className="col-span-1 rounded-[2.5rem] border border-white/5 bg-[#0A0A0A] p-8 md:col-span-3">
            <ShieldCheck className="mb-4 text-emerald-400" size={32} />
            <h3 className="text-xl font-bold tracking-tight">Confiance totale</h3>
            <p className="mt-2 text-sm text-slate-500">Hébergement européen, chiffrement de bout en bout. Vos données n&apos;appartiennent qu&apos;à vous.</p>
          </motion.div>
          <motion.div {...fadeUp(0.3)} className="col-span-1 rounded-[2.5rem] border border-white/5 bg-white/[0.02] p-8 md:col-span-1">
            <Users className="text-blue-400" size={24} />
            <div className="mt-12 text-4xl font-black">24+</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Membres / Équipe</div>
          </motion.div>
          <motion.div {...fadeUp(0.4)} className="col-span-1 flex items-center justify-between rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-indigo-600/20 to-transparent p-8 md:col-span-2">
            <div>
              <BarChart3 className="mb-2 text-indigo-400" size={24} />
              <h3 className="font-bold">Analyses Live</h3>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-400">+40%</span>
              <p className="text-[10px] text-slate-500 uppercase">Efficacité</p>
            </div>
          </motion.div>
        </div>

        {/* 6 feature cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              {...fadeUp(i * 0.07)}
              className="group rounded-2xl border border-white/5 bg-white/[0.02] p-7 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04]"
            >
              <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ${f.bg}`}>
                <f.icon size={20} className={f.color} />
              </div>
              <h3 className="mb-2.5 text-base font-bold text-white">{f.title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="py-32 px-6 border-t border-white/5 bg-[#030303]">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <motion.h2 {...fadeUp(0)} className="text-5xl font-black tracking-tighter sm:text-7xl">3 ÉTAPES.<br />C&apos;EST TOUT.</motion.h2>
            <motion.p {...fadeUp(0.1)} className="max-w-xs text-slate-500 text-sm italic">&quot;La meilleure interface est celle qu&apos;on n&apos;a pas besoin d&apos;expliquer.&quot;</motion.p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {[
              { t: "CRÉEZ", d: "Ouvrez votre espace en 30 secondes. Générez votre code d'équipe, invitez par email — vos collaborateurs sont opérationnels avant la fin de la journée." },
              { t: "PLANIFIEZ", d: "Construisez vos plannings par glisser-déposer. Gérez les congés, les remplacements et les absences depuis un seul écran." },
              { t: "PARTAGEZ", d: "Un clic pour notifier toute votre équipe. Chacun consulte son planning en temps réel sur son téléphone, sans compte supplémentaire." }
            ].map((step, i) => (
              <motion.div key={step.t} {...fadeUp(i * 0.1)} className="group cursor-default">
                <div className="text-xs font-black text-blue-600 mb-4 italic">0{i + 1} —</div>
                <h4 className="text-2xl font-bold mb-4 group-hover:text-blue-400 transition-colors">{step.t}</h4>
                <p className="text-slate-500 leading-relaxed">{step.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS BAND ── */}
      <section className="border-y border-white/5 py-16 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            {[
              { val: "10h", label: "économisées / semaine" },
              { val: "0€", label: "pour commencer" },
              { val: "< 2min", label: "pour démarrer" },
              { val: "100%", label: "données en Europe" },
            ].map((s) => (
              <motion.div key={s.label} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
                <p className="text-4xl font-black text-blue-400 sm:text-5xl">{s.val}</p>
                <p className="mt-1.5 text-sm font-medium text-slate-600">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ATELIER BANNER ── */}
      <section className="py-16 px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] border border-white/5 bg-[#0A0A0A] relative min-h-[480px] flex"
        >
          {/* Background image */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-25"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1497366216548-37526070297c?w=1400&q=80')" }}
          />
          {/* Gradient overlay gauche→droite */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent" />
          {/* Gradient overlay haut→bas subtil */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/60 via-transparent to-transparent" />

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center p-10 md:p-16 max-w-2xl">
            <h2 className="text-4xl font-black leading-[1.05] tracking-tighter sm:text-5xl md:text-6xl">
              AMÉLIOREZ VOTRE<br />
              <span className="bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">
                QUALITÉ DE TRAVAIL
              </span>
            </h2>

            <p className="mt-6 max-w-md text-base leading-relaxed text-slate-400">
              Chaque shift au bon endroit. Chaque employé au bon moment. Shiftly transforme la complexité de vos plannings en quelques clics — sans formation, sans migration, sans friction.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/signup"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-8 text-sm font-black text-black transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] active:scale-95"
              >
                Essayer gratuitement <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#how"
                className="text-sm font-bold text-slate-400 underline decoration-blue-500 underline-offset-8 hover:text-white transition"
              >
                Comment ça marche
              </a>
            </div>
          </div>

          {/* Image visible côté droit sur grand écran */}
          <div className="hidden md:block absolute right-0 top-0 bottom-0 w-[45%]">
            <div
              className="h-full w-full bg-cover bg-center"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1497366216548-37526070297c?w=1400&q=80')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] to-transparent" />
          </div>
        </motion.div>
      </section>

      {/* ── CTA ── */}
      <section id="pricing" className="py-32 px-6">
        <div className="mx-auto max-w-7xl bg-white rounded-[3rem] p-12 md:p-24 text-black flex flex-col md:flex-row items-center justify-between gap-12 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="max-w-xl relative">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">FINI LES<br />TABLEURS.</h2>
            <p className="mt-8 text-xl font-medium opacity-60">Rejoignez les managers qui ont repris le contrôle de leur temps. Gratuit pour commencer, payant quand ça vous convient.</p>
            <div className="mt-8 flex flex-wrap gap-4 text-sm font-semibold text-black/50">
              {["Annulation à tout moment", "Migration assistée", "Support réactif"].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-500" /> {t}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4 w-full md:w-auto relative">
            <Link href="/signup" className="h-20 px-12 bg-black text-white rounded-2xl flex items-center justify-center font-black text-lg hover:scale-[1.02] transition-transform gap-2">
              COMMENCER GRATUITEMENT <ArrowRight size={20} />
            </Link>
            <Link href="/login" className="h-14 px-12 border-2 border-black/10 rounded-2xl flex items-center justify-center font-bold text-sm text-black/60 hover:border-black/20 transition">
              J&apos;ai déjà un compte
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-20 px-6 border-t border-white/5">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-start gap-12">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className="font-black tracking-tighter">SHIFTLY</span>
            </div>
            <p className="text-slate-500 text-sm max-w-[240px] leading-relaxed">Le planning de vos équipes, simplement.</p>
            <p className="mt-4 text-xs text-slate-600">
              Fait par{" "}
              <a href="https://www.sayehahmed.com" target="_blank" rel="noopener noreferrer" className="font-bold text-blue-500 hover:text-blue-400 transition">
                Sayeh Ahmed
              </a>
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-16">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white mb-6">Produit</p>
              <ul className="space-y-4 text-sm text-slate-500 font-bold">
                <li><a href="#features" className="hover:text-white transition">Fonctionnalités</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Tarifs</a></li>
                <li><a href="#" className="hover:text-white transition">Sécurité</a></li>
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white mb-6">Ressources</p>
              <ul className="space-y-4 text-sm text-slate-500 font-bold">
                <li><a href="#" className="hover:text-white transition">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition">Support</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white mb-6">Légal</p>
              <ul className="space-y-4 text-sm text-slate-500 font-bold">
                <li><a href="#" className="hover:text-white transition">Confidentialité</a></li>
                <li><a href="#" className="hover:text-white transition">Conditions</a></li>
                <li><a href="#" className="hover:text-white transition">RGPD</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-7xl mt-24 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between text-[10px] font-black uppercase tracking-widest text-slate-600 gap-4">
          <p>© 2026 Shiftly. Tous droits réservés. Made in France.</p>
          <div className="flex items-center gap-2 text-slate-600">
            <Star size={10} className="fill-blue-500 text-blue-500" />
            <span>v2.0 — Next Gen Scheduling</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
