"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const QUOTES = [
  { text: "La clarté, c'est le vrai luxe du management.", author: "Shiftly" },
  { text: "Un planning sans conflit, c'est une équipe qui respire.", author: "Shiftly" },
  { text: "Le temps de votre équipe est votre actif le plus précieux.", author: "Shiftly" },
  { text: "Planifier, c'est donner à chacun la liberté de s'organiser.", author: "Shiftly" },
];

export function AuthQuote() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % QUOTES.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const quote = QUOTES[index];

  return (
    <div className="relative min-h-[140px]">
      <AnimatePresence mode="wait">
        <motion.blockquote
          key={index}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-sm"
        >
          <p
            className="text-3xl xl:text-4xl font-bold text-white leading-[1.1] mb-6 italic"
            style={{ fontFamily: "var(--font-instrument-serif)" }}
          >
            &ldquo;{quote.text}&rdquo;
          </p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs font-bold text-white">
              S
            </div>
            <div>
              <p className="text-white text-sm font-semibold">{quote.author}</p>
              <p className="text-white/40 text-xs">Gestion d&apos;équipe simplifiée</p>
            </div>
          </div>
          {/* Progress dots */}
          <div className="flex gap-1.5 mt-6">
            {QUOTES.map((_, i) => (
              <div
                key={i}
                className={`h-0.5 rounded-full transition-all duration-500 ${
                  i === index ? "w-6 bg-[#5a9eff]" : "w-2 bg-white/20"
                }`}
              />
            ))}
          </div>
        </motion.blockquote>
      </AnimatePresence>
    </div>
  );
}
