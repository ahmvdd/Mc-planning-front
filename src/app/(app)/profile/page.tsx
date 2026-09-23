"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetchClient, getToken } from "@/lib/clientApi";
import { User, KeyRound, Check, Loader2, AlertCircle, Shield, Clock, Plus, X } from "lucide-react";

type Me = { sub: number; name?: string; email?: string; role?: string };
type EmployeeData = { id: number; name: string; email: string; role: string };
type AvailabilitySlot = { id: number; dayOfWeek: number; startTime: string; endTime: string };

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export default function ProfilePage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [newDay, setNewDay] = useState(0);
  const [newStart, setNewStart] = useState("09:00");
  const [newEnd, setNewEnd] = useState("17:00");
  const [slotError, setSlotError] = useState("");
  const [addingSlot, setAddingSlot] = useState(false);

  const loadSlots = () => {
    apiFetchClient<AvailabilitySlot[]>("/availability/me").then(setSlots).catch(() => {});
  };

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    apiFetchClient<Me>("/auth/me")
      .then(async (data) => {
        setMe(data);
        if (data.sub) {
          const emp = await apiFetchClient<EmployeeData>(`/employees/${data.sub}`).catch(() => null);
          if (emp) setName(emp.name);
        }
      })
      .catch(() => router.push("/login"));
    loadSlots();
  }, [router]);

  const handleAddSlot = async () => {
    setSlotError("");
    setAddingSlot(true);
    try {
      await apiFetchClient("/availability", {
        method: "POST",
        body: JSON.stringify({ dayOfWeek: newDay, startTime: newStart, endTime: newEnd }),
      });
      loadSlots();
    } catch (err) {
      setSlotError(err instanceof Error ? err.message : "Erreur lors de l'ajout");
    } finally {
      setAddingSlot(false);
    }
  };

  const handleRemoveSlot = async (id: number) => {
    setSlots((prev) => prev.filter((s) => s.id !== id));
    await apiFetchClient(`/availability/${id}`, { method: "DELETE" }).catch(() => loadSlots());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password && password !== confirm) { setError("Les mots de passe ne correspondent pas"); return; }
    setSaving(true);
    try {
      await apiFetchClient("/employees/me", {
        method: "PATCH",
        body: JSON.stringify({ name: name || undefined, password: password || undefined }),
      });
      setSuccess(true);
      setPassword("");
      setConfirm("");
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  if (!me) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="animate-spin text-gray-300 dark:text-white/20" size={28} />
    </div>
  );

  const inputClass = "w-full rounded-xl bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-gray-200 transition-all dark:bg-white/5 dark:text-white dark:placeholder:text-white/25 dark:focus:ring-white/10";

  return (
    <div className="mx-auto max-w-6xl space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Mon profil</h1>
        <p className="text-sm text-gray-400 mt-1 dark:text-white/30">Modifiez vos informations personnelles</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">

        {/* Identité */}
        <div className="lg:col-span-1">
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-8 shadow-sm dark:bg-white/5 dark:shadow-none">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#B4FF39] text-3xl font-bold text-black">
              {name.charAt(0).toUpperCase() || "?"}
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{name || "—"}</h2>
              <p className="mt-1 text-sm text-gray-400 dark:text-white/30">{me.email}</p>
              <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600 dark:bg-white/10 dark:text-white/60">
                <Shield size={10} /> {me.role?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm dark:bg-white/5 dark:shadow-none">

            {/* Nom */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">
                <User size={11} /> Nom complet
              </label>
              <input className={inputClass} value={name} onChange={e => setName(e.target.value)} required />
            </div>

            {/* Mot de passe */}
            <div className="rounded-xl bg-gray-50 p-5 space-y-4 dark:bg-white/5">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">
                <KeyRound size={11} /> Changer le mot de passe
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Nouveau mot de passe</label>
                  <input
                    type="password" className={`${inputClass} dark:bg-white/5 bg-white`}
                    placeholder="Laisser vide pour ne pas changer"
                    value={password} onChange={e => setPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Confirmer</label>
                  <input
                    type="password" className={`${inputClass} dark:bg-white/5 bg-white`}
                    placeholder="Confirmer le nouveau mot de passe"
                    value={confirm} onChange={e => setConfirm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                <AlertCircle size={14} className="shrink-0" /> {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <Check size={14} className="shrink-0" /> Profil mis à jour avec succès !
              </div>
            )}

            <button
              type="submit" disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 py-3.5 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-60 transition-all dark:bg-[#B4FF39] dark:text-black dark:hover:bg-[#a3ec2e]"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              {saving ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
          </form>
        </div>
      </div>

      {/* Disponibilités */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Clock size={16} className="text-gray-400 dark:text-white/30" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Mes disponibilités</h2>
        </div>
        <p className="text-sm text-gray-400 mb-4 dark:text-white/30">
          Indiquez vos créneaux disponibles chaque semaine pour aider votre manager à construire le planning.
        </p>

        <div className="rounded-2xl bg-white p-5 shadow-sm space-y-5 dark:bg-white/5 dark:shadow-none">
          {DAYS.map((day, i) => {
            const daySlots = slots.filter((s) => s.dayOfWeek === i);
            return (
              <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-3 pb-4 border-b border-gray-50 last:border-0 last:pb-0 dark:border-white/5">
                <span className="w-28 shrink-0 text-sm font-semibold text-gray-900 dark:text-white">{day}</span>
                <div className="flex flex-wrap gap-2 flex-1">
                  {daySlots.length === 0 && (
                    <span className="text-xs text-gray-300 dark:text-white/20">Aucun créneau</span>
                  )}
                  {daySlots.map((s) => (
                    <span
                      key={s.id}
                      className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-white/10 dark:text-white/70"
                    >
                      {s.startTime} – {s.endTime}
                      <button
                        type="button"
                        onClick={() => handleRemoveSlot(s.id)}
                        className="text-gray-400 hover:text-gray-900 transition-colors dark:text-white/40 dark:hover:text-white"
                        aria-label="Supprimer"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Ajout d'un créneau */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 pt-2">
            <div className="flex-1 space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Jour</label>
              <select
                className={inputClass}
                value={newDay}
                onChange={(e) => setNewDay(Number(e.target.value))}
              >
                {DAYS.map((day, i) => (
                  <option key={day} value={i}>{day}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Début</label>
              <input type="time" className={inputClass} value={newStart} onChange={(e) => setNewStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Fin</label>
              <input type="time" className={inputClass} value={newEnd} onChange={(e) => setNewEnd(e.target.value)} />
            </div>
            <button
              type="button"
              onClick={handleAddSlot}
              disabled={addingSlot}
              className="flex items-center justify-center gap-1.5 rounded-full bg-gray-900 hover:bg-gray-800 disabled:opacity-60 px-4 py-2.5 text-sm font-bold text-white transition-all shrink-0 dark:bg-[#B4FF39] dark:text-black dark:hover:bg-[#a3ec2e]"
            >
              {addingSlot ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Ajouter
            </button>
          </div>

          {slotError && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
              <AlertCircle size={13} className="shrink-0" /> {slotError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
