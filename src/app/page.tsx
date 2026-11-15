"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetchClient, getToken } from "@/lib/clientApi";
import { SmoothScroll } from "@/components/smooth-scroll";
import {
  ArrowRight, Calendar, ClipboardCheck,
  ShieldCheck, BarChart3, Check, X,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import createGlobe from "cobe";

const NAV_LINKS: [string, string][] = [
  ["Fonctionnalités", "#features"],
  ["Comment ça marche", "#steps"],
  ["Tarifs", "#tarifs"],
  ["Sécurité", "#security"],
];

const PLANS = [
  {
    name: "Gratuit",
    price: "0€",
    period: "",
    desc: "Pour tester avec une petite équipe.",
    features: [
      "Employés illimités",
      "Planning & créneaux",
      "Congés et demandes",
      "Pointage par QR code",
      "Import / export Excel",
    ],
    cta: "Démarrer gratuitement",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "2€",
    period: "/mois",
    desc: "Pour les équipes qui grandissent.",
    features: [
      "Tout le plan Gratuit",
      "Statistiques & analytics",
      "Logo personnalisé",
      "IA intégrée — résout les conflits et fluidifie le planning (bientôt)",
    ],
    cta: "Essayer le plan Pro",
    highlighted: true,
  },
];

const FEATURES = [
  {
    icon: Calendar,
    label: "Visibilité Totale",
    title: "Anticipez l'imprévisible.",
    desc: "Gérez les rotations, les absences et les congés depuis un seul écran. Les conflits sont détectés avant même que vous appuyiez sur Enregistrer.",
    href: "/signup",
    cta: "Créer mon planning",
    details: [
      "Créez des périodes de planning (semaine, mois) et ajoutez les créneaux de chaque employé en quelques clics.",
      "Enregistrez vos semaines types comme modèles réutilisables et appliquez-les à une nouvelle date en un clic.",
      "Les employés déclarent leurs disponibilités — vous les voyez directement au moment d'assigner un créneau.",
      "Import et export Excel/CSV pour ceux qui viennent encore d'un tableur.",
    ],
  },
  {
    icon: ClipboardCheck,
    label: "Zéro Friction",
    title: "Approuvez en un geste.",
    desc: "Les demandes de congés arrivent, vous validez ou refusez en un tap. L'employé est notifié instantanément. Fini les emails perdus.",
    href: "/signup",
    cta: "Essayer maintenant",
    details: [
      "Chaque employé dépose sa demande (congé, document, absence) directement depuis son espace.",
      "L'admin valide ou refuse en un geste, avec un message optionnel pour expliquer la décision.",
      "Historique complet de chaque demande : qui a fait quoi, et quand.",
      "Fini les allers-retours par email ou WhatsApp pour un simple congé.",
    ],
  },
  {
    icon: BarChart3,
    label: "Intelligence RH",
    title: "Décisions basées sur les faits.",
    desc: "Taux de présence, heures travaillées, tendances d'absences. Transformez vos données RH en KPIs actionnables.",
    href: "/signup",
    cta: "Voir les analytics",
    details: [
      "Un dashboard qui résume l'essentiel dès la connexion : effectifs, créneaux planifiés, demandes en attente.",
      "Le pointage par QR code capture les présences réelles, à comparer avec le planning prévu.",
      "Repérez en un coup d'œil les périodes sans planning ou les demandes qui traînent.",
      "Base posée pour des rapports plus poussés au fil des prochaines mises à jour.",
    ],
  },
];

const STEPS = [
  { n: "01", t: "Créez votre espace", d: "Inscription en 30 secondes. Configurez votre organisation et invitez vos collaborateurs par email." },
  { n: "02", t: "Construisez vos plannings", d: "Glissez-déposez les shifts, gérez les absences depuis un seul écran. Les conflits sont détectés automatiquement." },
  { n: "03", t: "Partagez en un clic", d: "Notifiez votre équipe instantanément. Chaque employé consulte son planning en temps réel depuis son téléphone." },
];

const STAT_CARDS = [
  { label: "Mise en place", to: 3, dec: 0, suf: " clics" },
  { label: "Employés gratuits", to: 5, dec: 0, suf: "+" },
  { label: "Disponibilité visée", to: 99.9, dec: 1, suf: "%" },
  { label: "Tarif plan Pro", to: 2, dec: 0, suf: "€/mois" },
];

const BADGES = ["RGPD", "Hébergement France", "AES-256", "TLS 1.3"];

const FOOTER_COLUMNS: { title: string; links: [string, string][] }[] = [
  { title: "Produit", links: [["Fonctionnalités", "#features"], ["Comment ça marche", "#steps"], ["Tarifs", "#tarifs"], ["Sécurité", "#security"]] },
  { title: "Compte", links: [["Connexion", "/login"], ["Inscription", "/signup"], ["Support", "/support"]] },
  { title: "Légal", links: [["Confidentialité", "/confidentialite"], ["CGU", "/cgu"], ["RGPD", "/rgpd"]] },
];

function splitWords(el: Element) {
  const walk = (node: ChildNode) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === 3) {
        const text = child.textContent ?? "";
        const parts = text.split(/(\s+)/).filter((p) => p.length > 0);
        const frag = document.createDocumentFragment();
        parts.forEach((part) => {
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
          } else {
            const span = document.createElement("span");
            span.className = "w";
            span.textContent = part;
            frag.appendChild(span);
          }
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1 && (child as Element).tagName !== "BR") {
        walk(child);
      }
    });
  };
  walk(el);
}

function VisionGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);

  useEffect(() => {
    let phi = 0;
    let width = 0;
    const onResize = () => {
      if (canvasRef.current) width = canvasRef.current.offsetWidth;
    };
    window.addEventListener("resize", onResize);
    onResize();

    const globe = createGlobe(canvasRef.current as HTMLCanvasElement, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.32,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 14000,
      mapBrightness: 5,
      baseColor: [0.22, 0.24, 0.18],
      markerColor: [0.706, 1, 0.224],
      glowColor: [0.22, 0.26, 0.14],
      markers: [
        { location: [48.8566, 2.3522], size: 0.06 },
        { location: [40.7128, -74.006], size: 0.06 },
        { location: [35.6762, 139.6503], size: 0.06 },
        { location: [-23.5505, -46.6333], size: 0.06 },
        { location: [6.5244, 3.3792], size: 0.06 },
        { location: [-33.8688, 151.2093], size: 0.06 },
      ],
    });

    let rafId: number;
    const loop = () => {
      if (pointerInteracting.current === null) phi += 0.0045;
      globe.update({ phi: phi + pointerInteractionMovement.current, width: width * 2, height: width * 2 });
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={(e) => {
        pointerInteracting.current = e.clientX - pointerInteractionMovement.current * 200;
        if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
      }}
      onPointerUp={() => {
        pointerInteracting.current = null;
        if (canvasRef.current) canvasRef.current.style.cursor = "grab";
      }}
      onPointerOut={() => {
        pointerInteracting.current = null;
        if (canvasRef.current) canvasRef.current.style.cursor = "grab";
      }}
      onMouseMove={(e) => {
        if (pointerInteracting.current !== null) {
          const delta = e.clientX - pointerInteracting.current;
          pointerInteractionMovement.current = delta / 200;
        }
      }}
      onTouchMove={(e) => {
        if (pointerInteracting.current !== null && e.touches[0]) {
          const delta = e.touches[0].clientX - pointerInteracting.current;
          pointerInteractionMovement.current = delta / 200;
        }
      }}
      style={{ width: "100%", height: "100%", cursor: "grab", contain: "layout paint size" }}
    />
  );
}

