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

// --- Variantes d'animation Stealth ---
const anim = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] }
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } }
};

// --- Données Épurées ---
const BENTO_CARDS = [
  { size: "md:col-span-3", icon: Calendar, title: "ZÉRO CONFLIT", desc: "Intelligence de planification native." },
  { size: "md:col-span-2", icon: ClipboardCheck, title: "FLUX TEMPS RÉEL", desc: "Décisions instantanées." },
  { size: "md:col-span-2", icon: Users, title: "ÉQUIPES CONNECTÉES", desc: "Chaque collaborateur accède à son planning en temps réel." },
  { size: "md:col-span-3", icon: ShieldCheck, title: "SOUVERAINETÉ TOTALE", desc: "Chiffrement AES-256, hébergement en France." },
];

export default function Home() {
  const [me, setMe] = useState<{ email?: string; role?: string } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [onWhite, setOnWhite] = useState(false);
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
      ([entry]) => setOnWhite(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(cta);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#000] text-white selection:bg-blue-500/20 selection:text-blue-300 antialiased font-sans overflow-x-hidden">
      
      {/* ── ATMOSPHERE (STAY STEALTH) ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay" />
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-900/10 blur-[160px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/10 blur-[160px] rounded-full animate-pulse delay-1000" />
      </div>

      {/* ── NAV ── */}
      <nav className="fixed top-4 inset-x-4 sm:top-6 sm:inset-x-6 z-[100] flex flex-col items-center gap-2">
        <div className={`w-full max-w-7xl h-14 rounded-full border backdrop-blur-xl px-5 sm:px-8 flex items-center justify-between shadow-2xl transition-all duration-300 ${
          onWhite
            ? "bg-black/90 border-white/10 shadow-black/50"
            : "bg-white/95 border-black/10 shadow-black/10"
        }`}>
          <span className={`text-sm font-bold tracking-tight transition-colors duration-300 ${onWhite ? "text-white" : "text-slate-900"}`}>Shiftly</span>

          <div className="hidden lg:flex items-center gap-8">
            {[
              ["Opera", "#fonctionnalites"],
              ["Via", "#comment"],
              ["Praesidium", "#securite"],
              ["Incipit", "#cta"],
            ].map(([label, href]) => (
              <a key={label} href={href} className={`text-sm font-medium transition-colors duration-300 ${onWhite ? "text-white/50 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}>{label}</a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className={`hidden sm:flex h-8 px-4 rounded-full border text-sm font-medium transition-all duration-300 items-center justify-center ${
              onWhite
                ? "bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10"
                : "bg-slate-900 border-slate-900 text-white hover:bg-slate-700"
            }`}>
              Intra
            </Link>
            <button className={`lg:hidden flex h-8 w-8 items-center justify-center rounded-full border transition-colors duration-300 ${
              onWhite ? "border-white/10 bg-white/5 text-white/60 hover:text-white" : "border-black/10 bg-black/5 text-slate-600 hover:text-slate-900"
            }`} onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={15} /> : <Menu size={15} />}
            </button>
          </div>
        </div>

        {/* Menu mobile déroulant */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
            className="w-full max-w-7xl rounded-2xl border border-white/5 bg-black/80 backdrop-blur-3xl px-5 py-5 flex flex-col gap-3 lg:hidden"
          >
            {[
              ["Opera", "#fonctionnalites"],
              ["Via", "#comment"],
              ["Praesidium", "#securite"],
              ["Incipit", "#cta"],
            ].map(([label, href]) => (
              <a key={label} href={href} onClick={() => setMobileOpen(false)} className="text-sm font-medium text-white/60 hover:text-white py-1 transition-colors">{label}</a>
            ))}
            <div className="border-t border-white/5 pt-3 mt-1">
              <Link href="/login" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-white/60 hover:text-white transition-colors">Connexion</Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* ── HERO MONUMENTAL ── */}
      <section ref={heroRef} className="relative pt-36 sm:pt-48 lg:pt-64 pb-16 sm:pb-24 px-4 sm:px-6 flex flex-col items-center">
        <motion.div style={{ opacity, scale }} className="text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
            className="text-[clamp(3.5rem,15vw,13rem)] font-black leading-[0.75] tracking-tighter mb-12"
          >
            LA FIN DU <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white/80 to-white/10">CHAOS.</span>
          </motion.h1>

          <motion.p 
            {...anim} transition={{ delay: 0.15, duration: 1.2 }}
            className="max-w-xl mx-auto text-slate-500 text-xl md:text-2xl font-medium mb-16 leading-relaxed"
          >
            Plannings sans conflits, congés en un clic, <br /> équipe notifiée en temps réel.
          </motion.p>

          <motion.div {...anim} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/signup" className="h-16 px-12 rounded-full bg-blue-600 text-white font-black uppercase tracking-[0.2em] text-xs hover:bg-blue-500 transition-all hover:scale-105 hover:shadow-[0_0_60px_-10px_rgba(37,99,235,0.7)] inline-flex items-center gap-2.5">
              Démarrer gratuitement <ArrowRight size={14} />
            </Link>
            <a href="#features" className="h-16 px-12 rounded-full border border-white/10 bg-white/5 font-black uppercase tracking-[0.2em] text-xs hover:bg-white/10 transition-all flex items-center gap-2.5">
              Voir comment ça marche <ChevronDown size={16} />
            </a>
          </motion.div>
        </motion.div>

        {/* ── PROTOCOLES MOCKUP ── */}
        <motion.div 
          initial={{ opacity: 0, y: 120 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="mt-16 sm:mt-32 lg:mt-48 w-full max-w-7xl relative"
        >
          <div className="absolute inset-x-20 top-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent blur-sm" />
          <div className="rounded-2xl sm:rounded-[40px] border border-white/5 bg-[#010101]/60 backdrop-blur-2xl p-3 sm:p-6 shadow-[0_0_150px_-30px_rgba(37,99,235,0.15)]">
            <div className="overflow-hidden rounded-xl sm:rounded-[32px] bg-black/80 border border-white/5 p-4 sm:p-6 lg:p-10 flex flex-col min-h-[320px]">
              {/* Header du dashboard */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center">
                    <Calendar size={11} className="text-white" />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/60">Shiftly — Planning</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Semaine 18 · Avr 2026</span>
                  <div className="flex gap-1.5">
                    {[Users, Calendar, Zap].map((Icon, i) => (
                      <div key={i} className={`p-2 rounded-lg border border-white/5 ${i === 1 ? "bg-blue-600/10 text-blue-400 border-blue-500/20" : "text-white/20"}`}>
                        <Icon size={13} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: "Employés", val: "12", color: "text-blue-400" },
                  { label: "En attente", val: "2", color: "text-amber-400" },
                  { label: "Shifts semaine", val: "47", color: "text-emerald-400" },
                ].map((s) => (
                  <div key={s.label} className="bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3">
                    <div className={`text-lg font-black ${s.color}`}>{s.val}</div>
                    <div className="text-[9px] font-bold text-white/20 uppercase tracking-wider">{s.label}</div>
                  </div>
                ))}
              </div>
              {/* Planning table */}
              <div className="flex-1 rounded-xl border border-white/5 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.03] border-b border-white/5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Employé</span>
                  <div className="flex gap-6">
                    {["Lun","Mar","Mer","Jeu","Ven"].map((d) => (
                      <span key={d} className="text-[9px] font-black uppercase tracking-wider text-white/20 w-8 text-center">{d}</span>
                    ))}
                  </div>
                </div>
                {[
                  { name: "Alice M.", shifts: ["M","M","—","S","M"] },
                  { name: "Bob D.",   shifts: ["S","—","S","M","S"], me: true },
                  { name: "Clara P.", shifts: ["M","S","M","—","M"] },
                ].map((row) => (
                  <div key={row.name} className={`flex items-center justify-between px-4 py-3 border-t border-white/5 ${row.me ? "bg-blue-600/5" : ""}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-white/50">{row.name}</span>
                      {row.me && <span className="text-[8px] font-black uppercase tracking-widest bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full">Vous</span>}
                    </div>
                    <div className="flex gap-6">
                      {row.shifts.map((s, i) => (
                        <span key={i} className={`w-8 text-center text-[10px] font-black py-1 rounded-md ${s !== "—" ? "bg-blue-500/10 text-blue-400" : "text-white/10"}`}>{s}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── BENTO 3.0 (ASYMÉTRIE FLOTTANTE) ── */}
      <section id="fonctionnalites" className="py-20 sm:py-32 lg:py-40 px-4 sm:px-6 max-w-7xl mx-auto relative z-10">
        <motion.div 
          variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-5 gap-5"
        >
          {BENTO_CARDS.map((card, i) => (
            <motion.div 
              key={i} variants={anim} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className={`${card.size} rounded-2xl sm:rounded-[32px] border border-white/5 bg-white/[0.02] p-6 sm:p-8 lg:p-10 flex flex-col justify-between group hover:border-blue-500/20 hover:bg-white/[0.04] transition-all duration-500 hover:-translate-y-1 relative overflow-hidden`}
            >
              <div className="absolute -inset-20 bg-[radial-gradient(circle_at_50%_50%,#3b82f608,transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative z-10 flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-center text-white/30 group-hover:text-blue-400 group-hover:bg-blue-900/10 transition-colors">
                    <card.icon size={22} />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 group-hover:text-white transition-colors">{card.title}</h3>
              </div>
              <p className="relative z-10 text-slate-500 font-medium leading-relaxed group-hover:text-slate-300 transition-colors">{card.desc}</p>
            </motion.div>
          ))}
          {/* Big central bento */}
          <motion.div variants={anim} className="md:col-span-5 rounded-2xl sm:rounded-[40px] bg-white text-black p-8 sm:p-12 lg:p-16 relative overflow-hidden group">
            <div className="relative z-10 max-w-2xl">
                <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.9] mb-6 sm:mb-8">INTERFACE FLUIDE. <br />VITESSE PURE.</h2>
                <p className="text-base sm:text-xl font-bold opacity-60">Pensez à votre action, elle est déjà exécutée. Notre design Stealth supprime la friction visuelle.</p>
            </div>
            <Sparkles className="absolute right-8 sm:right-16 top-1/2 -translate-y-1/2 text-black/5 opacity-50 group-hover:rotate-12 group-hover:opacity-100 transition-all duration-1000" size={160} />
          </motion.div>
        </motion.div>
      </section>

      {/* ── CIPHER PROTOCOLS (STEALTH VISUALS) ── */}
      <section id="securite" className="py-20 sm:py-32 lg:py-40 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-24 sm:space-y-32 lg:space-y-40">

          {/* Feature 1 — Conflits */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} viewport={{ amount: 0.4 }}
            className="flex flex-col md:flex-row gap-10 lg:gap-16 items-center"
          >
            <div className="flex-1 relative group">
              <Zap size={32} className="text-blue-500 mb-6" />
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter mb-4 sm:mb-6 leading-[0.9]">La fin des conflits.</h2>
              <p className="text-slate-500 text-lg font-medium leading-relaxed mb-10">Détection en temps réel des chevauchements de shifts. Votre planning se construit sans friction, sans erreur.</p>
              <Link href="/signup" className="inline-flex items-center gap-2 h-12 px-8 rounded-full bg-blue-600 text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-blue-500 transition-all hover:shadow-[0_0_40px_-8px_rgba(37,99,235,0.8)]">
                Créer mon planning <ArrowRight size={14} />
              </Link>
            </div>
            <div className="flex-1 w-full aspect-[4/3] bg-[#0A0A0A] rounded-[40px] border border-white/5 relative overflow-hidden p-8 flex flex-col gap-3">
              <div className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 mb-2">Planning — Semaine 18</div>
              {[
                { name: "Alice M.", shifts: ["M","M","–","S","M"], ok: true },
                { name: "Bob D.", shifts: ["S","S","S","M","S"], conflict: true },
                { name: "Clara P.", shifts: ["M","–","M","M","–"], ok: true },
                { name: "David K.", shifts: ["–","M","S","–","S"], ok: true },
              ].map((row) => (
                <div key={row.name} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${row.conflict ? "border-red-500/30 bg-red-500/5" : "border-white/5 bg-white/[0.02]"}`}>
                  <span className="text-[11px] font-bold text-white/50 w-16 shrink-0">{row.name}</span>
                  <div className="flex gap-2 flex-1">
                    {row.shifts.map((s, i) => (
                      <span key={i} className={`flex-1 text-center text-[10px] font-black py-1 rounded-md ${s !== "–" ? (row.conflict && i === 1 ? "bg-red-500/20 text-red-400" : "bg-blue-500/10 text-blue-400") : "text-white/10"}`}>{s}</span>
                    ))}
                  </div>
                  {row.conflict && <span className="text-[9px] font-black text-red-400 uppercase tracking-wider">⚠ Conflit</span>}
                </div>
              ))}
              <div className="mt-auto flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/20 bg-red-500/5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">1 conflit détecté — Bob D. Lundi + Mardi</span>
              </div>
            </div>
          </motion.div>

          {/* Feature 2 — Souveraineté */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} viewport={{ amount: 0.4 }}
            className="flex flex-col md:flex-row-reverse gap-10 lg:gap-16 items-center"
          >
            <div className="flex-1 relative group">
              <ShieldCheck size={32} className="text-blue-500 mb-6" />
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter mb-4 sm:mb-6 leading-[0.9]">Souveraineté des données.</h2>
              <p className="text-slate-500 text-lg font-medium leading-relaxed mb-10">Hébergement européen, chiffrement AES-256, conformité RGPD totale. Vos données restent les vôtres, point.</p>
              <Link href="/signup" className="inline-flex items-center gap-2 h-12 px-8 rounded-full border border-white/10 bg-white/5 text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all">
                Voir les garanties <ArrowRight size={14} />
              </Link>
            </div>
            <div className="flex-1 w-full aspect-[4/3] bg-[#0A0A0A] rounded-[40px] border border-white/5 relative overflow-hidden p-8 flex flex-col justify-between">
              <div className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20">Rapport de sécurité</div>
              <div className="flex flex-col items-center justify-center flex-1 gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-2 border-blue-500/30 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full border-2 border-blue-500/50 flex items-center justify-center">
                      <ShieldCheck size={28} className="text-blue-400" />
                    </div>
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-black flex items-center justify-center">
                    <CheckCircle2 size={10} className="text-white" />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-1">Système sécurisé</div>
                  <div className="text-[10px] text-white/30 font-medium">AES-256 · TLS 1.3 · RGPD</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Chiffrement", val: "AES-256", color: "text-blue-400" },
                  { label: "Uptime", val: "99.9%", color: "text-emerald-400" },
                  { label: "Hébergement", val: "France", color: "text-indigo-400" },
                ].map((s) => (
                  <div key={s.label} className="bg-white/[0.03] border border-white/5 rounded-2xl px-3 py-3 text-center">
                    <div className={`text-sm font-black ${s.color}`}>{s.val}</div>
                    <div className="text-[9px] font-bold text-white/20 uppercase tracking-wider mt-0.5">{s.label}</div>
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
            <div className="flex-1 relative group">
              <BarChart3 size={32} className="text-blue-500 mb-6" />
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter mb-4 sm:mb-6 leading-[0.9]">Décisions basées sur les faits.</h2>
              <p className="text-slate-500 text-lg font-medium leading-relaxed mb-10">Flux de données Live RH transformés en KPIs actionnables. Décisions basées sur des faits, pas des intuitions.</p>
              <Link href="/signup" className="inline-flex items-center gap-2 h-12 px-8 rounded-full bg-blue-600 text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-blue-500 transition-all hover:shadow-[0_0_40px_-8px_rgba(37,99,235,0.8)]">
                Voir mes analytics <ArrowRight size={14} />
              </Link>
            </div>
            <div className="flex-1 w-full aspect-[4/3] bg-[#0A0A0A] rounded-[40px] border border-white/5 relative overflow-hidden p-8 flex flex-col gap-5">
              <div className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20">Dashboard Analytics — Avril 2026</div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Taux présence", val: "94%", delta: "+2%", color: "text-emerald-400" },
                  { label: "Heures / semaine", val: "38.4h", delta: "-0.5h", color: "text-blue-400" },
                  { label: "Absences", val: "3", delta: "-5", color: "text-amber-400" },
                  { label: "Satisfaction", val: "4.8/5", delta: "+0.3", color: "text-indigo-400" },
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-4">
                    <div className={`text-2xl font-black ${kpi.color}`}>{kpi.val}</div>
                    <div className="text-[10px] text-white/30 font-bold uppercase tracking-wider mt-1">{kpi.label}</div>
                    <div className="text-[10px] text-emerald-400 font-black mt-1">{kpi.delta} ce mois</div>
                  </div>
                ))}
              </div>
              <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 flex flex-col justify-between">
                <div className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-3">Présence hebdomadaire</div>
                <div className="flex items-end gap-2 h-16">
                  {[65, 80, 72, 90, 85, 78, 94].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full rounded-sm bg-blue-600/60" style={{ height: `${h}%` }} />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2">
                  {["L","M","M","J","V","S","D"].map((d, i) => (
                    <span key={i} className="flex-1 text-center text-[9px] font-black text-white/20">{d}</span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ── */}
      <section id="comment" className="py-32 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-500 mb-3">Comment ça marche</p>
            <h2 className="text-4xl font-bold text-white tracking-tight">Simple. Rapide. Efficace.</h2>
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
                className="flex items-start gap-6 p-6 rounded-2xl border border-white/5 bg-white/[0.02]"
              >
                <span className="text-xs font-bold text-blue-500 mt-0.5 shrink-0">{step.n}</span>
                <div>
                  <h3 className="text-base font-semibold text-white mb-1.5">{step.t}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.d}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section id="cta" className="py-20 sm:py-32 lg:py-40 px-4 sm:px-6 text-center bg-white text-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-30%,#3b82f610,transparent_60%)]" />
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} transition={{ duration: 0.9, ease: [0.19, 1, 0.22, 1] }}
          className="max-w-3xl mx-auto relative z-10"
        >
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.85] mb-6">
            Fini les tableurs.<br />
            <span className="text-blue-600">Bienvenue sur Shiftly.</span>
          </h2>
          <p className="text-black/40 text-lg font-medium mb-14 max-w-xl mx-auto leading-relaxed">
            Rejoignez les managers qui ont repris le contrôle de leur temps. Gratuit pour commencer, sans engagement.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <Link href="/signup" className="h-14 px-10 rounded-full bg-blue-600 text-white font-black uppercase tracking-[0.2em] text-xs hover:bg-blue-500 transition-all hover:scale-105 hover:shadow-[0_0_50px_-10px_rgba(37,99,235,0.7)] inline-flex items-center gap-3">
              Commencer gratuitement <ArrowRight size={14} />
            </Link>
            <Link href="/login" className="h-14 px-10 rounded-full border-2 border-black/10 text-black font-black uppercase tracking-[0.2em] text-xs hover:bg-black/5 transition-all inline-flex items-center">
              J&apos;ai déjà un compte
            </Link>
          </div>
          <p className="mt-8 text-black/25 font-medium text-xs">Aucune CB requise · Setup en 2 min · RGPD</p>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-14 px-6 bg-[#000]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-12">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                <Calendar size={14} className="text-white" />
              </div>
              <span className="font-black tracking-tight text-white text-sm">SHIFTLY</span>
            </div>
            <p className="text-white/30 text-sm font-medium max-w-[180px] leading-relaxed mb-4">
              Le planning de vos équipes, simplement.
            </p>
            <p className="text-white/20 text-xs">
              Fait par{" "}
              <a href="https://www.sayehahmed.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 transition-colors font-semibold">
                Sayeh Ahmed
              </a>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-12 sm:grid-cols-3">
            {[
              { title: "Produit", links: [["Fonctionnalités", "#features"], ["Comment ça marche", "#how"], ["Sécurité", "#"]] },
              { title: "Compte", links: [["Connexion", "/login"], ["Inscription", "/signup"], ["Support", "#"]] },
              { title: "Légal", links: [["Confidentialité", "#"], ["CGU", "#"], ["RGPD", "#"]] },
            ].map((col) => (
              <div key={col.title}>
                <p className="mb-4 text-[9px] font-black uppercase tracking-[0.4em] text-white/40">{col.title}</p>
                <ul className="space-y-3">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <a href={href} className="text-xs font-medium text-white/25 hover:text-white/60 transition-colors">{label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-3 text-[10px] font-medium text-white/20">
          <p>© 2026 Shiftly. Tous droits réservés. Made in France.</p>
          <p>v2.0</p>
        </div>
      </footer>
    </div>
  );
}