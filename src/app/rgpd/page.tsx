import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function RgpdPage() {
  return (
    <div className="min-h-screen bg-[#000] text-white px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white transition-colors mb-12">
          <ArrowLeft size={14} /> Retour à l&apos;accueil
        </Link>

        <p className="text-xs font-semibold uppercase tracking-widest text-blue-500 mb-3">Légal</p>
        <h1 className="text-4xl font-bold tracking-tight mb-3">Conformité RGPD</h1>
        <p className="text-white/30 text-sm mb-12">Dernière mise à jour : avril 2026</p>

        <div className="flex items-start gap-4 p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 mb-10">
          <ShieldCheck size={20} className="text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-300/80 leading-relaxed">
            Shiftly est entièrement conforme au Règlement Général sur la Protection des Données (RGPD) en vigueur depuis mai 2018.
          </p>
        </div>

        <div className="space-y-8">
          {[
            {
              title: "Base légale du traitement",
              content: "Le traitement de vos données repose sur l'exécution du contrat de service. Aucun traitement n'est effectué sans base légale valide.",
            },
            {
              title: "Vos droits",
              content: "Conformément aux articles 15 à 22 du RGPD, vous disposez des droits suivants : accès, rectification, suppression, limitation, portabilité et opposition. Pour exercer ces droits, contactez-nous à contact@shiftly.io.",
            },
            {
              title: "Sous-traitants",
              content: "Shiftly fait appel à des sous-traitants hébergés en Europe, tous conformes au RGPD. La liste est disponible sur demande.",
            },
            {
              title: "Transferts hors UE",
              content: "Aucun transfert de données vers des pays tiers à l'UE n'est effectué. Toutes les données restent sur le territoire européen.",
            },
            {
              title: "Délégué à la protection des données",
              content: "Pour toute question relative à la protection de vos données, contactez notre DPO à : dpo@shiftly.io",
            },
            {
              title: "Réclamation",
              content: "Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la CNIL : www.cnil.fr",
            },
          ].map((section) => (
            <div key={section.title} className="border-t border-white/5 pt-8">
              <h2 className="text-base font-bold text-white mb-3">{section.title}</h2>
              <p className="text-sm text-white/40 leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/5">
          <p className="text-xs text-white/20">Contact DPO : <a href="mailto:dpo@shiftly.io" className="text-blue-400 hover:text-blue-300 transition-colors">dpo@shiftly.io</a></p>
        </div>
      </div>
    </div>
  );
}
