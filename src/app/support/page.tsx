import Link from "next/link";
import { ArrowLeft, Mail, MessageCircle, FileText } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-[#000] text-white px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white transition-colors mb-12">
          <ArrowLeft size={14} /> Retour à l&apos;accueil
        </Link>

        <h1 className="text-4xl font-bold tracking-tight mb-3">Support</h1>
        <p className="text-white/40 text-base mb-12">Une question ? On est là pour vous aider.</p>

        <div className="flex flex-col gap-4">
          {[
            {
              icon: Mail,
              title: "Email",
              desc: "Réponse sous 24h ouvrées.",
              action: "contact@shiftly.io",
              href: "mailto:contact@shiftly.io",
            },
            {
              icon: MessageCircle,
              title: "Chat en direct",
              desc: "Disponible du lundi au vendredi, 9h–18h.",
              action: "Ouvrir le chat",
              href: "#",
            },
            {
              icon: FileText,
              title: "Documentation",
              desc: "Guides et tutoriels pour bien démarrer.",
              action: "Consulter la doc",
              href: "#",
            },
          ].map((item) => (
            <a
              key={item.title}
              href={item.href}
              className="flex items-start gap-5 p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04] transition-all group"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 border border-blue-500/20">
                <item.icon size={18} className="text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white mb-1">{item.title}</p>
                <p className="text-sm text-white/30">{item.desc}</p>
              </div>
              <span className="text-xs font-medium text-blue-400 group-hover:text-blue-300 transition-colors mt-0.5 shrink-0">{item.action}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