export default function Home() {
  const [me, setMe] = useState<{ email?: string; role?: string } | null>(null);
  const [heroEmail, setHeroEmail] = useState("");
  const [heroSubmitting, setHeroSubmitting] = useState(false);
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  const [activePanel, setActivePanel] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeFeature === null) return;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") setActiveFeature(null); };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeFeature]);

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

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      root.querySelectorAll(".split").forEach(splitWords);

      // Decorative flicker-square fields
      root.querySelectorAll<HTMLElement>(".sq-field").forEach((field) => {
        const count = parseInt(field.dataset.count ?? "16", 10);
        for (let i = 0; i < count; i++) {
          const sq = document.createElement("div");
          sq.className = "grid-sq";
          const col = Math.floor(Math.random() * 20);
          const row = Math.floor(Math.random() * 5);
          sq.style.left = `${col * 48 - 10}px`;
          sq.style.top = `${row * 48 + 6}px`;
          sq.style.width = "46px";
          sq.style.height = "46px";
          field.appendChild(sq);
          gsap.to(sq, {
            opacity: 1,
            duration: 1.2,
            yoyo: true,
            repeat: -1,
            delay: Math.random() * 4,
            repeatDelay: Math.random() * 3,
          });
        }
      });

      // Hero glass squares
      const heroGlass = root.querySelector<HTMLElement>("#heroGlass");
      if (heroGlass) {
        const positions = [
          [6, 68], [10, 76], [16, 68], [84, 60], [88, 70], [80, 78], [50, 78], [54, 82],
        ];
        positions.forEach(([x, y], i) => {
          const sq = document.createElement("div");
          sq.className = "glass";
          const size = x > 40 && x < 60 ? "clamp(26px,3.2vw,42px)" : "clamp(32px,5vw,66px)";
          sq.style.left = `${x}%`;
          sq.style.top = `${y}%`;
          sq.style.width = size;
          sq.style.aspectRatio = "1";
          heroGlass.appendChild(sq);
          gsap.to(sq, {
            opacity: 0.15,
            duration: 0.9,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut",
            delay: i * 0.3 + Math.random() * 2,
            repeatDelay: 1 + Math.random() * 3,
          });
        });
      }

      // Simple intro reveal — doux et lent, dans l'esprit de la vidéo
      gsap.timeline()
        .fromTo(".nav", { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 1.1, ease: "sine.out" })
        .fromTo("#heroTitle .w, #heroCap .w", { opacity: 0, y: 20, filter: "blur(12px)" },
          { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.4, stagger: 0.09, ease: "sine.out" }, "-=0.7")
        .fromTo("#heroForm", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.9, ease: "sine.out" }, "-=0.8")
        .fromTo(".glass", { opacity: 0, scale: 0.7 }, { opacity: 0.15, scale: 1, duration: 1, stagger: { each: 0.06, from: "random" }, ease: "sine.out" }, "-=1");

      // Word reveals for the rest of the split elements (stats/loop/cta headings)
      root.querySelectorAll<HTMLElement>(".stats .split, .loop .split").forEach((el) => {
        gsap.from(el.querySelectorAll(".w"), {
          opacity: 0, y: 20, filter: "blur(8px)", duration: 1.2, stagger: 0.08, ease: "sine.out",
          scrollTrigger: { trigger: el, start: "top 82%" },
        });
      });

      root.querySelectorAll<HTMLElement>(".reveal").forEach((el) => {
        gsap.from(el, {
          opacity: 0, y: 14, duration: 1.1, ease: "sine.out",
          scrollTrigger: { trigger: el, start: "top 87%" },
        });
      });

      // Hero video background reacts to scroll
      gsap.to("#heroVideoBg", {
        opacity: 0.15,
        scale: 1.08,
        ease: "none",
        scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: 0.8 },
      });

      const statsSection = root.querySelector<HTMLElement>("#stats");
      const cardEls = Array.from(root.querySelectorAll<HTMLElement>(".card"));
      const glow = root.querySelector<HTMLElement>("#statsGlow");
      const rise = root.querySelector<HTMLElement>("#statsRise");

      const setCounters = (p: number) => {
        cardEls.forEach((el) => {
          const to = parseFloat(el.dataset.to ?? "0");
          const dec = parseInt(el.dataset.dec ?? "0", 10);
          const suf = el.dataset.suf ?? "";
          const b = el.querySelector("b");
          if (b) b.textContent = (to * p).toFixed(dec) + suf;
        });
      };

      const mm = gsap.matchMedia();

      mm.add("(min-width: 901px)", () => {
        gsap.from(cardEls, {
          y: 40, opacity: 0, stagger: 0.08, duration: 0.6, ease: "power3.out",
          scrollTrigger: { trigger: ".cards", start: "top 70%" },
        });

        if (statsSection) {
          const proxy = { p: 0 };
          gsap.timeline({
            scrollTrigger: { trigger: statsSection, start: "top top", end: "+=120%", pin: true, scrub: 1 },
          })
            .to(proxy, { p: 1, ease: "none", onUpdate: () => setCounters(proxy.p) }, 0)
            .to(glow, { scale: 1.2, opacity: 0.4, ease: "none" }, 0)
            .to(rise, { yPercent: -70, ease: "none" }, 0);
        }

        return () => {};
      });

      mm.add("(max-width: 900px)", () => {
        gsap.from(cardEls, {
          y: 30, opacity: 0, stagger: 0.08, duration: 0.6, ease: "power3.out",
          scrollTrigger: { trigger: ".cards", start: "top 85%" },
        });

        const proxy = { p: 0 };
        gsap.to(proxy, {
          p: 1, duration: 2, ease: "power2.out", onUpdate: () => setCounters(proxy.p),
          scrollTrigger: { trigger: ".cards", start: "top 80%", once: true },
        });

        gsap.to(rise, {
          yPercent: -40, ease: "none",
          scrollTrigger: { trigger: statsSection, start: "top bottom", end: "bottom top", scrub: true },
        });

        return () => {};
      });

      // Loop decorative blob drift
      gsap.to(".loop-blob", {
        x: 40, ease: "none",
        scrollTrigger: { trigger: "#steps", start: "top bottom", end: "bottom top", scrub: 0.8 },
      });

      // Footer logomark animation
      const footer = root.querySelector<HTMLElement>("#footer");
      if (footer) {
        const dots = footer.querySelectorAll(".fdot");
        const tl = gsap.timeline({ scrollTrigger: { trigger: footer, start: "top 92%" } });
        tl.to(dots, { y: -8, duration: 0.25, stagger: 0.08, yoyo: true, repeat: 3, ease: "sine.inOut" })
          .to(dots, { attr: { cx: 40 }, duration: 0.45, ease: "power3.inOut" })
          .to([dots[0], dots[2]], { opacity: 0, duration: 0.1 }, "<")
          .to("#fMark", { strokeDashoffset: 0, duration: 0.6, ease: "power3.out" }, "-=0.05")
          .to(dots[1], { attr: { r: 5.5 }, duration: 0.4, ease: "back.out(3)" }, "<")
          .to("#fRing", { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut" }, "-=0.3");
      }

      ScrollTrigger.refresh();
    }, root);

    return () => ctx.revert();
  }, []);

  const panelActivate = (i: number) => setActivePanel(i);

  return (
    <SmoothScroll>
    <div ref={rootRef} className="ptl-root min-h-screen bg-[#060606] text-white antialiased overflow-x-hidden">

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

      {/* NAV */}
      <nav className="nav" style={{ fontFamily: "var(--font-instrument-sans)" }}>
        <Link href="#hero" className="brand">Shiftly</Link>
        <div className="nav-links">
          {NAV_LINKS.map(([label, href]) => (
            <a key={label} href={href}>{label}</a>
          ))}
          <Link href={me ? "/dashboard" : "/signup"} className="pill btn">
            {me ? "Dashboard" : "Commencer"}
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section id="hero" className="hero" style={{ fontFamily: "var(--font-instrument-sans)" }}>
        <div id="heroVideoBg" className="hero-video-bg">
          <video autoPlay loop muted playsInline>
            <source src="/hero-painting.webm" type="video/webm" />
            <source src="/hero-painting.mp4" type="video/mp4" />
          </video>
          <div className="hero-video-overlay" />
        </div>

        <div id="heroGlass" className="hero-glass" />

        <h1 id="heroTitle" className="split">
          Le planning qui tourne,<br />même sans <em>vous.</em>
        </h1>
        <p id="heroCap" className="cap split">
          Plannings, congés et pointage —<br />zéro tableur, zéro stress.
        </p>

        <form id="heroForm" onSubmit={handleHeroSubmit} className="hero-form">
          <input
            type="email"
            required
            value={heroEmail}
            onChange={(e) => setHeroEmail(e.target.value)}
            placeholder="Votre email pro"
          />
          <button type="submit" disabled={heroSubmitting} aria-label="Commencer">
            <ArrowRight size={18} />
          </button>
        </form>
      </section>

      {/* STATS */}
      <section id="stats" className="stats">
        <div className="sq-field" data-count="18" />
        <div id="statsGlow" className="stats-glow" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img id="statsRise" src="/stats-column.png" alt="" aria-hidden="true" className="stats-rise" />

        <div className="stats-inner">
          <span className="pill reveal">Pensé pour les petites équipes</span>
          <h2 className="h2 split">Un planning fiable,<br />construit en quelques clics.</h2>

          <div className="cards">
            {STAT_CARDS.map((c) => (
              <div key={c.label} className="card" data-to={c.to} data-dec={c.dec} data-suf={c.suf}>
                <svg className="card-laurel card-laurel--tl" viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
                  <path d="M12 22C12 22 4 18 4 10C4 6 7 3 12 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  <ellipse cx="7" cy="14" rx="2" ry="1" transform="rotate(-30 7 14)" fill="currentColor" />
                  <ellipse cx="6" cy="10" rx="2" ry="1" transform="rotate(-50 6 10)" fill="currentColor" />
                  <ellipse cx="8" cy="6" rx="2" ry="1" transform="rotate(-70 8 6)" fill="currentColor" />
                </svg>
                <svg className="card-laurel card-laurel--br" viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
                  <path d="M12 22C12 22 4 18 4 10C4 6 7 3 12 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  <ellipse cx="7" cy="14" rx="2" ry="1" transform="rotate(-30 7 14)" fill="currentColor" />
                  <ellipse cx="6" cy="10" rx="2" ry="1" transform="rotate(-50 6 10)" fill="currentColor" />
                  <ellipse cx="8" cy="6" rx="2" ry="1" transform="rotate(-70 8 6)" fill="currentColor" />
                </svg>
                <span className="card-label">{c.label}</span>
                <b>0{c.suf.trim().startsWith("%") || c.suf.trim().startsWith("€") ? "" : ""}</b>
              </div>
            ))}
          </div>
          <div className="cards-shadow" />

          <div className="badges">
            {BADGES.map((b) => (
              <span key={b} className="badge">{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* LOOP — accordéon "comment ça marche" */}
      <section id="steps" className="loop">
        <div className="loop-blob" />
        <div className="loop-head">
          <span className="pill reveal">Comment ça marche</span>
          <h2 className="h2 split">Trois étapes,<br />zéro friction.</h2>
        </div>

        <div className="track">
          {STEPS.map((step, i) => (
            <div
              key={step.n}
              tabIndex={0}
              className={`panel ${activePanel === i ? "is-active" : ""}`}
              onMouseEnter={() => panelActivate(i)}
              onFocus={() => panelActivate(i)}
              onClick={() => panelActivate(i)}
              aria-label={`Étape ${step.n} : ${step.t}`}
            >
              <div className="panel-in">
                <span className={`num num-${i}`}>{step.n}</span>
                <div className="step">
                  <h3>{step.t}</h3>
                  <p>{step.d}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SPOTLIGHT */}
      <section className="pb-8 sm:pb-12 pt-8 sm:pt-12">

        <div className="px-4 sm:px-6 max-w-7xl mx-auto mt-5">
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }} viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden border border-white/8 bg-[#090909] grid grid-cols-1 md:grid-cols-2 min-h-[480px]"
          >
            <div className="p-10 sm:p-14 flex flex-col justify-between relative z-10">
              <div>
                <p className="font-mono text-xs text-[#B4FF39] mb-8">[ gestion d&apos;équipe ]</p>
                <h2 className="text-5xl sm:text-6xl font-bold tracking-tight text-white leading-[0.9] mb-6">
                  Planifiez.<br />Guidez.<br />Exécutez.
                </h2>
                <p className="text-white/40 text-base font-medium leading-relaxed max-w-xs">
                  Construisez vos plannings hebdomadaires en quelques clics. Les conflits sont détectés automatiquement, votre équipe notifiée instantanément.
                </p>
              </div>
              <Link href="/signup" className="mt-10 w-fit h-12 px-8 rounded-full bg-white text-black font-bold text-sm hover:scale-105 transition-all inline-flex items-center gap-2">
                Démarrer gratuitement <ArrowRight size={14} />
              </Link>
            </div>

            <div className="relative min-h-[300px] md:min-h-0 bg-[#0a0a0a]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/spotlight-wreath.png" alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
              <div className="absolute inset-0 bg-black/10" />
              <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#090909] to-transparent" />
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
          <p className="font-mono text-xs text-[#B4FF39] mb-4">[ fonctionnalités ]</p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
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
              <span className="font-mono text-2xl text-gray-600 group-hover:text-[#B4FF39] transition-colors">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-[#B4FF39] transition-colors">
                  <f.icon size={18} />
                </div>
                <div>
                  <p className="font-mono text-[10px] text-gray-500 mb-1">{f.label}</p>
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-tight">{f.title}</h3>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-md">{f.desc}</p>
              <button
                type="button"
                onClick={() => setActiveFeature(i)}
                className="md:justify-self-end inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 group-hover:text-[#B4FF39] transition-colors shrink-0"
              >
                {f.cta} <ArrowRight size={13} />
              </button>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {activeFeature !== null && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              onClick={() => setActiveFeature(null)}
            >
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.97 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-lg border border-white/10 bg-black p-8 sm:p-10"
              >
                <button
                  type="button"
                  onClick={() => setActiveFeature(null)}
                  aria-label="Fermer"
                  className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-colors"
                >
                  <X size={16} />
                </button>
                <p className="font-mono text-[10px] text-white/40 mb-1.5">{FEATURES[activeFeature].label}</p>
                <h3 className="text-2xl font-bold tracking-tight text-white mb-3">{FEATURES[activeFeature].title}</h3>
                <p className="text-white/40 text-sm leading-relaxed mb-6">{FEATURES[activeFeature].desc}</p>
                <ul className="space-y-3 mb-8">
                  {FEATURES[activeFeature].details.map((d, di) => (
                    <li key={di} className="flex items-start gap-3 text-sm text-white/60 leading-relaxed">
                      <span className="text-white/20 shrink-0">—</span>
                      {d}
                    </li>
                  ))}
                </ul>
                <Link href={FEATURES[activeFeature].href} className="w-full h-12 bg-white text-black font-bold text-sm hover:bg-white/90 transition-all inline-flex items-center justify-center gap-2">
                  Commencer gratuitement <ArrowRight size={14} />
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}
          className="relative rounded-[28px] bg-[#090909] border border-white/8 p-10 sm:p-16 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-[#B4FF39]/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <ShieldCheck size={32} className="text-[#B4FF39] mb-6" />
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

      {/* TARIFS */}
      <section id="tarifs" className="py-24 sm:py-36 px-4 sm:px-6 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <p className="font-mono text-xs text-[#B4FF39] mb-4">[ tarifs ]</p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
            Un prix simple. Zéro surprise.
          </h2>
          <p className="mt-5 text-gray-400 text-base max-w-md mx-auto">
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
                plan.highlighted ? "bg-[#B4FF39]/[0.07] border border-[#B4FF39]/30" : "bg-white/5 border border-white/10"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-8 rounded-full bg-[#B4FF39] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-black">
                  Recommandé
                </span>
              )}
              <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
              <p className="text-gray-400 text-sm mb-6">{plan.desc}</p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-bold tracking-tight text-white">{plan.price}</span>
                {plan.period && <span className="text-gray-400 text-sm">{plan.period}</span>}
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gray-300">
                    <Check size={15} className="text-[#B4FF39] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="w-full h-12 rounded-full bg-[#B4FF39] text-black font-bold text-sm inline-flex items-center justify-center gap-2 transition-all hover:bg-[#a3ec2e]">
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
          <p className="font-mono text-xs text-[#B4FF39] mb-4">[ notre histoire ]</p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
            Un planning Excel de trop.
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <svg viewBox="0 0 48 48" width="44" height="44" fill="none" className="mx-auto mb-10 text-[#B4FF39]" aria-hidden="true">
            <path d="M24 44C12 40 6 30 8 20C9 14 13 10 18 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M24 44C36 40 42 30 40 20C39 14 35 10 30 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <g fill="currentColor">
              <ellipse cx="10" cy="32" rx="2.2" ry="1.1" transform="rotate(30 10 32)" />
              <ellipse cx="9" cy="25" rx="2.2" ry="1.1" transform="rotate(10 9 25)" />
              <ellipse cx="11" cy="18" rx="2.2" ry="1.1" transform="rotate(-20 11 18)" />
              <ellipse cx="16" cy="12" rx="2.2" ry="1.1" transform="rotate(-45 16 12)" />
              <ellipse cx="38" cy="32" rx="2.2" ry="1.1" transform="rotate(-30 38 32)" />
              <ellipse cx="39" cy="25" rx="2.2" ry="1.1" transform="rotate(-10 39 25)" />
              <ellipse cx="37" cy="18" rx="2.2" ry="1.1" transform="rotate(20 37 18)" />
              <ellipse cx="32" cy="12" rx="2.2" ry="1.1" transform="rotate(45 32 12)" />
            </g>
          </svg>

          <p
            className="italic text-2xl sm:text-3xl text-white leading-snug mb-8"
            style={{ fontFamily: "var(--font-instrument-serif)" }}
          >
            Shiftly est né d&apos;un constat simple : dans beaucoup de commerces et de restaurants, le planning se
            fait encore sur un tableur envoyé par mail ou par groupe WhatsApp.
          </p>

          <p className="text-gray-400 text-base leading-relaxed mb-4 max-w-xl mx-auto">
            Les conflits d&apos;horaires se découvrent trop tard, personne ne sait vraiment qui travaille quand, et
            les managers passent plus de temps à corriger des erreurs qu&apos;à gérer leur équipe.
          </p>
          <p className="text-gray-400 text-base leading-relaxed mb-12 max-w-xl mx-auto">
            J&apos;ai voulu construire l&apos;outil que ces équipes méritent : simple, clair, et qui prévient les
            problèmes avant qu&apos;ils n&apos;arrivent. Shiftly est développé en solo, avec l&apos;objectif de
            rester au plus près des managers et des employés qui l&apos;utilisent au quotidien.
          </p>

          <div className="flex flex-col items-center gap-1.5 pt-8 border-t border-white/10">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" className="text-[#B4FF39] mb-1" aria-hidden="true">
              <path d="M12 22C12 22 4 18 4 10C4 6 7 3 12 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              <ellipse cx="7" cy="14" rx="2" ry="1" transform="rotate(-30 7 14)" fill="currentColor" />
              <ellipse cx="6" cy="10" rx="2" ry="1" transform="rotate(-50 6 10)" fill="currentColor" />
              <ellipse cx="8" cy="6" rx="2" ry="1" transform="rotate(-70 8 6)" fill="currentColor" />
            </svg>
            <p className="italic text-white text-base" style={{ fontFamily: "var(--font-instrument-serif)" }}>Sayeh Ahmed</p>
            <p className="text-gray-500 text-xs font-medium">Fondateur &amp; Développeur</p>
            <a href="https://www.sayehahmed.com" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[#B4FF39] hover:text-[#B4FF39]/80 transition-colors mt-1">
              sayehahmed.com
            </a>
          </div>
        </motion.div>
      </section>

      {/* NOTRE VISION */}
      <section className="py-24 sm:py-36 px-4 sm:px-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}
          className="mb-14 text-center"
        >
          <p className="font-mono text-xs text-[#B4FF39] mb-4">[ notre vision ]</p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
            Un problème mondial,<br />pas seulement régional.
          </h2>
          <p className="mt-6 text-gray-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Le planning sur tableur, les erreurs d&apos;horaires, les équipes mal coordonnées — ce n&apos;est pas
            qu&apos;un problème français. Partout, de petites équipes perdent du temps sur les mêmes outils
            dépassés. Notre ambition : que Shiftly règle ce problème bien au-delà de nos frontières.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }}
          className="relative mx-auto aspect-square w-full max-w-[460px]"
        >
          <VisionGlobe />
        </motion.div>
      </section>

      {/* CTA FINAL */}
      <section id="security" className="py-24 sm:py-36 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(59,130,246,0.08),transparent_65%)] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#B4FF39]/6 blur-[160px] rounded-full pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }} whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }} viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center relative z-10"
        >
          <p className="font-mono text-xs text-[#B4FF39] mb-6">[ commencer ]</p>
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight leading-[0.95] mb-6" style={{ fontFamily: "var(--font-instrument-sans)" }}>
            <span className="bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
              Fini les tableurs.<br />
            </span>
            <span className="bg-gradient-to-b from-[#B4FF39] to-lime-300 bg-clip-text text-transparent">
              Bienvenue sur Shiftly.
            </span>
          </h2>
          <p className="text-gray-400 text-lg font-medium mb-12 max-w-xl mx-auto leading-relaxed">
            Rejoignez les managers qui ont repris le contrôle de leur temps. Gratuit pour commencer, sans engagement.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="h-14 px-10 rounded-full bg-[#B4FF39] text-black font-bold text-sm hover:scale-105 hover:shadow-[0_0_60px_-10px_rgba(180,255,57,0.5)] transition-all inline-flex items-center gap-3">
              Commencer gratuitement <ArrowRight size={15} />
            </Link>
            <Link href="/login" className="h-14 px-10 rounded-full bg-white/5 border border-white/10 font-bold text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-all inline-flex items-center">
              J&apos;ai déjà un compte
            </Link>
          </div>
          <p className="mt-8 text-gray-500 text-xs font-medium">Aucune CB requise · Setup en 2 min · RGPD</p>
        </motion.div>
      </section>

      {/* FOOTER — lime, animation logo */}
      <footer id="footer" className="ptl-footer">
        <svg className="f-logo" viewBox="0 0 80 80" aria-label="Shiftly">
          <circle id="fRing" cx="40" cy="40" r="37" fill="none" stroke="#111" strokeWidth="2.4" strokeDasharray="233" strokeDashoffset="233" transform="rotate(-90 40 40)" />
          <circle className="fdot" cx="22" cy="40" r="4.5" fill="#111" />
          <circle className="fdot" cx="40" cy="40" r="4.5" fill="#111" />
          <circle className="fdot" cx="58" cy="40" r="4.5" fill="#111" />
          <path id="fMark" d="M28 44 40 24 52 44" fill="none" stroke="#111" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="56" strokeDashoffset="56" />
        </svg>

        <div className="f-columns">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="f-col">
              <p className="f-col-title">{col.title}</p>
              <ul>
                {col.links.map(([label, href]) => (
                  <li key={label}><a href={href}>{label}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="f-social">
          <a href="https://x.com/SHIFTLYApp" target="_blank" rel="noopener noreferrer" aria-label="X">𝕏</a>
        </div>

        <p className="f-copy">© 2026 Shiftly. Tous droits réservés. Made in France.</p>
      </footer>

      <style>{`
        .ptl-root { position: relative; }
        .nav { position: fixed; top: 22px; left: 50%; transform: translateX(-50%); z-index: 50; display: flex; align-items: center; gap: 36px; padding: 6px 6px 6px 18px; border-radius: 999px; background: rgba(10,10,10,.75); border: 1px solid rgba(255,255,255,.08); backdrop-filter: blur(10px); }
        .nav .brand { font-size: 18px; font-weight: 600; letter-spacing: -.02em; color: #fff; }
        .nav-links { display: flex; align-items: center; gap: 28px; font-size: 13px; font-weight: 500; letter-spacing: .04em; text-transform: uppercase; color: rgba(255,255,255,.7); }
        .nav-links a:not(.pill) { transition: color .2s; }
        .nav-links a:not(.pill):hover { color: #fff; }
        .pill.btn { display: inline-flex; align-items: center; height: 38px; padding: 0 18px; border-radius: 999px; background: #B4FF39; color: #0a0a0a; font-weight: 700; letter-spacing: 0; text-transform: none; font-size: 13px; transition: transform .25s; }
        .pill.btn:hover { transform: translateY(-1px); }

        .hero { position: relative; min-height: 100vh; padding: 160px 20px 60px; display: flex; flex-direction: column; align-items: center; text-align: center; overflow: hidden; background: #060606; }
        .hero-video-bg { position: absolute; inset: 0; z-index: 0; overflow: hidden; transform-origin: 50% 50%; }
        .hero-video-bg video { width: 100%; height: 100%; object-fit: cover; }
        .hero-video-overlay { position: absolute; inset: 0; background: rgba(6,6,6,.78); }
        .hero-glass { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
        .glass { position: absolute; border-radius: 12px; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.18); backdrop-filter: blur(10px) saturate(1.2); box-shadow: inset 0 1px 0 rgba(255,255,255,.25); opacity: 0; }
        h1#heroTitle { position: relative; z-index: 3; font: 500 clamp(32px,6vw,72px)/1.06 var(--font-instrument-sans); letter-spacing: -.03em; max-width: 900px; }
        h1#heroTitle em { color: #B4FF39; font-style: italic; font-weight: 600; }
        .cap { position: relative; z-index: 3; margin-top: 22px; font-size: clamp(14px,1.6vw,18px); line-height: 1.4; color: rgba(255,255,255,.55); max-width: 480px; }
        .hero-form { position: relative; z-index: 3; margin-top: 30px; display: inline-flex; align-items: center; gap: 6px; padding: 6px; border-radius: 999px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); }
        .hero-form input { height: 40px; padding: 0 16px; border-radius: 999px; border: none; background: transparent; color: #fff; font-size: 14px; outline: none; width: 220px; }
        .hero-form input::placeholder { color: rgba(255,255,255,.4); }
        .hero-form button { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 999px; background: #B4FF39; color: #0a0a0a; transition: transform .2s; }
        .hero-form button:hover { transform: scale(1.06); }

        .split .w { display: inline-block; will-change: transform, filter, opacity; }

        .pill { display: inline-flex; align-items: center; font-size: 11px; font-weight: 600; padding: 6px 12px; border-radius: 999px; background: rgba(180,255,57,.12); color: #B4FF39; letter-spacing: .02em; }
        .h2 { font-size: clamp(26px,3.6vw,46px); font-weight: 500; letter-spacing: -.02em; line-height: 1.12; text-align: center; }

        .stats, .loop { position: relative; overflow: hidden; }
        .stats { padding: 100px 20px 80px; }
        .sq-field { position: absolute; inset: 0 0 auto 0; height: 42%; z-index: 0; pointer-events: none; -webkit-mask-image: linear-gradient(#000, transparent); mask-image: linear-gradient(#000, transparent); }
        .grid-sq { position: absolute; border: 1px solid rgba(255,255,255,.06); border-radius: 10px; opacity: 0; pointer-events: none; }
        .stats-glow { position: absolute; left: 50%; top: 40%; translate: -50% -50%; width: 420px; height: 420px; border-radius: 999px; background: radial-gradient(closest-side, rgba(180,255,57,.22), transparent); filter: blur(30px); opacity: .15; transform: scale(.6); pointer-events: none; z-index: 0; }
        .stats-rise { position: absolute; left: 50%; bottom: -6%; transform: translateX(-50%) translateY(70%); width: min(260px,38vw); opacity: .55; pointer-events: none; z-index: 1; }
        .stats-inner { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 22px; max-width: 980px; margin: 0 auto; }
        .cards { position: relative; z-index: 2; display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; width: 100%; margin-top: 8px; }
        .card { position: relative; height: 140px; padding: 18px 20px; background: #B4FF39; display: flex; flex-direction: column; justify-content: space-between; clip-path: polygon(16px 0, calc(100% - 16px) 0, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0 calc(100% - 16px), 0 16px); }
        .card-laurel { position: absolute; color: rgba(10,12,2,.35); pointer-events: none; }
        .card-laurel--tl { top: 10px; left: 10px; }
        .card-laurel--br { bottom: 10px; right: 10px; transform: rotate(180deg); }
        .card-label { font-size: 11px; font-weight: 600; color: #1b2308; }
        .card b { font-size: clamp(26px,3vw,38px); font-weight: 700; letter-spacing: -.03em; color: #0a0a0a; font-variant-numeric: tabular-nums; }
        .cards-shadow { width: 90%; height: 10px; margin: -14px auto 0; border-radius: 50%; background: radial-gradient(closest-side, rgba(0,0,0,.35), transparent); }
        .badges { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 8px; }
        .badge { font-size: 12px; font-weight: 600; letter-spacing: .02em; color: rgba(255,255,255,.55); background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); padding: 7px 14px; border-radius: 999px; }

        .loop { min-height: 100vh; padding: 110px 0 60px; display: flex; flex-direction: column; }
        .loop-blob { position: absolute; top: 10%; left: -8%; width: 320px; height: 320px; border-radius: 999px; background: radial-gradient(closest-side, rgba(180,255,57,.15), transparent); filter: blur(40px); z-index: 0; }
        .loop-head { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 0 20px; margin-bottom: 48px; }
        .track { position: relative; z-index: 2; flex: 1; display: flex; min-height: 420px; border-top: 1px solid rgba(255,255,255,.1); }
        .panel { position: relative; flex: 0 0 clamp(70px,10vw,140px); border-right: 1px solid rgba(255,255,255,.1); overflow: hidden; cursor: pointer; outline: none; transition: flex-grow 1s cubic-bezier(.16,1,.3,1); display: flex; align-items: flex-end; }
        .panel:last-child { border-right: none; }
        .panel.is-active { flex-grow: 3; cursor: default; }
        .panel-in { display: flex; align-items: flex-end; gap: 24px; padding: 28px; width: max-content; max-width: 100%; }
        .num { font-size: clamp(90px,16vw,220px); font-weight: 700; line-height: .74; letter-spacing: -.04em; color: rgba(255,255,255,.15); }
        .panel.is-active .num { color: #B4FF39; }
        .step { width: min(360px,60vw); opacity: 0; transform: translateX(-16px); filter: blur(6px); transition: opacity .5s, transform .6s, filter .5s; }
        .panel.is-active .step { opacity: 1; transform: none; filter: none; transition: opacity .9s .35s, transform 1.05s .35s cubic-bezier(.16,1,.3,1), filter .9s .35s; }
        .step h3 { font-size: clamp(18px,1.6vw,24px); font-weight: 500; letter-spacing: -.01em; margin-bottom: 10px; color: #fff; }
        .step p { font-size: 14px; line-height: 1.5; color: rgba(255,255,255,.5); }


        .ptl-footer { position: relative; background: #B4FF39; color: #121410; padding: 56px 6vw 28px; display: flex; flex-direction: column; align-items: center; gap: 36px; }
        .f-logo { width: 56px; height: 56px; overflow: visible; }
        .f-columns { display: grid; grid-template-columns: repeat(3, minmax(120px, 170px)); gap: 32px 48px; }
        .f-col-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; opacity: .55; margin-bottom: 14px; }
        .f-col ul { list-style: none; display: flex; flex-direction: column; gap: 9px; }
        .f-col a { font-size: 13px; font-weight: 600; color: #121410; transition: opacity .2s; }
        .f-col a:hover { opacity: .6; }
        .f-social { font-size: 18px; }
        .f-copy { text-align: center; font-size: 11px; opacity: .7; }

        @media (max-width: 900px) {
          .cards { grid-template-columns: repeat(2,1fr); }
          .card { height: 120px; }
        }
        @media (max-width: 760px) {
          .nav { left: 16px; right: 16px; transform: none; justify-content: space-between; }
          .nav-links a:not(.pill) { display: none; }
          .hero { padding-top: 120px; }
          .track { flex-direction: column; min-height: 0; }
          .panel { flex: none; border-right: none; border-bottom: 1px solid rgba(255,255,255,.1); }
          .panel .num { color: #B4FF39; }
          .step { opacity: 1; transform: none; filter: none; width: auto; }
          .f-columns { grid-template-columns: 1fr; gap: 24px; text-align: center; }
        }
      `}</style>
    </div>
    </SmoothScroll>
  );
}
