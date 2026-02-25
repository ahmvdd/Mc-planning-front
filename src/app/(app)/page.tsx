"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { apiFetchClient, getToken } from "@/lib/clientApi";
import { LayoutDashboard, Users, Calendar, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";

// Variantes d'animation pour les parents (Stagger effect)
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

// Variantes pour les éléments individuels
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export default function Home() {
  const [me, setMe] = useState<{ email?: string; role?: string; orgId?: number } | null>(null);
  const [loadingMe, setLoadingMe] = useState(false);

  useEffect(() => {
    if (!getToken()) return;
    setLoadingMe(true);
    apiFetchClient<{ email?: string; role?: string; orgId?: number }>("/auth/me")
      .then((data) => setMe(data))
      .catch(() => setMe(null))
      .finally(() => setLoadingMe(false));
  }, []);

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto px-4 py-8 md:py-12 space-y-10 md:space-y-16 font-sans overflow-x-hidden"
    >
      {/* --- HERO SECTION --- */}
      <motion.header 
        variants={itemVariants}
        className="relative p-6 sm:p-8 md:p-16 rounded-[28px] sm:rounded-[40px] bg-slate-900 text-white overflow-hidden shadow-2xl"
      >
        {/* Cercles décoratifs animés */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-48 h-48 sm:w-72 sm:h-72 md:w-96 md:h-96 bg-indigo-500/20 rounded-full blur-[80px] md:blur-[120px]"
        />
        
        <div className="relative z-10 max-w-3xl space-y-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-medium tracking-wide uppercase"
          >
            <Sparkles className="w-3 h-3 text-indigo-400" />
            Gestion de planning simplifiée
          </motion.div>

          <motion.h1 
            variants={itemVariants}
            className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]"
          >
            Maîtrisez votre <span className="text-indigo-400">organisation.</span>
          </motion.h1>
          
          <motion.p 
            variants={itemVariants}
            className="text-lg md:text-xl text-slate-400 leading-relaxed"
          >
            Centralisez les employés, automatisez les shifts et suivez 
            les demandes en temps réel sur une interface intuitive.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
            {!me ? (
              <>
                <Link
                  href="/signup"
                  className="group flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-600/20"
                >
                  Démarrer maintenant
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/login"
                  className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all border border-slate-700 hover:border-slate-500"
                >
                  Se connecter
                </Link>
              </>
            ) : (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-2xl font-semibold transition-all hover:bg-slate-100 hover:scale-105 active:scale-95 shadow-xl shadow-white/10"
              >
                <LayoutDashboard className="w-5 h-5 text-indigo-600" />
                Accéder au Dashboard
              </Link>
            )}
          </motion.div>
        </div>
      </motion.header>

      {/* --- STATS SECTION (BENTO GRID) --- */}
      <motion.section 
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -5 }}
          className="md:col-span-2 p-8 rounded-[32px] bg-white border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-indigo-200 transition-all"
        >
          {loadingMe ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-slate-100 rounded w-1/4"></div>
              <div className="h-8 bg-slate-100 rounded w-3/4"></div>
            </div>
          ) : me ? (
            <>
              <div>
                <p className="text-sm font-medium text-indigo-600 mb-2">Session active</p>
                <h2 className="text-2xl font-bold text-slate-900 truncate">{me.email}</h2>
                <p className="text-slate-500 mt-1">Rôle: <span className="capitalize font-medium text-slate-700">{me.role}</span> • Org #{me.orgId}</p>
              </div>
              <div className="mt-8">
                <Link href="/requests" className="group flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">
                  Voir les demandes <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 italic text-sm space-y-2">
              <ShieldCheck size={24} className="opacity-20" />
              <p>Aucun utilisateur connecté</p>
            </div>
          )}
        </motion.div>

        {[
          { label: "Employés", value: "+120", icon: <Users className="w-5 h-5 text-indigo-600" /> },
          { label: "Planning", value: "7j/7", icon: <Calendar className="w-5 h-5 text-sky-500" /> },
        ].map((stat, i) => (
          <motion.div 
            key={i} 
            variants={itemVariants}
            whileHover={{ y: -5 }}
            className="p-8 rounded-[32px] bg-slate-50 border border-transparent hover:bg-white hover:border-slate-100 transition-all shadow-sm"
          >
            <div className="p-3 bg-white rounded-2xl w-fit shadow-sm mb-4">
              {stat.icon}
            </div>
            <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </motion.section>

      {/* --- FEATURES --- */}
      <motion.section 
        variants={containerVariants}
        className="grid md:grid-cols-3 gap-8"
      >
        {[
          { title: "Pilotage instantané", desc: "Visualisez les équipes et ajustez les shifts en quelques clics.", icon: "⚡" },
          { title: "Demandes centralisées", desc: "Suivez les congés, documents et validations sans friction.", icon: "📂" },
          { title: "Sécurité & rôles", desc: "Contrôlez les accès selon les profils et les organisations.", icon: "🛡️" },
        ].map((f, i) => (
          <motion.div 
            key={i} 
            variants={itemVariants}
            className="group p-4 rounded-3xl hover:bg-slate-50 transition-colors"
          >
            <div className="text-3xl mb-4 group-hover:rotate-12 transition-transform w-fit">{f.icon}</div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{f.title}</h3>
            <p className="text-slate-600 leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </motion.section>

      {/* --- STEPS --- */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="bg-indigo-50/50 rounded-[40px] p-8 md:p-12 border border-indigo-100/50"
      >
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-slate-900">Démarrer en 3 étapes</h2>
          <p className="text-slate-500 mt-2">Mise en place rapide, sans configuration complexe.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-12">
          {[
            { title: "Organisation", text: "Créez votre compte admin et générez votre espace." },
            { title: "Invitation", text: "Partagez le code d'accès avec vos collaborateurs." },
            { title: "Gestion", text: "Pilotez vos plannings et validez les demandes." },
          ].map((step, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="text-6xl font-black text-indigo-500/10 absolute -top-6 -left-2">
                0{index + 1}
              </div>
              <div className="relative">
                <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{step.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
}