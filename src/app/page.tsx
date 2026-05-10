"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { apiFetchClient, getToken } from "@/lib/clientApi";
import {
  ArrowRight, Calendar, ClipboardCheck,
  ShieldCheck, BarChart3,
  Menu, X, ChevronRight,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

const FEATURES = [
  {
    icon: Calendar,
    label: "Visibilité Totale",
    title: "Anticipez l'imprévisible.",
    desc: "Gérez les rotations, les absences et les congés depuis un seul écran. Les conflits sont détectés avant même que vous appuyiez sur Enregistrer.",
    href: "/signup",
    cta: "Créer mon planning",
  },
  {
    icon: ClipboardCheck,
    label: "Zéro Friction",
    title: "Approuvez en un geste.",
    desc: "Les demandes de congés arrivent, vous validez ou refusez en un tap. L'employé est notifié instantanément. Fini les emails perdus.",
    href: "/signup",
    cta: "Essayer maintenant",
  },
  {
    icon: BarChart3,
    label: "Intelligence RH",
    title: "Décisions basées sur les faits.",
    desc: "Taux de présence, heures travaillées, tendances d'absences. Transformez vos données RH en KPIs actionnables.",
    href: "/signup",
    cta: "Voir les analytics",
  },
];

const STEPS = [
  { n: "01", t: "Créez votre espace", d: "Inscription en 30 secondes. Configurez votre organisation et invitez vos collaborateurs par email." },
  { n: "02", t: "Construisez vos plannings", d: "Glissez-déposez les shifts, gérez les absences depuis un seul écran. Les conflits sont détectés automatiquement." },
  { n: "03", t: "Partagez en un clic", d: "Notifiez votre équipe instantanément. Chaque employé consulte son planning en temps réel depuis son téléphone." },
];

export default function Home() {
  const [me, setMe] = useState<{ email?: string; role?: string } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const heroRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.6], [1, 0.92]);

  useEffect(() => {
    if (getToken()) {
      apiFetchClient<{ email?: string; role?: string }>("/auth/me")
        .then(setMe).catch(() => setMe(null));
    }
  }, []);

  return (
    <div className="min-h-screen bg-black text-white antialiased overflow-x-hidden selection:bg-[#5a9eff]/20 selection:text-[#5a9eff]">

      {/* NAV */}
      <nav className="fixed top-4 inset-x-4 sm:top-6 sm:inset-x-6 z-[100] flex flex-col items-center gap-2">
        <div className="w-full max-w-7xl h-14 rounded-full glass-morphism-strong px-5 sm:px-8 flex items-center justify-between">
          <span className="text-sm font-bold tracking-tight text-white">Shiftly</span>

          <div className="hidden lg:flex items-center gap-8">
            {[
              ["Fonctionnalités", "#features"],
              ["Comment ça marche", "#steps"],
              ["Sécurité", "#security"],
            ].map(([label, href]) => (
              <a key={label} href={href} className="text-sm font-medium text-white/50 hover:text-white transition-colors">
                {label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {me ? (
              <Link href="/dashboard" className="hidden sm:flex h-8 px-4 rounded-full bg-[#5a9eff] text-black text-sm font-bold items-center justify-center hover:bg-[#5a9eff]/90 transition-all glow-blue-sm">
                Dashboard
              </Link>
            ) : (
              <Link href="/login" className="hidden sm:flex h-8 px-4 rounded-full bg-white text-black text-sm font-bold items-center justify-center hover:bg-white/90 transition-all">
                Connexion
              </Link>
            )}
            <button
              className="lg:hidden flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 hover:text-white transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={15} /> : <Menu size={15} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
            className="w-full max-w-7xl rounded-2xl glass-morphism-strong px-5 py-5 flex flex-col gap-3 lg:hidden"
          >
            {[
              ["Fonctionnalités", "#features"],
              ["Comment ça marche", "#steps"],
              ["Sécurité", "#security"],
            ].map(([label, href]) => (
              <a key={label} href={href} onClick={() => setMobileOpen(false)} className="text-sm font-medium text-white/60 hover:text-white py-1 transition-colors">
                {label}
              </a>
            ))}
            <div className="border-t border-white/8 pt-3 mt-1">
              <Link href="/login" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-white/60 hover:text-white transition-colors">
                Connexion
              </Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* HERO */}
      <section ref={heroRef} className="relative pt-36 sm:pt-52 lg:pt-64 pb-16 sm:pb-24 px-4 sm:px-6 flex flex-col items-center overflow-hidden">

        {/* Background gradient */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#5a9eff]/8 blur-[160px] rounded-full" />
          <div className="absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t from-black to-transparent" />
        </div>

        <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="text-center relative z-10">

          {/* Headline */}
          <motion.h1
            {...fadeUp} transition={{ duration: 0.8, delay: 0.1 }}
            className="text-[clamp(3rem,12vw,9rem)] font-bold tracking-tight leading-[0.88] mb-8"
          >
            <span className="text-white">
              Gérez votre équipe
            </span>
            <br />
            <motion.span
              initial={{ opacity: 0, filter: "blur(24px)", y: 8 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-white italic inline-block"
              style={{ fontFamily: "var(--font-instrument-serif)" }}
            >
              sans le chaos.
            </motion.span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            {...fadeUp} transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-xl mx-auto text-white/50 text-lg md:text-xl font-medium mb-10 leading-relaxed"
          >
            La plateforme tout-en-un pour le planning, les congés et la communication interne.
            Conçu pour les équipes qui exigent de la clarté.
          </motion.p>

          {/* CTAs */}
          <motion.div {...fadeUp} transition={{ duration: 0.8, delay: 0.3 }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="h-14 px-10 rounded-full bg-white text-black font-bold text-sm hover:scale-105 hover:shadow-[0_0_50px_-10px_rgba(255,255,255,0.4)] transition-all inline-flex items-center gap-2.5"
            >
              Démarrer gratuitement <ArrowRight size={15} />
            </Link>
            <a
              href="#features"
              className="h-14 px-10 rounded-full glass-morphism font-bold text-sm text-white/80 hover:bg-white/10 hover:text-white transition-all inline-flex items-center gap-2.5"
            >
              Voir comment ça marche <ChevronRight size={15} />
            </a>
          </motion.div>

          {/* Trust */}
          <motion.p {...fadeUp} transition={{ duration: 0.8, delay: 0.45 }} className="mt-8 text-white/20 text-xs font-medium">
            Aucune CB requise · Setup en 2 min · Conforme RGPD
          </motion.p>
        </motion.div>

      </section>

      {/* TICKER + SPOTLIGHT */}
      <section className="pb-8 sm:pb-12">
        {/* Ticker */}
        <div className="border-y border-white/5 py-3.5 overflow-hidden">
          <div className="flex animate-ticker" style={{ width: "max-content" }}>
            {[
              "Planning sans conflits",
              "Gestion des congés",
              "Notifications temps réel",
              "Rapports analytiques",
              "Hébergement France",
              "Conformité RGPD",
              "Détection automatique",
              "Équipes connectées",
              "Planning sans conflits",
              "Gestion des congés",
              "Notifications temps réel",
              "Rapports analytiques",
              "Hébergement France",
              "Conformité RGPD",
              "Détection automatique",
              "Équipes connectées",
            ].map((item, i) => (
              <span key={i} className="text-[10px] font-bold uppercase tracking-[0.35em] text-white/25 shrink-0 px-8">
                {item} <span className="text-[#5a9eff]">·</span>
              </span>
            ))}
          </div>
        </div>

        {/* Split spotlight card */}
        <div className="px-4 sm:px-6 max-w-7xl mx-auto mt-5">
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }} viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden border border-white/8 bg-[#090909] grid grid-cols-1 md:grid-cols-2 min-h-[480px]"
          >
            {/* Left — text */}
            <div className="p-10 sm:p-14 flex flex-col justify-between relative z-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#5a9eff] mb-8">GESTION D&apos;ÉQUIPE / 001</p>
                <h2 className="text-5xl sm:text-6xl font-bold tracking-tight text-white leading-[0.9] mb-6">
                  Planifiez<br />sans effort.
                </h2>
                <p className="text-white/40 text-base font-medium leading-relaxed max-w-xs">
                  Construisez vos plannings hebdomadaires en quelques clics. Les conflits sont détectés automatiquement, votre équipe notifiée instantanément.
                </p>
              </div>
              <Link
                href="/signup"
                className="mt-10 w-fit h-12 px-8 rounded-full bg-white text-black font-bold text-sm hover:scale-105 transition-all inline-flex items-center gap-2"
              >
                Démarrer gratuitement <ArrowRight size={14} />
              </Link>
            </div>

            {/* Right — image */}
            <div className="relative min-h-[300px] md:min-h-0">
              <img
                src="/spotlight-bg.jpg"
                alt=""
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-black/40" />
              {/* Gradient blending on left edge */}
              <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#090909] to-transparent" />
              {/* Gradient blending on bottom */}
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#090909] to-transparent md:hidden" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 sm:py-36 px-4 sm:px-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-[#5a9eff] mb-4">Fonctionnalités</p>
          <h2
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent"
          >
            Tout ce dont votre équipe a besoin.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: i * 0.1 }} viewport={{ once: true }}
              whileHover={{ y: -4 }}
              className="group relative glass-morphism rounded-[28px] p-7 sm:p-8 flex flex-col justify-between overflow-hidden cursor-default"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(90,158,255,0.08),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              <div className="absolute inset-0 rounded-[28px] border border-[#5a9eff]/0 group-hover:border-[#5a9eff]/20 transition-colors duration-500 pointer-events-none" />

              <div className="relative z-10">
                <div className="w-11 h-11 rounded-2xl glass-morphism flex items-center justify-center text-white/30 group-hover:text-[#5a9eff] transition-colors mb-6">
                  <f.icon size={20} />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/30 group-hover:text-[#5a9eff]/70 transition-colors mb-3">{f.label}</p>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-3 leading-tight">{f.title}</h3>
                <p className="text-white/40 text-sm font-medium leading-relaxed">{f.desc}</p>
              </div>

              <Link
                href={f.href}
                className="relative z-10 mt-8 inline-flex items-center gap-1.5 text-xs font-bold text-white/30 group-hover:text-[#5a9eff] transition-colors"
              >
                {f.cta} <ArrowRight size={13} />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Big dark card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}
          className="relative rounded-[28px] bg-[#090909] border border-white/8 p-10 sm:p-16 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-[#5a9eff]/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <ShieldCheck size={32} className="text-[#5a9eff] mb-6" />
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[0.9] mb-5">
              <span className="bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
                Souveraineté totale<br />des données.
              </span>
            </h2>
            <p className="text-white/40 text-lg font-medium leading-relaxed mb-8 max-w-lg">
              Hébergement européen, chiffrement AES-256, conformité RGPD intégrale. Vos données restent les vôtres — point.
            </p>
            <div className="flex flex-wrap gap-3">
              {["AES-256", "TLS 1.3", "RGPD", "99.9% Uptime", "Hébergement France"].map((tag) => (
                <span key={tag} className="glass-morphism px-4 py-1.5 rounded-full text-xs font-bold text-white/50">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section id="steps" className="py-24 sm:py-36 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}
            className="mb-14"
          >
            <p className="text-xs font-bold uppercase tracking-[0.4em] text-[#5a9eff] mb-4">Comment ça marche</p>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
              Simple. Rapide. Efficace.
            </h2>
          </motion.div>

          <div className="flex flex-col gap-4">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }} viewport={{ once: true }}
                className="group glass-morphism rounded-2xl p-6 flex items-start gap-6 hover:border-[#5a9eff]/20 transition-colors"
              >
                <span className="text-[#5a9eff] font-bold text-xs shrink-0 mt-0.5 tabular-nums">{step.n}</span>
                <div>
                  <h3 className="text-base font-bold text-white mb-1.5">{step.t}</h3>
                  <p className="text-sm text-white/40 leading-relaxed font-medium">{step.d}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section id="security" className="py-24 sm:py-36 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(90,158,255,0.08),transparent_65%)] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#5a9eff]/6 blur-[160px] rounded-full pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }} whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }} viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center relative z-10"
        >
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-[#5a9eff] mb-6">Commencer</p>
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[0.88] mb-6">
            <span className="bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
              Fini les tableurs.<br />
            </span>
            <span
              className="italic bg-gradient-to-b from-[#5a9eff] to-[#5a9eff]/50 bg-clip-text text-transparent"
              style={{ fontFamily: "var(--font-instrument-serif)" }}
            >
              Bienvenue sur Shiftly.
            </span>
          </h2>
          <p className="text-white/35 text-lg font-medium mb-12 max-w-xl mx-auto leading-relaxed">
            Rejoignez les managers qui ont repris le contrôle de leur temps. Gratuit pour commencer, sans engagement.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="h-14 px-10 rounded-full bg-[#5a9eff] text-black font-bold text-sm hover:scale-105 hover:shadow-[0_0_60px_-10px_rgba(90,158,255,0.7)] transition-all inline-flex items-center gap-3"
            >
              Commencer gratuitement <ArrowRight size={15} />
            </Link>
            <Link
              href="/login"
              className="h-14 px-10 rounded-full glass-morphism font-bold text-sm text-white/60 hover:bg-white/5 hover:text-white transition-all inline-flex items-center"
            >
              J&apos;ai déjà un compte
            </Link>
          </div>
          <p className="mt-8 text-white/20 text-xs font-medium">Aucune CB requise · Setup en 2 min · RGPD</p>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-14 px-6 bg-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-12">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-[#5a9eff] flex items-center justify-center">
                <Calendar size={14} className="text-black" />
              </div>
              <span className="font-bold tracking-tight text-white text-sm">SHIFTLY</span>
            </div>
            <p className="text-white/30 text-sm font-medium max-w-[180px] leading-relaxed mb-4">
              Le planning de vos équipes, simplement.
            </p>
            <p className="text-white/20 text-xs">
              Fait par{" "}
              <a href="https://www.sayehahmed.com" target="_blank" rel="noopener noreferrer" className="text-[#5a9eff] hover:text-[#5a9eff]/80 transition-colors font-semibold">
                Sayeh Ahmed
              </a>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-12 sm:grid-cols-3">
            {[
              { title: "Produit", links: [["Fonctionnalités", "#features"], ["Comment ça marche", "#steps"], ["Sécurité", "#security"]] },
              { title: "Compte", links: [["Connexion", "/login"], ["Inscription", "/signup"], ["Support", "/support"]] },
              { title: "Légal", links: [["Confidentialité", "/confidentialite"], ["CGU", "/cgu"], ["RGPD", "/rgpd"]] },
            ].map((col) => (
              <div key={col.title}>
                <p className="mb-4 text-[9px] font-bold uppercase tracking-[0.4em] text-white/25">{col.title}</p>
                <ul className="space-y-3">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <a href={href} className="text-xs font-medium text-white/30 hover:text-white/70 transition-colors">{label}</a>
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
