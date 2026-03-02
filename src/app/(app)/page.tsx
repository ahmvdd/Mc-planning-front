"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { apiFetchClient, getToken } from "@/lib/clientApi";
import { 
  LayoutDashboard, Users, Calendar, ShieldCheck, 
  ArrowRight, Sparkles, CheckCircle2, Zap, Layout,
  MousePointer2, BarChart3, Globe, AlignLeft, X
} from "lucide-react";

// Animations fluides et réactives
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } 
  }
};

export default function Home() {
  const [me, setMe] = useState<{ email?: string; role?: string; orgId?: number } | null>(null);
  const [loadingMe, setLoadingMe] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!getToken()) return;
    setLoadingMe(true);
    apiFetchClient<{ email?: string; role?: string; orgId?: number }>("/auth/me")
      .then((data) => setMe(data))
      .catch(() => setMe(null))
      .finally(() => setLoadingMe(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 selection:bg-indigo-500 selection:text-white font-sans overflow-x-hidden">
      
      {/* Overlay de grain pour texture "Premium" (désactivé sur très petit mobile) */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] hidden sm:block"></div>

      {/* --- NAVIGATION RESPONSIVE --- */}
      <nav className="fixed top-0 w-full z-40 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-xl tracking-tighter">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">S</div>
            SHIFTLY
          </div>
          
          {/* Menu bureau */}
          <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Produit</a>
            <a href="#solutions" className="hover:text-indigo-600 transition-colors">Solutions</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Tarifs</a>
          </div>
          
          {/* Actions bureau */}
          <div className="hidden lg:flex items-center gap-4">
            {!me ? (
              <Link href="/login" className="text-sm font-bold hover:text-indigo-600 transition-colors px-4">Connexion</Link>
            ) : null}
            <Link 
              href={me ? "/dashboard" : "/signup"} 
              className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-indigo-600 transition-all shadow-md active:scale-95"
            >
              {me ? "Mon Dashboard" : "Essai gratuit"}
            </Link>
          </div>

          {/* Bouton Menu Mobile */}
          <button className="lg:hidden p-2 text-slate-700" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24}/> : <AlignLeft size={24} />}
          </button>
        </div>

        {/* Menu Mobile Déroulant */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-full left-0 w-full bg-white shadow-xl border-b border-slate-100 p-8 flex flex-col gap-6 lg:hidden"
            >
              <a href="#features" className="font-semibold text-lg text-slate-800" onClick={() => setMobileMenuOpen(false)}>Produit</a>
              <a href="#solutions" className="font-semibold text-lg text-slate-800" onClick={() => setMobileMenuOpen(false)}>Solutions</a>
              <a href="#pricing" className="font-semibold text-lg text-slate-800" onClick={() => setMobileMenuOpen(false)}>Tarifs</a>
              <div className="h-px bg-slate-100 my-2" />
              {!me ? (
                <Link href="/login" className="font-bold text-slate-900" onClick={() => setMobileMenuOpen(false)}>Connexion</Link>
              ) : null}
              <Link 
                href={me ? "/dashboard" : "/signup"} 
                className="w-full text-center bg-indigo-600 text-white p-4 rounded-xl font-bold shadow-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                {me ? "Mon Dashboard" : "Démarrer l'essai gratuit"}
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <motion.main 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="pt-28 pb-16 px-5 sm:px-6 max-w-7xl mx-auto space-y-24 sm:space-y-32"
      >
        {/* --- HERO SECTION --- */}
        <section className="relative grid md:grid-cols-12 gap-10 md:gap-12 items-center">
          
          {/* IMAGE AU DÉBUT (sur mobile elle est en haut, sur bureau elle est à gauche) */}
          <motion.div variants={itemVariants} className="md:col-span-5 relative h-[300px] sm:h-[400px] md:h-[550px] rounded-[32px] sm:rounded-[40px] overflow-hidden shadow-2xl border-4 border-white bg-slate-100">
            <img 
              src="image_0.png" 
              alt="Shiftly Platform Core"
              className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent" />
            
            {/* Tag flottant */}
            <motion.div 
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-6 left-6 bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-white text-xs font-bold flex gap-2 items-center"
            >
              <CheckCircle2 size={16} className="text-emerald-300"/> Plateforme Certifiée
            </motion.div>
          </motion.div>

          <motion.div variants={itemVariants} className="md:col-span-7 space-y-6 sm:space-y-8 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[11px] sm:text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Nouveau : IA Scheduling v2.0
            </div>
            
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9] text-slate-900">
              Pilotez vos <br />
              <span className="text-indigo-600 font-serif italic font-light lowercase">équipes</span> avec brio.
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-slate-500 leading-relaxed max-w-xl">
              La plateforme de gestion nouvelle génération qui transforme vos feuilles Excel complexes en un tableau de bord intuitif et automatisé.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-2">
              <Link
                href="/signup"
                className="group flex items-center justify-center gap-3 bg-indigo-600 text-white px-8 py-4 sm:py-5 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-98"
              >
                Démarrer maintenant
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="flex items-center justify-center gap-3 px-2 sm:px-4">
                <div className="flex -space-x-3.5">
                  {[1,2,3].map(i => (
                    <img key={i} className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-4 border-white object-cover shadow-sm" src={`https://i.pravatar.cc/100?img=${i+15}`} alt="user avatar" />
                  ))}
                </div>
                <p className="text-sm text-slate-400 font-medium leading-tight">
                  <span className="text-slate-900 font-bold">+2k managers</span> <br/> nous font confiance
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* --- BENTO GRID STATS --- */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6 sm:gap-8">
          <motion.div 
            variants={itemVariants}
            className="sm:col-span-2 lg:col-span-8 p-8 sm:p-10 rounded-[32px] sm:rounded-[40px] bg-white border border-slate-200 flex flex-col justify-center relative overflow-hidden group shadow-sm hover:shadow-xl transition-all"
          >
            <div className="relative z-10">
              {loadingMe ? (
                <div className="animate-pulse flex gap-4 items-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-3xl" />
                  <div className="space-y-2.5">
                    <div className="h-4 bg-slate-100 rounded w-24" />
                    <div className="h-9 bg-slate-100 rounded w-48 sm:w-64" />
                  </div>
                </div>
              ) : me ? (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 sm:gap-10">
                  <div className="flex items-center gap-6 sm:gap-8">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-indigo-200">
                      {me.email?.[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-indigo-600 font-black text-xs uppercase tracking-[0.2em] mb-1.5">Session active</p>
                      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">Salut, {me.email?.split('@')[0]} 👋</h2>
                    </div>
                  </div>
                  <Link href="/dashboard" className="w-full md:w-auto text-center bg-slate-900 text-white px-7 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2.5 hover:bg-indigo-600 transition-colors">
                    Dashboard <MousePointer2 size={19} />
                  </Link>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-5">
                  <h3 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Prêt à centraliser ?</h3>
                  <p className="text-slate-500 text-lg max-w-lg leading-relaxed">Rejoignez les entreprises qui ont réduit de 40% leur temps de gestion administrative grâce à Shiftly.</p>
                </div>
              )}
            </div>
            
            {/* Décoration de fond subtile */}
            <div className="absolute top-0 right-0 w-64 h-64 sm:w-80 sm:h-80 bg-indigo-50 rounded-full blur-[80px] -mr-32 -mt-32 opacity-60 transition-opacity" />
          </motion.div>

          <motion.div variants={itemVariants} className="lg:col-span-4 p-8 sm:p-10 rounded-[32px] sm:rounded-[40px] bg-indigo-600 text-white flex flex-col justify-between shadow-xl shadow-indigo-100 relative overflow-hidden">
            <BarChart3 size={36} className="mb-10 sm:mb-12 opacity-50" />
            <div className="relative z-10">
              <p className="text-5xl sm:text-6xl font-black mb-3">100%</p>
              <p className="text-indigo-100 font-medium text-lg">Cloud, Sécurisé & RGPD</p>
            </div>
             <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          </motion.div>
        </section>

        {/* --- DYNAMIC FEATURES --- */}
        <section id="features" className="space-y-16 sm:space-y-20">
          <div className="max-w-3xl text-center mx-auto space-y-4 sm:space-y-6">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-tight">Tout ce qu'il vous faut pour <span className="text-indigo-600">scaler</span>.</h2>
            <p className="text-slate-500 text-lg sm:text-xl leading-relaxed max-w-xl mx-auto">Oubliez les logiciels datant de 2010. Profitez d'une interface pensée pour la rapidité et la collaboration.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            {[
              { 
                title: "Planification Intelligente", 
                desc: "Notre algorithme IA suggère le meilleur planning selon les compétences, disponibilités et règles.", 
                icon: <Zap className="text-amber-500 w-7 h-7" />,
                img: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2420&auto=format&fit=crop"
              },
              { 
                title: "Équipe Ultra-Connectée", 
                desc: "Une application mobile dédiée pour vos employés : pointeuse, demandes de congés et planning live.", 
                icon: <Users className="text-indigo-500 w-7 h-7" />,
                img: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2420&auto=format&fit=crop"
              },
              { 
                title: "Conformité Légale", 
                desc: "Contrats, temps de repos, alertes heures sup. : dormez sur vos deux oreilles.", 
                icon: <ShieldCheck className="text-emerald-500 w-7 h-7" />,
                img: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=2420&auto=format&fit=crop"
              },
            ].map((f, i) => (
              <motion.div 
                key={i} 
                variants={itemVariants}
                className="group bg-white rounded-[32px] p-5 border border-slate-100 hover:border-indigo-100 hover:shadow-2xl transition-all duration-500"
              >
                <div className="h-48 sm:h-56 rounded-2xl overflow-hidden mb-6 sm:mb-8">
                  <img src={f.img} alt={f.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                </div>
                <div className="px-3 pb-3">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-indigo-50 transition-colors">
                      {f.icon}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{f.title}</h3>
                  </div>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* --- CALL TO ACTION --- */}
        <section className="relative rounded-[40px] sm:rounded-[60px] bg-slate-950 p-10 sm:p-16 md:p-24 overflow-hidden">
          {/* Cercles de fond */}
          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-80 h-80 sm:w-96 sm:h-96 bg-indigo-500/20 rounded-full blur-[100px] sm:blur-[120px]" />
          <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-80 h-80 sm:w-96 sm:h-96 bg-sky-500/10 rounded-full blur-[100px] sm:blur-[120px]" />
          
          <div className="relative z-10 text-center max-w-3xl mx-auto space-y-10 sm:space-y-12">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight leading-tight">Prêt à gagner 10h par semaine ?</h2>
            <p className="text-slate-400 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto">L'installation prend moins de 2 minutes. Vos employés vont adorer la simplicité de l'application.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-5 pt-3">
              <Link href="/signup" className="w-full sm:w-auto px-10 py-5 bg-white text-slate-950 rounded-2xl font-black text-lg hover:bg-indigo-500 hover:text-white transition-all scale-100 sm:scale-105 shadow-2xl active:scale-98">
                Démarrer l'essai gratuit
              </Link>
              <button className="w-full sm:w-auto px-10 py-5 bg-white/5 text-white rounded-2xl font-bold border border-white/10 hover:bg-white/10 transition-all text-lg">
                Réserver une démo
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 pt-10 sm:pt-12 border-t border-white/10">
               <div className="flex items-center gap-2.5 text-white/50 text-sm font-medium"><Globe size={17}/> Multilingue (FR, EN, ES)</div>
               <div className="flex items-center gap-2.5 text-white/50 text-sm font-medium"><CheckCircle2 size={17}/> RGPD Friendly</div>
               <div className="flex items-center gap-2.5 text-white/50 text-sm font-medium"><Zap size={17}/> Support 7j/7</div>
            </div>
          </div>
        </section>

        {/* --- FOOTER RESPONSIVE --- */}
        <footer className="pt-16 sm:pt-20 border-t border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-10 mb-16 sm:mb-20">
            <div className="sm:col-span-2 md:col-span-2 space-y-6">
              <div className="flex items-center gap-2.5 font-black text-2xl sm:text-3xl tracking-tighter text-slate-900">
                <div className="w-10 h-10 sm:w-11 sm:h-11 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">S</div>
                SHIFTLY
              </div>
              <p className="text-slate-500 max-w-sm text-base leading-relaxed">La solution complète pour la gestion des forces de travail modernes. Conçue pour les entreprises qui bougent vite.</p>
            </div>
            <div className="space-y-4 sm:space-y-5">
              <h4 className="font-bold text-slate-900 text-sm uppercase tracking-widest">Liens</h4>
              <ul className="space-y-2.5 sm:space-y-3 text-slate-500 text-sm sm:text-base font-medium">
                <li><a href="#" className="hover:text-indigo-600">Fonctionnalités</a></li>
                <li><a href="#" className="hover:text-indigo-600">Tarification</a></li>
                <li><a href="#" className="hover:text-indigo-600">Sécurité</a></li>
              </ul>
            </div>
            <div className="space-y-4 sm:space-y-5">
              <h4 className="font-bold text-slate-900 text-sm uppercase tracking-widest">Support</h4>
              <ul className="space-y-2.5 sm:space-y-3 text-slate-500 text-sm sm:text-base font-medium">
                <li><a href="#" className="hover:text-indigo-600">Centre d'aide</a></li>
                <li><a href="#" className="hover:text-indigo-600">Contact</a></li>
                <li><a href="#" className="hover:text-indigo-600">API</a></li>
              </ul>
            </div>
          </div>
          <div className="pb-10 flex flex-col sm:flex-row justify-between items-center gap-6 text-slate-400 text-xs sm:text-sm font-medium border-t border-slate-100 pt-8">
            <p>© 2026 SHIFTLY App. All rights reserved. <span className="hidden sm:inline">Made in France.</span></p>
            <div className="flex gap-6 sm:gap-8">
              <a href="#" className="hover:text-slate-900 transition-colors">Confidentialité</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Termes</a>
            </div>
          </div>
        </footer>
      </motion.main>
    </div>
  );
}