"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { apiFetchClient, getToken } from "@/lib/clientApi";
import {
  ArrowRight, Calendar, Users, ClipboardCheck,
  ShieldCheck, Zap, BarChart3, CheckCircle2,
  Menu, X, Sparkles, ChevronDown
} from "lucide-react";

const anim = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] }
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } }
};


const BENTO_CARDS = [
  { size: "md:col-span-3", icon: Calendar, title: "ZÉRO CONFLIT", desc: "Intelligence de planification native." },
  { size: "md:col-span-2", icon: ClipboardCheck, title: "FLUX TEMPS RÉEL", desc: "Décisions instantanées." },
  { size: "md:col-span-2", icon: Users, title: "ÉQUIPES CONNECTÉES", desc: "Chaque collaborateur accède à son planning en temps réel." },
  { size: "md:col-span-3", icon: ShieldCheck, title: "SOUVERAINETÉ TOTALE", desc: "Chiffrement AES-256, hébergement en France." },
];

export default function Home() {
  const [me, setMe] = useState<{ email?: string; role?: string } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [onDark, setOnDark] = useState(false);
  const heroRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.6], [1, 0.85]);

  useEffect(() => {
    if (getToken()) {
      apiFetchClient<{ email?: string; role?: string }>("/auth/me")
        .then(setMe).catch(() => setMe(null));
    }

    const cta = document.getElementById("cta");
    if (!cta) return;
    const observer = new IntersectionObserver(
      ([entry]) => setOnDark(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(cta);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-[#3687ff]/20 selection:text-[#3687ff] antialiased font-sans overflow-x-hidden">

      {/* ATMOSPHERE */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-black/5 blur-[180px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-black/5 blur-[180px] rounded-full" />
      </div>

      {/* NAV */}
      <nav className="fixed top-4 inset-x-4 sm:top-6 sm:inset-x-6 z-[100] flex flex-col items-center gap-2">
        <div className={`w-full max-w-7xl h-14 rounded-full border backdrop-blur-xl px-5 sm:px-8 flex items-center justify-between shadow-lg transition-all duration-300 ${
          onDark
            ? "bg-[#101214]/90 border-white/10 shadow-black/30"
            : "bg-white/90 border-slate-200/80 shadow-slate-200/60"
        }`}>
          <span className={`text-sm font-bold tracking-tight transition-colors duration-300 ${onDark ? "text-white" : "text-slate-900"}`}>Shiftly</span>

          <div className="hidden lg:flex items-center gap-8">
            {[
              ["Opera", "#fonctionnalites"],
              ["Via", "#comment"],
              ["Praesidium", "#securite"],
              ["Incipit", "#cta"],
            ].map(([label, href]) => (
              <a key={label} href={href} className={`text-sm font-medium transition-colors duration-300 ${onDark ? "text-white/60 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}>{label}</a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className={`hidden sm:flex h-8 px-4 rounded-full border text-sm font-medium transition-all duration-300 items-center justify-center ${
              onDark
                ? "bg-white/10 border-white/20 text-white/80 hover:text-white hover:bg-white/20"
                : "bg-[#3687ff] border-[#3687ff] text-white hover:bg-[#3687ff]/90"
            }`}>
              Intra
            </Link>
            <button
              className={`lg:hidden flex h-8 w-8 items-center justify-center rounded-full border transition-colors duration-300 ${
                onDark ? "border-white/10 bg-white/5 text-white/60 hover:text-white" : "border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900"
              }`}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={15} /> : <Menu size={15} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
            className="w-full max-w-7xl rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-3xl px-5 py-5 flex flex-col gap-3 lg:hidden shadow-lg"
          >
            {[
              ["Opera", "#fonctionnalites"],
              ["Via", "#comment"],
              ["Praesidium", "#securite"],
              ["Incipit", "#cta"],
            ].map(([label, href]) => (
              <a key={label} href={href} onClick={() => setMobileOpen(false)} className="text-sm font-medium text-slate-600 hover:text-slate-900 py-1 transition-colors">{label}</a>
            ))}
            <div className="border-t border-slate-100 pt-3 mt-1">
              <Link href="/login" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Connexion</Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* HERO */}
      <section ref={heroRef} className="relative pt-36 sm:pt-48 lg:pt-64 pb-16 sm:pb-24 px-4 sm:px-6 flex flex-col items-center">
        <motion.div style={{ opacity, scale }} className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
            className="text-[clamp(3.5rem,15vw,13rem)] font-black leading-[0.75] tracking-tighter mb-12"
          >
            <span className="text-[#ff4f36]">LA FIN DU</span> <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-slate-900 via-slate-600 to-slate-300">CHAOS.</span>
          </motion.h1>

          <motion.p
            {...anim} transition={{ delay: 0.15, duration: 1.2 }}
            className="max-w-xl mx-auto text-slate-500 text-xl md:text-2xl font-medium mb-16 leading-relaxed"
          >
            Plannings sans conflits, congés en un clic, <br /> équipe notifiée en temps réel.
          </motion.p>

          <motion.div {...anim} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/signup" className="h-16 px-12 rounded-full bg-[#3687ff] text-white font-black uppercase tracking-[0.2em] text-xs hover:bg-[#3687ff]/90 transition-all hover:scale-105 hover:shadow-[0_0_60px_-10px_rgba(54,135,255,0.5)] inline-flex items-center gap-2.5">
              Démarrer gratuitement <ArrowRight size={14} />
            </Link>
            <a href="#fonctionnalites" className="h-16 px-12 rounded-full border border-slate-200 bg-white font-black uppercase tracking-[0.2em] text-xs text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2.5 shadow-sm">
              Voir comment ça marche <ChevronDown size={16} />
            </a>
          </motion.div>
        </motion.div>

        {/* DASHBOARD MOCKUP */}
        <motion.div
          initial={{ opacity: 0, y: 120 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="mt-16 sm:mt-32 lg:mt-48 w-full max-w-7xl relative"
        >
          <div className="absolute inset-x-20 top-0 h-px bg-gradient-to-r from-transparent via-[#3687ff] to-transparent" />
          <div className="rounded-2xl sm:rounded-[40px] border border-slate-200 bg-white/80 backdrop-blur-2xl p-3 sm:p-6 shadow-[0_20px_80px_-20px_rgba(0,0,0,0.08)]">
            <div className="overflow-hidden rounded-xl sm:rounded-[32px] bg-slate-50 border border-slate-100 p-4 sm:p-6 lg:p-10 flex flex-col min-h-[320px]">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-md bg-[#3687ff] flex items-center justify-center">
                    <Calendar size={11} className="text-white" />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Shiftly — Planning</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Semaine 18 · Avr 2026</span>
                  <div className="flex gap-1.5">
                    {[Users, Calendar, Zap].map((Icon, i) => (
                      <div key={i} className={`p-2 rounded-lg border ${i === 1 ? "bg-[#3687ff]/10 text-[#3687ff] border-[#3687ff]/25" : "text-slate-300 border-slate-100 bg-white"}`}>
                        <Icon size={13} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: "Employés", val: "12", color: "text-[#3687ff]" },
                  { label: "En attente", val: "2", color: "text-amber-500" },
                  { label: "Shifts semaine", val: "47", color: "text-[#4dbf9d]" },
                ].map((s) => (
                  <div key={s.label} className="bg-white border border-slate-100 rounded-xl px-4 py-3 shadow-sm">
                    <div className={`text-lg font-black ${s.color}`}>{s.val}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="flex-1 rounded-xl border border-slate-100 overflow-hidden bg-white">
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Employé</span>
                  <div className="flex gap-6">
                    {["Lun","Mar","Mer","Jeu","Ven"].map((d) => (
                      <span key={d} className="text-[9px] font-black uppercase tracking-wider text-slate-300 w-8 text-center">{d}</span>
                    ))}
                  </div>
                </div>
                {[
                  { name: "Alice M.", shifts: ["M","M","—","S","M"] },
                  { name: "Bob D.",   shifts: ["S","—","S","M","S"], me: true },
                  { name: "Clara P.", shifts: ["M","S","M","—","M"] },
                ].map((row) => (
                  <div key={row.name} className={`flex items-center justify-between px-4 py-3 border-t border-slate-100 ${row.me ? "bg-[#3687ff]/5" : ""}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-500">{row.name}</span>
                      {row.me && <span className="text-[8px] font-black uppercase tracking-widest bg-[#3687ff]/15 text-[#3687ff] px-2 py-0.5 rounded-full">Vous</span>}
                    </div>
                    <div className="flex gap-6">
                      {row.shifts.map((s, i) => (
                        <span key={i} className={`w-8 text-center text-[10px] font-black py-1 rounded-md ${s !== "—" ? "bg-[#3687ff]/10 text-[#3687ff]" : "text-slate-200"}`}>{s}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* BENTO */}
      <section id="fonctionnalites" className="py-20 sm:py-32 lg:py-40 px-4 sm:px-6 max-w-7xl mx-auto relative z-10">
        <motion.div
          variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-5 gap-5"
        >
          {BENTO_CARDS.map((card, i) => (
            <motion.div
              key={i} variants={anim} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className={`${card.size} rounded-2xl sm:rounded-[32px] border border-slate-200 bg-white p-6 sm:p-8 lg:p-10 flex flex-col justify-between group hover:border-[#3687ff]/25 hover:bg-[#3687ff]/5 transition-all duration-500 hover:-translate-y-1 relative overflow-hidden shadow-sm`}
            >
              <div className="absolute -inset-20 bg-[radial-gradient(circle_at_50%_50%,#3687ff08,transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative z-10 flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-[#3687ff] group-hover:bg-[#3687ff]/10 group-hover:border-[#3687ff]/25 transition-colors">
                  <card.icon size={22} />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 group-hover:text-slate-700 transition-colors">{card.title}</h3>
              </div>
              <p className="relative z-10 text-slate-500 font-medium leading-relaxed group-hover:text-slate-700 transition-colors">{card.desc}</p>
            </motion.div>
          ))}
          <motion.div variants={anim} className="md:col-span-5 rounded-2xl sm:rounded-[40px] bg-[#101214] text-white p-8 sm:p-12 lg:p-16 relative overflow-hidden group">
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.9] mb-6 sm:mb-8">INTERFACE FLUIDE. <br />VITESSE PURE.</h2>
              <p className="text-base sm:text-xl font-bold text-white/50">Pensez à votre action, elle est déjà exécutée. Notre design supprime la friction visuelle.</p>
            </div>
            <Sparkles className="absolute right-8 sm:right-16 top-1/2 -translate-y-1/2 text-white/5 opacity-50 group-hover:rotate-12 group-hover:opacity-100 transition-all duration-1000" size={160} />
          </motion.div>
        </motion.div>
      </section>

      {/* FEATURES */}
      <section id="securite" className="py-20 sm:py-32 lg:py-40 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-24 sm:space-y-32 lg:space-y-40">

          {/* Feature 1 — Conflits */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} viewport={{ amount: 0.4 }}
            className="flex flex-col md:flex-row gap-10 lg:gap-16 items-center relative"
          >
            <div className="flex-1 relative z-10">
              <Zap size={32} className="text-[#3687ff] mb-6" />
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter mb-4 sm:mb-6 leading-[0.9] text-slate-900">La fin des conflits.</h2>
              <p className="text-slate-500 text-lg font-medium leading-relaxed mb-10">Détection en temps réel des chevauchements de shifts. Votre planning se construit sans friction, sans erreur.</p>
              <Link href="/signup" className="inline-flex items-center gap-2 h-12 px-8 rounded-full bg-[#3687ff] text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-[#3687ff]/90 transition-all hover:shadow-[0_0_40px_-8px_rgba(54,135,255,0.5)]">
                Créer mon planning <ArrowRight size={14} />
              </Link>
            </div>
            <div className="flex-1 w-full aspect-[4/3] bg-slate-50 rounded-[40px] border border-slate-200 relative overflow-hidden p-8 flex flex-col gap-3 shadow-sm">
              <div className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 mb-2">Planning — Semaine 18</div>
              {[
                { name: "Alice M.", shifts: ["M","M","–","S","M"], conflict: false },
                { name: "Bob D.",   shifts: ["S","S","S","M","S"], conflict: true },
                { name: "Clara P.", shifts: ["M","–","M","M","–"], conflict: false },
                { name: "David K.", shifts: ["–","M","S","–","S"], conflict: false },
              ].map((row) => (
                <div key={row.name} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${row.conflict ? "border-[#ff4f36]/30 bg-[#ff4f36]/5" : "border-slate-200 bg-white"}`}>
                  <span className="text-[11px] font-bold text-slate-500 w-16 shrink-0">{row.name}</span>
                  <div className="flex gap-2 flex-1">
                    {row.shifts.map((s, i) => (
                      <span key={i} className={`flex-1 text-center text-[10px] font-black py-1 rounded-md ${s !== "–" ? (row.conflict && i === 1 ? "bg-[#ff4f36]/15 text-[#ff4f36]" : "bg-[#3687ff]/10 text-[#3687ff]") : "text-slate-200"}`}>{s}</span>
                    ))}
                  </div>
                  {row.conflict && <span className="text-[9px] font-black text-[#ff4f36] uppercase tracking-wider">⚠ Conflit</span>}
                </div>
              ))}
              <div className="mt-auto flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#ff4f36]/30 bg-[#ff4f36]/5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#ff4f36] animate-pulse" />
                <span className="text-[10px] font-black text-[#ff4f36] uppercase tracking-widest">1 conflit détecté — Bob D. Lundi + Mardi</span>
              </div>
            </div>
          </motion.div>

          {/* Feature 2 — Sécurité */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} viewport={{ amount: 0.4 }}
            className="flex flex-col md:flex-row-reverse gap-10 lg:gap-16 items-center"
          >
            <div className="flex-1">
              <ShieldCheck size={32} className="text-[#3687ff] mb-6" />
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter mb-4 sm:mb-6 leading-[0.9] text-slate-900">Souveraineté des données.</h2>
              <p className="text-slate-500 text-lg font-medium leading-relaxed mb-10">Hébergement européen, chiffrement AES-256, conformité RGPD totale. Vos données restent les vôtres, point.</p>
              <Link href="/signup" className="inline-flex items-center gap-2 h-12 px-8 rounded-full border border-slate-200 bg-white text-slate-900 text-xs font-black uppercase tracking-[0.2em] hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                Voir les garanties <ArrowRight size={14} />
              </Link>
            </div>
            <div className="flex-1 w-full aspect-[4/3] bg-slate-50 rounded-[40px] border border-slate-200 relative overflow-hidden p-8 flex flex-col justify-between shadow-sm">
              <div className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400">Rapport de sécurité</div>
              <div className="flex flex-col items-center justify-center flex-1 gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-2 border-[#3687ff]/25 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full border-2 border-[#3687ff]/35 flex items-center justify-center bg-[#3687ff]/10">
                      <ShieldCheck size={28} className="text-[#3687ff]" />
                    </div>
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#4dbf9d] border-2 border-white flex items-center justify-center">
                    <CheckCircle2 size={10} className="text-white" />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-black text-[#4dbf9d] uppercase tracking-widest mb-1">Système sécurisé</div>
                  <div className="text-[10px] text-slate-400 font-medium">AES-256 · TLS 1.3 · RGPD</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Chiffrement", val: "AES-256", color: "text-[#3687ff]" },
                  { label: "Uptime", val: "99.9%", color: "text-[#4dbf9d]" },
                  { label: "Hébergement", val: "France", color: "text-[#a399a8]" },
                ].map((s) => (
                  <div key={s.label} className="bg-white border border-slate-100 rounded-2xl px-3 py-3 text-center shadow-sm">
                    <div className={`text-sm font-black ${s.color}`}>{s.val}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Feature 3 — Analytics */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} viewport={{ amount: 0.4 }}
            className="flex flex-col md:flex-row gap-10 lg:gap-16 items-center"
          >
            <div className="flex-1">
              <BarChart3 size={32} className="text-[#3687ff] mb-6" />
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter mb-4 sm:mb-6 leading-[0.9] text-slate-900">Décisions basées sur les faits.</h2>
              <p className="text-slate-500 text-lg font-medium leading-relaxed mb-10">Flux de données Live RH transformés en KPIs actionnables. Décisions basées sur des faits, pas des intuitions.</p>
              <Link href="/signup" className="inline-flex items-center gap-2 h-12 px-8 rounded-full bg-[#3687ff] text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-[#3687ff]/90 transition-all hover:shadow-[0_0_40px_-8px_rgba(54,135,255,0.5)]">
                Voir mes analytics <ArrowRight size={14} />
              </Link>
            </div>
            <div className="flex-1 w-full aspect-[4/3] bg-slate-50 rounded-[40px] border border-slate-200 relative overflow-hidden p-8 flex flex-col gap-5 shadow-sm">
              <div className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400">Dashboard Analytics — Avril 2026</div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Taux présence", val: "94%", delta: "+2%", color: "text-[#4dbf9d]" },
                  { label: "Heures / semaine", val: "38.4h", delta: "-0.5h", color: "text-[#3687ff]" },
                  { label: "Absences", val: "3", delta: "-5", color: "text-amber-500" },
                  { label: "Satisfaction", val: "4.8/5", delta: "+0.3", color: "text-[#a399a8]" },
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-white border border-slate-100 rounded-2xl px-4 py-4 shadow-sm">
                    <div className={`text-2xl font-black ${kpi.color}`}>{kpi.val}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{kpi.label}</div>
                    <div className="text-[10px] text-[#4dbf9d] font-black mt-1">{kpi.delta} ce mois</div>
                  </div>
                ))}
              </div>
              <div className="flex-1 bg-white border border-slate-100 rounded-2xl px-5 py-4 flex flex-col justify-between shadow-sm">
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Présence hebdomadaire</div>
                <div className="flex items-end gap-2 h-16">
                  {[65, 80, 72, 90, 85, 78, 94].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full rounded-sm bg-[#3687ff]/70" style={{ height: `${h}%` }} />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2">
                  {["L","M","M","J","V","S","D"].map((d, i) => (
                    <span key={i} className="flex-1 text-center text-[9px] font-black text-slate-300">{d}</span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section id="comment" className="py-32 px-6 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#3687ff] mb-3">Comment ça marche</p>
            <h2 className="text-4xl font-bold text-slate-900 tracking-tight">Simple. Rapide. Efficace.</h2>
          </motion.div>

          <div className="flex flex-col gap-8">
            {[
              { n: "01", t: "Créez votre espace", d: "Inscription en 30 secondes. Configurez votre organisation et invitez vos collaborateurs par email." },
              { n: "02", t: "Construisez vos plannings", d: "Glissez-déposez les shifts, gérez les absences depuis un seul écran. Les conflits sont détectés automatiquement." },
              { n: "03", t: "Partagez en un clic", d: "Notifiez votre équipe instantanément. Chaque employé consulte son planning en temps réel depuis son téléphone." },
            ].map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.1 }} viewport={{ once: true }}
                className="flex items-start gap-6 p-6 rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <span className="text-xs font-bold text-[#3687ff] mt-0.5 shrink-0">{step.n}</span>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 mb-1.5">{step.t}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.d}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section id="cta" className="py-20 sm:py-32 lg:py-40 px-4 sm:px-6 text-center bg-black text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-30%,#3687ff15,transparent_60%)]" />
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} transition={{ duration: 0.9, ease: [0.19, 1, 0.22, 1] }}
          className="max-w-3xl mx-auto relative z-10"
        >
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.85] mb-6">
            Fini les tableurs.<br />
            <span className="text-[#3687ff]">Bienvenue sur Shiftly.</span>
          </h2>
          <p className="text-white/40 text-lg font-medium mb-14 max-w-xl mx-auto leading-relaxed">
            Rejoignez les managers qui ont repris le contrôle de leur temps. Gratuit pour commencer, sans engagement.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <Link href="/signup" className="h-14 px-10 rounded-full bg-[#3687ff] text-white font-black uppercase tracking-[0.2em] text-xs hover:bg-[#3687ff]/90 transition-all hover:scale-105 hover:shadow-[0_0_50px_-10px_rgba(54,135,255,0.7)] inline-flex items-center gap-3">
              Commencer gratuitement <ArrowRight size={14} />
            </Link>
            <Link href="/login" className="h-14 px-10 rounded-full border-2 border-white/10 text-white font-black uppercase tracking-[0.2em] text-xs hover:bg-white/5 transition-all inline-flex items-center">
              J&apos;ai déjà un compte
            </Link>
          </div>
          <p className="mt-8 text-white/25 font-medium text-xs">Aucune CB requise · Setup en 2 min · RGPD</p>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-100 py-14 px-6 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-12">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-[#3687ff] flex items-center justify-center">
                <Calendar size={14} className="text-white" />
              </div>
              <span className="font-black tracking-tight text-slate-900 text-sm">SHIFTLY</span>
            </div>
            <p className="text-slate-400 text-sm font-medium max-w-[180px] leading-relaxed mb-4">
              Le planning de vos équipes, simplement.
            </p>
            <p className="text-slate-300 text-xs">
              Fait par{" "}
              <a href="https://www.sayehahmed.com" target="_blank" rel="noopener noreferrer" className="text-[#3687ff] hover:text-[#3687ff]/80 transition-colors font-semibold">
                Sayeh Ahmed
              </a>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-12 sm:grid-cols-3">
            {[
              { title: "Produit", links: [["Fonctionnalités", "#fonctionnalites"], ["Comment ça marche", "#comment"], ["Sécurité", "#securite"]] },
              { title: "Compte", links: [["Connexion", "/login"], ["Inscription", "/signup"], ["Support", "/support"]] },
              { title: "Légal", links: [["Confidentialité", "/confidentialite"], ["CGU", "/cgu"], ["RGPD", "/rgpd"]] },
            ].map((col) => (
              <div key={col.title}>
                <p className="mb-4 text-[9px] font-black uppercase tracking-[0.4em] text-slate-400">{col.title}</p>
                <ul className="space-y-3">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <a href={href} className="text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors">{label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 text-[10px] font-medium text-slate-300">
          <p>© 2026 Shiftly. Tous droits réservés. Made in France.</p>
          <p>v2.0</p>
        </div>
      </footer>
    </div>
  );
}
