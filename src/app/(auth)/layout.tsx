import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import { AuthQuote } from "@/components/auth-quote";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-black">

      {/* LEFT — Image panel */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[58%] relative flex-col justify-between p-12 overflow-hidden">
        {/* Photo */}
        <img
          src="/auth-bg.jpeg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/55" />
        {/* Gradient fade on right edge */}
        <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-black to-transparent" />
        {/* Subtle blue tint */}
        <div className="absolute inset-0 bg-[#5a9eff]/5" />

        {/* Top — Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#5a9eff] flex items-center justify-center">
              <Calendar size={15} className="text-black" />
            </div>
            <span className="text-white font-bold tracking-tight text-base">Shiftly</span>
          </div>
        </div>

        {/* Bottom — Rotating quotes */}
        <div className="relative z-10">
          <AuthQuote />
        </div>
      </div>

      {/* DIVIDER — Animated light beam */}
      <div className="hidden lg:block relative w-px self-stretch overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-white/[0.06]" />
        <div className="absolute left-0 w-full h-48 bg-gradient-to-b from-transparent via-[#5a9eff] to-transparent opacity-60 animate-travel-light" />
        <div
          className="absolute left-0 w-full h-48 bg-gradient-to-b from-transparent via-[#5a9eff] to-transparent opacity-30 animate-travel-light"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* RIGHT — Form panel */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#5a9eff]/6 blur-[120px] rounded-full pointer-events-none" />

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
        <div className="relative z-10 flex flex-1 items-center justify-center p-6 sm:p-10">
          {children}
        </div>

        {/* Footer */}
        <div className="relative z-10 px-8 pb-8 text-center">
          <p className="text-[11px] text-white/20">
            © 2026 Shiftly · Hébergement France · RGPD
          </p>
        </div>
      </div>
    </div>
  );
}
