"use client";

import { motion } from "framer-motion";

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  stagger?: number;
}

export function SplitText({
  text,
  className,
  delay = 0,
  duration = 0.6,
  stagger = 0.03,
}: SplitTextProps) {
  const chars = text.split("");

  return (
    <span className={className} aria-label={text} style={{ fontFamily: "var(--font-instrument-serif)" }}>
      {chars.map((char, i) => (
        <motion.span
          key={i}
          initial={{ y: "110%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          transition={{
            duration,
            delay: delay + i * stagger,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{ display: "inline-block", whiteSpace: char === " " ? "pre" : "normal" }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}
