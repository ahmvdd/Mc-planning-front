"use client";

import { useEffect, useState } from "react";
import { X, ArrowRight, ArrowLeft, Calendar, Users, ClipboardList, QrCode, LayoutDashboard } from "lucide-react";

type Step = { icon: React.ComponentType<{ size?: number }>; title: string; desc: string };

const ADMIN_STEPS: Step[] = [
  {
    icon: LayoutDashboard,
    title: "Votre dashboard",
    desc: "En arrivant, vous voyez d'un coup d'œil vos effectifs, les créneaux planifiés et les demandes en attente. C'est le point de départ pour tout.",
  },
  {
    icon: Calendar,
    title: "Créer un planning",
    desc: "Allez dans Planning → \"Nouvelle période\", donnez-lui un nom et des dates. Ajoutez ensuite les créneaux un par un avec le formulaire à droite (date, horaire, employé).",
  },
  {
    icon: Users,
    title: "Inviter votre équipe",
    desc: "Dans Admin → \"Inviter un employé\", entrez son email. Il reçoit un lien pour créer son compte et rejoindre votre organisation automatiquement.",
  },
  {
    icon: ClipboardList,
    title: "Gérer les demandes",
    desc: "Les congés et autres demandes arrivent dans Demandes. Cliquez sur le crayon pour approuver, refuser ou répondre à un employé.",
  },
  {
    icon: QrCode,
    title: "Pointage",
    desc: "Dans Pointages, générez un QR code d'entrée à afficher sur place, ou un QR par créneau. Les employés scannent pour pointer leur présence.",
  },
];

const EMPLOYEE_STEPS: Step[] = [
  {
    icon: LayoutDashboard,
    title: "Votre dashboard",
    desc: "Vous retrouvez ici vos prochains créneaux et l'état de vos demandes en un coup d'œil.",
  },
  {
    icon: Calendar,
    title: "Voir votre planning",
    desc: "L'onglet Planning affiche tous vos créneaux à venir, groupés par période.",
  },
  {
    icon: ClipboardList,
    title: "Faire une demande",
    desc: "Dans Demandes, cliquez sur \"Nouvelle demande\" pour poser un congé ou toute autre requête auprès de votre manager.",
  },
  {
    icon: QrCode,
    title: "Pointer votre présence",
    desc: "Dans Scanner, ouvrez la caméra et scannez le QR code affiché sur votre lieu de travail pour enregistrer votre arrivée.",
  },
];

export default function TutorialModal({ open, onClose, role }: { open: boolean; onClose: () => void; role: string | null }) {
  const [step, setStep] = useState(0);
  const steps = role === "admin" ? ADMIN_STEPS : EMPLOYEE_STEPS;

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl dark:bg-[#151517]"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors dark:bg-white/10 dark:text-white/50 dark:hover:bg-white/15 dark:hover:text-white"
        >
          <X size={16} />
        </button>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#B4FF39] text-black mb-5">
          <Icon size={22} />
        </div>

        <p className="font-mono text-[10px] text-gray-400 mb-1.5 dark:text-white/30">ÉTAPE {step + 1} / {steps.length}</p>
        <h3 className="text-xl font-bold tracking-tight text-gray-900 mb-3 dark:text-white">{current.title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed mb-8 dark:text-white/50">{current.desc}</p>

        <div className="flex items-center gap-1.5 mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-gray-900 dark:bg-[#B4FF39]" : "bg-gray-100 dark:bg-white/10"}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex items-center justify-center gap-1.5 rounded-full bg-gray-100 px-4 py-3 text-sm font-bold text-gray-600 transition hover:bg-gray-200 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/15"
            >
              <ArrowLeft size={14} />
            </button>
          )}
          <button
            onClick={() => (isLast ? onClose() : setStep(s => s + 1))}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gray-900 py-3 text-sm font-bold text-white transition hover:bg-gray-800 dark:bg-[#B4FF39] dark:text-black dark:hover:bg-[#a3ec2e]"
          >
            {isLast ? "Terminer" : "Suivant"} {!isLast && <ArrowRight size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
