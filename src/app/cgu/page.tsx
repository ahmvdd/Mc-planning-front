import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CguPage() {
  return (
    <div className="min-h-screen bg-[#000] text-white px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white transition-colors mb-12">
          <ArrowLeft size={14} /> Retour à l&apos;accueil
        </Link>

        <p className="text-xs font-semibold uppercase tracking-widest text-blue-500 mb-3">Légal</p>
        <h1 className="text-4xl font-bold tracking-tight mb-3">Conditions Générales d&apos;Utilisation</h1>
        <p className="text-white/30 text-sm mb-12">Dernière mise à jour : avril 2026</p>

        <div className="space-y-8">
          {[
            {
              title: "1. Objet",
              content: "Les présentes CGU régissent l'utilisation de la plateforme Shiftly, outil de gestion de planning et d'équipes. En créant un compte, vous acceptez l'intégralité de ces conditions.",
            },
            {
              title: "2. Accès au service",
              content: "Shiftly est accessible aux professionnels (entreprises, associations, indépendants) souhaitant gérer leurs équipes. L'accès nécessite la création d'un compte avec une adresse email valide.",
            },
            {
              title: "3. Responsabilités",
              content: "Vous êtes responsable de la confidentialité de vos identifiants et des données saisies dans la plateforme. Shiftly ne peut être tenu responsable d'une utilisation non autorisée de votre compte.",
            },
            {
              title: "4. Propriété intellectuelle",
              content: "L'ensemble des éléments constituant Shiftly (design, code, marque) est la propriété exclusive de ses créateurs. Toute reproduction sans autorisation est interdite.",
            },
            {
              title: "5. Résiliation",
              content: "Vous pouvez résilier votre compte à tout moment depuis les paramètres. Shiftly se réserve le droit de suspendre un compte en cas de violation des présentes CGU.",
            },
            {
              title: "6. Droit applicable",
              content: "Les présentes CGU sont soumises au droit français. Tout litige sera soumis aux tribunaux compétents de Paris.",
            },
          ].map((section) => (
            <div key={section.title} className="border-t border-white/5 pt-8">
              <h2 className="text-base font-bold text-white mb-3">{section.title}</h2>
              <p className="text-sm text-white/40 leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/5">
          <p className="text-xs text-white/20">Pour toute question : <a href="mailto:contact@shiftly.io" className="text-blue-400 hover:text-blue-300 transition-colors">contact@shiftly.io</a></p>
        </div>
      </div>
    </div>
  );
}
