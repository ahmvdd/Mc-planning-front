import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      className="min-h-screen relative flex flex-col overflow-hidden bg-black bg-cover bg-center"
      style={{ backgroundImage: "url('/auth-bg-clouds.jpg')" }}
    >
      {/* Overlay pour la lisibilité du texte */}
      <div className="pointer-events-none absolute inset-0 bg-black/55" />

      {/* Halos verts, cohérents avec l'app */}
      <div className="pointer-events-none absolute -top-[20%] left-[15%] h-[600px] w-[600px] rounded-full bg-[#B4FF39]/10 blur-[120px] mix-blend-screen" />
      <div className="pointer-events-none absolute -bottom-[20%] right-[15%] h-[500px] w-[500px] rounded-full bg-[#B4FF39]/5 blur-[120px] mix-blend-screen" />

      {/* Back link */}
      <div className="relative z-10 px-8 pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-white/30 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} /> Retour à l&apos;accueil
        </Link>
      </div>

      {/* Form centered */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 p-6 sm:p-10">
        <span
          className="text-white font-semibold tracking-tight text-xl"
          style={{ fontFamily: "var(--font-instrument-sans)" }}
        >
          Shiftly
        </span>
        {children}
      </div>

      {/* Footer */}
      <div className="relative z-10 px-8 pb-8 text-center">
        <p className="text-[11px] text-white/20">
          © 2026 Shiftly · Hébergement France · RGPD
        </p>
      </div>
    </div>
  );
}
