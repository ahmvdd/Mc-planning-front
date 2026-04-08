"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiFetchClient, getToken } from "@/lib/clientApi";
import { QrCode, CheckCircle2, XCircle, Loader2, Camera } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

type ScanStatus = "idle" | "scanning" | "loading" | "success" | "error" | "already";

export default function ScanPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [message, setMessage] = useState("");
  const [cameraActive, setCameraActive] = useState(false);

  // Si token dans l'URL (scan direct via QR)
  useEffect(() => {
    const token = searchParams.get("token");
    if (token) handleToken(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToken = async (token: string) => {
    if (!getToken()) { router.push("/login"); return; }
    setStatus("loading");
    try {
      await apiFetchClient("/pointage/scan", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      setStatus("success");
      setMessage("Pointage enregistré avec succès !");
    } catch (err: unknown) {
      const msg = (err instanceof Error ? err.message : null) || "Erreur lors du pointage";
      if (msg.includes("déjà pointé")) {
        setStatus("already");
        setMessage("Vous avez déjà pointé pour ce créneau.");
      } else {
        setStatus("error");
        setMessage(msg);
      }
    }
  };

  const startCamera = async () => {
    setCameraActive(true);
    setStatus("scanning");
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await scanner.stop();
          setCameraActive(false);
          // Extraire le token de l'URL scannée
          try {
            const url = new URL(decodedText);
            const token = url.searchParams.get("token");
            if (token) {
              await handleToken(token);
            } else {
              setStatus("error");
              setMessage("QR code invalide");
            }
          } catch {
            setStatus("error");
            setMessage("QR code non reconnu");
          }
        },
        () => {},
      );
    } catch {
      setStatus("error");
      setMessage("Impossible d'accéder à la caméra");
      setCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
    }
    setCameraActive(false);
    setStatus("idle");
  };

  return (
    <div className="mx-auto max-w-md space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pointer mon arrivée</h1>
        <p className="mt-1 text-sm text-slate-500">Scannez le QR code affiché à l'entrée de votre lieu de travail.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Scanner */}
        <div className="relative flex min-h-[300px] items-center justify-center bg-slate-950">
          <div id="qr-reader" className="w-full" />

          {!cameraActive && status === "idle" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white">
              <QrCode size={64} className="text-white/20" />
              <p className="text-sm text-white/50">Caméra inactive</p>
            </div>
          )}

          {status === "loading" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/90">
              <Loader2 size={40} className="animate-spin text-blue-400" />
              <p className="text-sm font-medium text-white">Enregistrement...</p>
            </div>
          )}

          {status === "success" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/90">
              <CheckCircle2 size={56} className="text-emerald-400" />
              <p className="text-base font-bold text-white">{message}</p>
            </div>
          )}

          {(status === "error" || status === "already") && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/90">
              <XCircle size={56} className={status === "already" ? "text-amber-400" : "text-rose-400"} />
              <p className="text-base font-bold text-white text-center px-6">{message}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-5 space-y-3">
          {!cameraActive && status !== "success" && (
            <button
              onClick={startCamera}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-700 active:scale-95"
            >
              <Camera size={18} /> Ouvrir la caméra
            </button>
          )}

          {cameraActive && (
            <button
              onClick={stopCamera}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Annuler
            </button>
          )}

          {(status === "error" || status === "already") && (
            <button
              onClick={() => setStatus("idle")}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Réessayer
            </button>
          )}

          {status === "success" && (
            <button
              onClick={() => router.push("/dashboard")}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              Retour au dashboard
            </button>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-slate-400">
        En cas d'oubli, contactez votre responsable pour un pointage manuel.
      </p>
    </div>
  );
}
