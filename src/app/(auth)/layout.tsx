import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col bg-[#000] overflow-hidden">
      {/* background blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute right-1/4 bottom-0 h-[400px] w-[400px] translate-x-1/2 translate-y-1/2 rounded-full bg-blue-700/10 blur-[100px]" />
      </div>

      {/* Back link */}
      <div className="relative z-10 px-6 pt-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-white/30 hover:text-white transition-colors">
          <ArrowLeft size={14} /> Retour à l&apos;accueil
        </Link>
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center p-4">
        {children}
      </div>
    </div>
  );
}
