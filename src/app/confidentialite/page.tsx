import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-[#000] text-white px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white transition-colors mb-12">
          <ArrowLeft size={14} /> Retour à l&apos;accueil
        </Link>

        <p className="text-xs font-semibold uppercase tracking-widest text-blue-500 mb-3">Légal</p>
        <h1 className="text-4xl font-bold tracking-tight mb-3">Politique de confidentialité</h1>
        <p className="text-white/30 text-sm mb-12">Dernière mise à jour : avril 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8">
          {[
            {
              title: "1. Données collectées",
              content: "Shiftly collecte uniquement les données nécessaires au fonctionnement du service : nom, adresse email, informations d'organisation, et données de planning. Aucune donnée n'est collectée à des fins publicitaires.",
            },
            {
              title: "2. Utilisation des données",
              content: "Vos données sont utilisées exclusivement pour fournir le service Shiftly : gestion des plannings, des équipes et des demandes de congé. Elles ne sont jamais vendues ni partagées avec des tiers sans votre consentement.",
            },
            {
              title: "3. Hébergement et sécurité",
              content: "Les données sont hébergées en France sur des serveurs sécurisés. Toutes les communications sont chiffrées via TLS 1.3. Les mots de passe sont hashés avec bcrypt et ne sont jamais stockés en clair.",
            },
            {
              title: "4. Vos droits (RGPD)",
              content: "Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données. Pour exercer ces droits, contactez-nous à : contact@shiftly.io",
            },
            {
              title: "5. Durée de conservation",
              content: "Les données sont conservées pendant la durée d'utilisation du service, puis supprimées dans un délai de 30 jours suivant la résiliation du compte.",
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
