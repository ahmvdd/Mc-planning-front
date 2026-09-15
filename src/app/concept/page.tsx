"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useInView, animate } from "framer-motion";
import { ArrowUpRight, Bell, QrCode, Zap } from "lucide-react";

function AnimatedStat({ value, prefix = "", suffix = "", label }: { value: number; prefix?: string; suffix?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(0, value, {
      duration: 1.3,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [isInView, value]);

  return (
    <div ref={ref}>
      <motion.p
        initial={{ filter: "blur(6px)", opacity: 0 }}
        animate={isInView ? { filter: "blur(0px)", opacity: 1 } : {}}
        transition={{ duration: 0.8 }}
        className="font-mono text-4xl sm:text-5xl font-black tracking-tight tabular-nums"
      >
        {prefix}{display}{suffix}
      </motion.p>
      <p className="mt-3 text-xs text-black/50 max-w-[18ch] leading-relaxed">{label}</p>
    </div>
  );
}

const STEPS = [
  {
    n: "01",
    t: "Planning sans conflits",
    d: "Les chevauchements de créneaux sont détectés au moment de la saisie, pas découverts trois jours après par un employé qui se pointe au mauvais horaire.",
  },
  {
    n: "02",
    t: "Approbation en un geste",
    d: "Une demande de congé arrive, l'admin valide ou refuse en un tap. L'employé est notifié tout de suite — plus de fil WhatsApp à remonter.",
  },
  {
    n: "03",
    t: "Suivi en temps réel",
    d: "Présences, retards, absences : visibles depuis un seul écran. Le pointage QR code remplace la feuille papier à l'entrée.",
  },
];

const WEEK_MOCK = [
  { d: "Lun", h: 70, c: "bg-blue-500" },
  { d: "Mar", h: 45, c: "bg-blue-500" },
  { d: "Mer", h: 90, c: "bg-emerald-500" },
  { d: "Jeu", h: 30, c: "bg-blue-500" },
  { d: "Ven", h: 60, c: "bg-amber-500" },
  { d: "Sam", h: 20, c: "bg-white/15" },
  { d: "Dim", h: 20, c: "bg-white/15" },
];

const STATS = [
  { value: 1, prefix: "<", suffix: "s", l: "pour détecter un conflit de planning" },
  { value: 3, prefix: "", suffix: "", l: "clics pour publier un planning complet" },
  { value: 0, prefix: "", suffix: "€", l: "pour démarrer, sans carte bancaire" },
  { value: 100, prefix: "", suffix: "%", l: "temps réel entre admin et équipe" },
];

export default function ConceptPage() {
  const scrollSectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: scrollSectionRef,
    offset: ["start start", "end end"],
  });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const imageGlow = useTransform(scrollYProgress, [0, 0.5, 1], [0.15, 0.4, 0.15]);
  const imageBoxShadow = useTransform(imageGlow, (v) => `0 30px 90px -30px rgba(59,130,246,${v})`);

  const { scrollY } = useScroll();
  const heroImageY = useTransform(scrollY, [0, 700], [0, -60]);
  const heroImageScale = useTransform(scrollY, [0, 700], [1, 1.04]);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30 selection:text-blue-200">

      {/* Concept banner */}
      <div className="border-b border-white/10 bg-blue-500/5 px-4 py-2 text-center font-mono text-[11px] text-blue-300">
        Page de concept v3 — comparaison de direction artistique, non liée au site public.{" "}
        <Link href="/" className="underline hover:text-white transition-colors">Voir la landing actuelle</Link>
      </div>

      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="font-mono text-sm font-bold tracking-tight">SHIFTLY</span>
          <div className="hidden md:flex items-center gap-8 font-mono text-xs text-white/50">
            <a href="#produit" className="hover:text-white transition-colors">produit</a>
            <a href="#fonctionnement" className="hover:text-white transition-colors">fonctionnement</a>
          </div>
          <Link
            href="/signup"
            className="flex items-center gap-1.5 rounded-lg border border-white px-4 py-2 font-mono text-xs font-bold hover:bg-white hover:text-black transition-colors"
          >
            essayer <ArrowUpRight size={13} />
          </Link>
        </div>
      </nav>

      {/* HERO — grille technique */}
      <section className="dot-grid-dark relative overflow-hidden border-b border-white/10 px-6 pt-24 pb-0 sm:pt-32">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2.5 mb-8">
            <span className="h-2.5 w-2.5 bg-blue-500" />
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/60">Shiftly — gestion d&apos;équipe</span>
          </div>
          <h1 className="text-[clamp(2.6rem,8vw,5.5rem)] font-black leading-[1.02] tracking-tight">
            Le planning de votre équipe,
            <br />
            <span className="text-blue-400">sans tableur, sans conflit.</span>
          </h1>
          <p className="mx-auto mt-8 max-w-xl text-base text-white/50 leading-relaxed">
            Shiftly remplace le fichier Excel envoyé par mail et le groupe WhatsApp par un seul outil :
            planning, congés et pointage, à jour pour tout le monde en permanence.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-lg border border-white bg-white px-6 py-3 font-mono text-xs font-bold text-black hover:bg-transparent hover:text-white transition-colors"
            >
              Démarrer gratuitement
            </Link>
            <a
              href="#produit"
              className="rounded-lg border border-white/20 px-6 py-3 font-mono text-xs font-bold text-white/70 hover:border-white hover:text-white transition-colors"
            >
              Voir le produit
            </a>
          </div>
          <p className="mt-6 font-mono text-[11px] text-white/25">aucune CB requise · setup en 2 min</p>
        </div>

        {/* Hero product preview */}
        <div className="relative mx-auto mt-16 max-w-5xl px-0 sm:px-6">
          <div className="absolute -top-3 left-4 sm:left-10 z-10 flex items-center gap-2 rounded bg-blue-600 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-white">dashboard temps réel</span>
          </div>
          <motion.div
            style={{ y: heroImageY, scale: heroImageScale }}
            className="rounded-2xl border border-white/15 bg-[#0a0a0a] shadow-[0_40px_120px_-40px_rgba(59,130,246,0.45)] overflow-hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/concept-dashboard.png" alt="Dashboard Shiftly" className="w-full h-auto block" />
          </motion.div>
        </div>
        <div className="h-16 sm:h-24" />
      </section>

      {/* STATS — section claire, rupture de rythme */}
      <section className="dot-grid-light border-b border-black/10 px-6 py-24 sm:py-32 text-black">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-xs text-blue-600 mb-4">[ en pratique ]</p>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-16 max-w-xl">
            Conçu pour aller vite, pas pour impressionner.
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 border-t border-black/10 pt-10">
            {STATS.map((s) => (
              <AnimatedStat key={s.l} value={s.value} prefix={s.prefix} suffix={s.suffix} label={s.l} />
            ))}
          </div>
        </div>
      </section>

      {/* BENTO FEATURES */}
      <section id="produit" className="border-b border-white/10 px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-xs text-blue-400 mb-4 text-center">[ fonctionnalités ]</p>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-center mb-16 max-w-2xl mx-auto">
            Tout ce dont votre équipe a besoin.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[minmax(140px,auto)]">

            {/* Large card — weekly mock */}
            <div className="sm:col-span-2 lg:col-span-2 lg:row-span-2 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-transparent p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold tracking-tight mb-2">Planning sans conflits</h3>
                <p className="text-sm text-white/45 leading-relaxed max-w-xs">
                  Les chevauchements sont détectés à la saisie. Votre équipe voit ses créneaux à jour en temps réel.
                </p>
              </div>
              <div className="mt-8 flex gap-3 h-32">
                {WEEK_MOCK.map((d) => (
                  <div key={d.d} className="flex-1 h-full flex flex-col justify-end items-center gap-2">
                    <div className={`w-full rounded-md ${d.c}`} style={{ height: `${d.h}%` }} />
                    <span className="font-mono text-[10px] text-white/30">{d.d}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stat card */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col justify-between">
              <Zap size={18} className="text-blue-400" />
              <div>
                <p className="text-4xl font-black font-mono tracking-tight">3 clics</p>
                <p className="mt-1 text-xs text-white/40">pour publier un planning complet</p>
              </div>
            </div>

            {/* Notification mock card */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col gap-4">
              <Bell size={18} className="text-blue-400" />
              <div className="rounded-lg border border-white/10 bg-black/40 p-3">
                <p className="text-xs font-semibold">Congé approuvé</p>
                <p className="mt-1 text-[11px] text-white/40">Notifié à l&apos;instant</p>
              </div>
              <p className="text-xs text-white/40">Chaque décision notifie l&apos;équipe en direct.</p>
            </div>

            {/* Pointage QR card */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col justify-between">
              <QrCode size={18} className="text-blue-400" />
              <div>
                <h4 className="text-sm font-bold mb-1">Pointage QR</h4>
                <p className="text-xs text-white/40">Remplace la feuille papier à l&apos;entrée.</p>
              </div>
            </div>

            {/* Wide quote card */}
            <div className="sm:col-span-2 lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-8 flex items-center">
              <p className="text-lg sm:text-xl font-medium leading-snug text-white/80">
                &ldquo;Fini les fichiers Excel qui se contredisent entre deux managers.&rdquo;
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* SCROLL SHOWCASE — comment ça marche */}
      <section id="fonctionnement" ref={scrollSectionRef} className="relative border-b border-white/10 px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-xs text-blue-400 mb-4">[ comment ça marche ]</p>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-16 max-w-2xl">
            Simple. Rapide. Efficace.
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-16">
            <div className="relative pl-8">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-white/10">
                <motion.div className="absolute left-0 top-0 w-px bg-blue-500" style={{ height: lineHeight }} />
              </div>
              <div className="flex flex-col gap-20">
                {STEPS.map((f) => (
                  <motion.div
                    key={f.n}
                    initial={{ opacity: 0.3 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: false, amount: 0.6 }}
                    transition={{ duration: 0.4 }}
                  >
                    <span className="font-mono text-xs text-blue-400">{f.n}</span>
                    <h3 className="mt-3 text-xl font-bold tracking-tight">{f.t}</h3>
                    <p className="mt-3 text-sm text-white/45 leading-relaxed max-w-sm">{f.d}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="lg:sticky lg:top-24 h-fit">
              <motion.div
                className="rounded-2xl border border-white/15 overflow-hidden relative"
                style={{ boxShadow: imageBoxShadow }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/concept-dashboard.png" alt="Dashboard Shiftly" className="w-full h-auto block" />
              </motion.div>
              <p className="mt-3 font-mono text-[11px] text-white/30">↳ capture réelle du dashboard admin</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl rounded-3xl bg-blue-600 p-10 sm:p-16 flex flex-col sm:flex-row sm:items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Fini les tableurs.</h2>
            <p className="mt-2 text-sm text-blue-100">Gratuit pour commencer, sans engagement.</p>
          </div>
          <Link
            href="/signup"
            className="shrink-0 rounded-lg bg-white px-6 py-3 font-mono text-xs font-bold text-blue-700 hover:bg-blue-50 transition-colors text-center"
          >
            Commencer gratuitement
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 px-6 py-8">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row justify-between gap-3 font-mono text-[11px] text-white/25">
          <p>© 2026 Shiftly</p>
          <p>Fait par <a href="https://www.sayehahmed.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">Sayeh Ahmed</a></p>
        </div>
      </footer>
    </div>
  );
}
