"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { apiFetchClient, getToken } from "@/lib/clientApi";
import { SmoothScroll } from "@/components/smooth-scroll";
import {
  ArrowRight, Calendar, ClipboardCheck,
  ShieldCheck, BarChart3, Check,
  Menu, X, Lock,
} from "lucide-react";

const NAV_LINKS: [string, string][] = [
  ["Fonctionnalités", "#features"],
  ["Comment ça marche", "#steps"],
  ["Tarifs", "#tarifs"],
  ["Notre histoire", "#histoire"],
  ["Sécurité", "#security"],
];

const PLANS = [
  {
    name: "Gratuit",
    price: "0€",
    period: "",
    desc: "Pour tester avec une petite équipe.",
    features: [
      "Jusqu'à 5 employés",
      "Planning & créneaux",
      "Congés et demandes",
      "Gestion des employés",
    ],
    cta: "Démarrer gratuitement",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "2€",
    period: "/mois",
    desc: "Prix de lancement — augmente une fois l'app stabilisée.",
    features: [
      "Employés illimités",
      "Tout le plan Gratuit",
      "Pointage par QR code",
      "Import / export Excel",
      "Statistiques & analytics",
      "Logo personnalisé",
    ],
    cta: "Essayer le plan Pro",
    highlighted: true,
  },
];

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
  const [heroEmail, setHeroEmail] = useState("");
  const [heroSubmitting, setHeroSubmitting] = useState(false);
  const heroRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.6], [1, 0.92]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    if (getToken()) {
      apiFetchClient<{ email?: string; role?: string }>("/auth/me")
        .then(setMe).catch(() => setMe(null));
    }
  }, []);

  const router = useRouter();

  const handleHeroSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = heroEmail.trim();
    if (!email) return;
    setHeroSubmitting(true);
    apiFetchClient("/leads/welcome", {
      method: "POST",
      body: JSON.stringify({ email }),
    }).catch(() => {});
    router.push(`/signup/admin?email=${encodeURIComponent(email)}`);
  };

  return (
    <SmoothScroll>
    <div className="min-h-screen bg-black text-white antialiased overflow-x-hidden selection:bg-[#3b82f6]/20 selection:text-[#3b82f6]">

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Shiftly",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            description:
              "Logiciel de gestion de planning d'équipe, pointage par QR code et demandes RH pour commerces, restaurants et petites équipes.",
            url: "https://shiftly.site",
            offers: [
              { "@type": "Offer", name: "Gratuit", price: "0", priceCurrency: "EUR" },
              { "@type": "Offer", name: "Pro", price: "2", priceCurrency: "EUR" },
            ],
          }),
        }}
      />

      {/* NAV — fixe, persiste sur toute la page */}
      <nav
        className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-5 py-5 sm:px-8 sm:py-6 lg:px-12"
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        <span className="text-lg font-semibold tracking-tight text-white">Shiftly</span>

        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-full bg-white/10 px-1.5 py-1.5 backdrop-blur-lg">
            {NAV_LINKS.map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="rounded-full px-4 py-1.5 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
              >
                {label}
              </a>
            ))}
          </div>
          <Link
            href={me ? "/dashboard" : "/signup"}
            className="self-stretch flex items-center rounded-full px-5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(to bottom, #2B2B2B, #101010)" }}
          >
            {me ? "Dashboard" : "Démarrer"}
          </Link>
        </div>

        <button
          className="md:hidden relative z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-lg text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          <Menu size={18} className={`absolute transition-all duration-300 ${mobileOpen ? "rotate-90 scale-0 opacity-0" : "opacity-100"}`} />
          <X size={18} className={`absolute transition-all duration-300 ${mobileOpen ? "opacity-100" : "-rotate-90 scale-0 opacity-0"}`} />
        </button>
      </nav>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/80 backdrop-blur-md transition-opacity duration-300 md:hidden ${mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile drawer */}
      <div
        className={`fixed right-0 top-0 z-40 flex h-full w-72 flex-col bg-black/90 backdrop-blur-xl transition-transform md:hidden ${mobileOpen ? "translate-x-0" : "translate-x-full"}`}
        style={{ transitionDuration: "500ms", transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
      >
        <div className="flex flex-col gap-2 px-6 pt-24">
          {NAV_LINKS.map(([label, href], i) => (
            <a
              key={label}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-4 py-3.5 text-base font-medium text-white/80 hover:bg-white/10 hover:text-white transition-all"
              style={{
                transitionProperty: "opacity, transform, background-color, color",
                opacity: mobileOpen ? 1 : 0,
                transform: mobileOpen ? "translateX(0)" : "translateX(24px)",
                transitionDelay: mobileOpen ? `${(i + 1) * 60}ms` : "0ms",
                transitionDuration: "300ms",
              }}
            >
              {label}
            </a>
          ))}
        </div>
        <Link
          href={me ? "/dashboard" : "/signup"}
          onClick={() => setMobileOpen(false)}
          className="mt-auto mx-6 mb-10 rounded-full px-6 py-3.5 text-center text-sm font-medium text-white transition-all"
          style={{
            background: "linear-gradient(to bottom, #2B2B2B, #101010)",
            opacity: mobileOpen ? 1 : 0,
            transform: mobileOpen ? "translateY(0)" : "translateY(16px)",
            transitionDelay: mobileOpen ? "300ms" : "0ms",
            transitionDuration: "400ms",
          }}
        >
          {me ? "Dashboard" : "Démarrer"}
        </Link>
      </div>

      {/* HERO — contenu ancré en bas d'une section plein écran */}
      <section ref={heroRef} className="dot-grid-dark relative h-screen w-full overflow-hidden" style={{ fontFamily: "var(--font-instrument-sans)" }}>

        {/* Background video (source: motionsites.ai) */}
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260803_192301_9231ed6b-c55c-4a48-909c-4ebe11cf2e11.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="pointer-events-none absolute inset-0 bg-black/40" />

        <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="relative z-10 flex h-full flex-col">

          {/* MAIN — ancré en bas */}
          <main className="mt-auto flex flex-col gap-6 px-5 pb-8 sm:gap-8 sm:px-8 sm:pb-12 lg:flex-row lg:items-end lg:justify-between lg:px-12 lg:pb-16">

            {/* Left — headline + CTA email */}
            <div className="max-w-xl">
              <motion.h1
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                className="text-3xl sm:text-4xl lg:text-[3.5rem] font-semibold leading-[1.1] tracking-tight text-white"
              >
                Le planning qui tourne, même sans vous.
              </motion.h1>

              <motion.form
                onSubmit={handleHeroSubmit}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
                className="mt-6 flex flex-col gap-3 sm:mt-8 sm:inline-flex sm:flex-row sm:items-center sm:rounded-full sm:bg-white sm:p-1.5"
              >
                <input
                  type="email"
                  required
                  value={heroEmail}
                  onChange={e => setHeroEmail(e.target.value)}
                  placeholder="Votre email pro"
                  className="rounded-full bg-white px-5 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none sm:w-64 sm:rounded-none sm:bg-transparent sm:px-4 sm:py-2"
                />
                <button
                  type="submit"
                  disabled={heroSubmitting}
                  className="rounded-full px-6 py-3 text-center text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-60 sm:py-2.5"
                  style={{ background: "linear-gradient(to bottom, #2B2B2B, #101010)" }}
                >
                  Commencer
                </button>
              </motion.form>
            </div>

            {/* Right — glass cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5 }}
              className="flex flex-col gap-4 sm:flex-row lg:w-auto lg:gap-5"
            >
              <div className="flex flex-col justify-between rounded-2xl bg-white/10 p-5 backdrop-blur-lg sm:w-64 sm:p-6">
                <p className="text-3xl sm:text-4xl font-normal tracking-tight text-white" style={{ fontFamily: "var(--font-silkscreen)" }}>
                  3 clics
                </p>
                <p className="mt-3 text-sm leading-relaxed text-white/70 sm:mt-4">
                  Pour publier un planning complet, sans tableur.
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-lg sm:w-64 sm:p-6">
                <div className="mb-3 flex items-center gap-2 sm:mb-4">
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-black">
                    <Lock size={12} className="text-white" />
                  </span>
                  <span className="text-sm font-semibold text-white">Sécurité</span>
                </div>
                <p className="text-sm leading-relaxed text-white/80">
                  Hébergement en France, données chiffrées, conforme RGPD.
                </p>
              </div>
            </motion.div>
          </main>
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
                {item} <span className="text-[#3b82f6]">·</span>
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
                <p className="font-mono text-xs text-[#3b82f6] mb-8">[ gestion d&apos;équipe ]</p>
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

            {/* Right — vraie capture du dashboard */}
            <div className="relative min-h-[300px] md:min-h-0 bg-[#0a0a0a]">
              <img
                src="/dashboard-preview.png"
                alt="Dashboard Shiftly"
                className="absolute inset-0 w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-black/10" />
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
          <p className="font-mono text-xs text-[#3b82f6] mb-4">[ fonctionnalités ]</p>
          <h2
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent"
          >
            Tout ce dont votre équipe a besoin.
          </h2>
        </motion.div>

        <div className="border-t border-white/10 mb-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.08 }} viewport={{ once: true }}
              className="group grid grid-cols-1 md:grid-cols-[80px_1fr_1.3fr_auto] items-center gap-4 md:gap-8 border-b border-white/10 py-8 md:py-10"
            >
              <span className="font-mono text-2xl text-white/20 group-hover:text-[#3b82f6] transition-colors">
                {String(i + 1).padStart(2, "0")}
              </span>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-white/10 flex items-center justify-center text-white/40 group-hover:text-[#3b82f6] transition-colors">
                  <f.icon size={18} />
                </div>
                <div>
                  <p className="font-mono text-[10px] text-white/30 mb-1">{f.label}</p>
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-tight">{f.title}</h3>
                </div>
              </div>

              <p className="text-white/40 text-sm leading-relaxed max-w-md">{f.desc}</p>

              <Link
                href={f.href}
                className="md:justify-self-end inline-flex items-center gap-1.5 text-xs font-bold text-white/30 group-hover:text-[#3b82f6] transition-colors shrink-0"
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
          <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-[#3b82f6]/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <ShieldCheck size={32} className="text-[#3b82f6] mb-6" />
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
                <span key={tag} className="bg-white/10 backdrop-blur-lg px-4 py-1.5 rounded-full text-xs font-bold text-white/50">
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
            <p className="font-mono text-xs text-[#3b82f6] mb-4">[ comment ça marche ]</p>
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
                className="group bg-white/10 backdrop-blur-lg rounded-2xl p-6 flex items-start gap-6 hover:border-[#3b82f6]/20 transition-colors"
              >
                <span className="text-[#3b82f6] font-bold text-xs shrink-0 mt-0.5 tabular-nums">{step.n}</span>
                <div>
                  <h3 className="text-base font-bold text-white mb-1.5">{step.t}</h3>
                  <p className="text-sm text-white/40 leading-relaxed font-medium">{step.d}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TARIFS */}
      <section id="tarifs" className="py-24 sm:py-36 px-4 sm:px-6 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <p className="font-mono text-xs text-[#3b82f6] mb-4">[ tarifs ]</p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
            Un prix simple. Zéro surprise.
          </h2>
          <p className="mt-5 text-white/40 text-base max-w-md mx-auto">
            Gratuit pour démarrer. Un seul plan payant, sans palier caché.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.1 }} viewport={{ once: true }}
              className={`relative rounded-[28px] p-8 sm:p-10 flex flex-col ${
                plan.highlighted
                  ? "bg-white/10 backdrop-blur-lg border border-[#3b82f6]/30"
                  : "bg-white/[0.03] border border-white/10"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-8 rounded-full bg-[#3b82f6] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  Recommandé
                </span>
              )}

              <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
              <p className="text-white/40 text-sm mb-6">{plan.desc}</p>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-bold tracking-tight text-white">{plan.price}</span>
                {plan.period && <span className="text-white/40 text-sm">{plan.period}</span>}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-white/60">
                    <Check size={15} className="text-[#3b82f6] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className={`w-full h-12 rounded-full font-bold text-sm inline-flex items-center justify-center gap-2 transition-all ${
                  plan.highlighted
                    ? "bg-[#3b82f6] text-white hover:bg-[#3b82f6]/90"
                    : "bg-white/10 text-white hover:bg-white/15"
                }`}
              >
                {plan.cta} <ArrowRight size={14} />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* NOTRE HISTOIRE */}
      <section id="histoire" className="py-24 sm:py-36 px-4 sm:px-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <p className="font-mono text-xs text-[#3b82f6] mb-4">[ notre histoire ]</p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
            Un planning Excel de trop.
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}
          className="bg-white/10 backdrop-blur-lg rounded-[28px] p-10 sm:p-14 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-10 md:gap-16 items-center"
        >
          <div>
            <p className="text-white/50 text-base sm:text-lg font-medium leading-relaxed mb-5">
              Shiftly est né d&apos;un constat simple : dans beaucoup de commerces et de restaurants, le planning se
              fait encore sur un tableur envoyé par mail ou par groupe WhatsApp. Les conflits d&apos;horaires se
              découvrent trop tard, personne ne sait vraiment qui travaille quand, et les managers passent plus de
              temps à corriger des erreurs qu&apos;à gérer leur équipe.
            </p>
            <p className="text-white/50 text-base sm:text-lg font-medium leading-relaxed">
              J&apos;ai voulu construire l&apos;outil que ces équipes méritent : simple, clair, et qui prévient les
              problèmes avant qu&apos;ils n&apos;arrivent. Shiftly est développé en solo, avec l&apos;objectif de
              rester au plus près des managers et des employés qui l&apos;utilisent au quotidien.
            </p>
          </div>

          <div className="flex flex-col items-center text-center md:w-56 shrink-0">
            <div className="w-20 h-20 rounded-full bg-[#3b82f6]/15 border border-[#3b82f6]/30 flex items-center justify-center text-2xl font-bold text-[#3b82f6] mb-4">
              SA
            </div>
            <p className="font-bold text-white text-sm">Sayeh Ahmed</p>
            <p className="text-white/40 text-xs font-medium mb-3">Fondateur &amp; Développeur</p>
            <a
              href="https://www.sayehahmed.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-[#3b82f6] hover:text-[#3b82f6]/80 transition-colors"
            >
              sayehahmed.com
            </a>
          </div>
        </motion.div>
      </section>

      {/* CTA FINAL */}
      <section id="security" className="py-24 sm:py-36 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(59,130,246,0.08),transparent_65%)] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#3b82f6]/6 blur-[160px] rounded-full pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }} whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }} viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center relative z-10"
        >
          <p className="font-mono text-xs text-[#3b82f6] mb-6">[ commencer ]</p>
          <h2
            className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight leading-[0.95] mb-6"
            style={{ fontFamily: "var(--font-instrument-sans)" }}
          >
            <span className="bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
              Fini les tableurs.<br />
            </span>
            <span className="bg-gradient-to-b from-[#3b82f6] to-blue-300 bg-clip-text text-transparent">
              Bienvenue sur Shiftly.
            </span>
          </h2>
          <p className="text-white/35 text-lg font-medium mb-12 max-w-xl mx-auto leading-relaxed">
            Rejoignez les managers qui ont repris le contrôle de leur temps. Gratuit pour commencer, sans engagement.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="h-14 px-10 rounded-full bg-[#3b82f6] text-black font-bold text-sm hover:scale-105 hover:shadow-[0_0_60px_-10px_rgba(59,130,246,0.7)] transition-all inline-flex items-center gap-3"
            >
              Commencer gratuitement <ArrowRight size={15} />
            </Link>
            <Link
              href="/login"
              className="h-14 px-10 rounded-full bg-white/10 backdrop-blur-lg font-bold text-sm text-white/60 hover:bg-white/5 hover:text-white transition-all inline-flex items-center"
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
              <div className="w-7 h-7 rounded-lg bg-[#3b82f6] flex items-center justify-center">
                <Calendar size={14} className="text-black" />
              </div>
              <span className="font-bold tracking-tight text-white text-sm">SHIFTLY</span>
            </div>
            <p className="text-white/30 text-sm font-medium max-w-[180px] leading-relaxed mb-4">
              Le planning de vos équipes, simplement.
            </p>
            <p className="text-white/20 text-xs">
              Fait par{" "}
              <a href="https://www.sayehahmed.com" target="_blank" rel="noopener noreferrer" className="text-[#3b82f6] hover:text-[#3b82f6]/80 transition-colors font-semibold">
                Sayeh Ahmed
              </a>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-12 sm:grid-cols-3">
            {[
              { title: "Produit", links: [["Fonctionnalités", "#features"], ["Comment ça marche", "#steps"], ["Tarifs", "#tarifs"], ["Sécurité", "#security"]] },
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
    </SmoothScroll>
  );
}
