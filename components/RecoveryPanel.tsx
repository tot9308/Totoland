"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { daysSince, type Plant } from "@/lib/plants"
import { type SpeciesCard } from "@/lib/species"
import {
  CHECKS, SEV_LABEL, TYPE_LABEL, plantType, severityFor, rehydrateTip, checkPrompt,
  startRecovery, resolveRecovery, type PType,
} from "@/lib/recovery"

const TYPES: PType[] = ["succulent", "epiphyte", "tropical", "hardy", "mediterranean"]
const SEVS = ["mild", "moderate", "severe", "critical"]

export default function RecoveryPanel({ plant, userId, speciesCard, onChanged }: {
  plant: Plant
  userId: string
  speciesCard?: SpeciesCard
  onChanged: () => void
}) {
  const [expert, setExpert] = useState(false)
  const [eSev, setESev] = useState(plant.recovery_severity ?? "moderate")
  const [eType, setEType] = useState(plant.plant_type ?? "")
  const [eDate, setEDate] = useState(plant.recovery_check_at ? plant.recovery_check_at.slice(0, 10) : "")

  const inRecovery = !!plant.recovery_check_at
  const type = plantType(speciesCard, plant.plant_type)
  const severity = plant.recovery_severity ?? "moderate"
  const steps = CHECKS[severity] ?? [3]
  const step = plant.recovery_step ?? 1
  const now = Date.now()
  const due = inRecovery && new Date(plant.recovery_check_at!).getTime() <= now
  const forbidUntil = plant.recovery_started_at
    ? new Date(new Date(plant.recovery_started_at).getTime() + 21 * 86400000)
    : null

  async function begin() {
    const days = daysSince(plant.last_watered_at) ?? 21
    const freq = plant.watering_frequency_days ?? 7
    const sev = severityFor(days, freq, type)
    await startRecovery(plant, sev, type)
    onChanged()
  }

  async function saveExpert() {
    await supabase.from("plants").update({
      recovery_severity: eSev,
      plant_type: eType || null,
      recovery_check_at: eDate ? new Date(eDate + "T12:00:00").toISOString() : null,
    }).eq("id", plant.id)
    setExpert(false)
    onChanged()
  }

  if (!inRecovery) {
    return (
      <section className="mb-6 rounded-xl bg-[#faf7f0] p-4 shadow-sm">
        <button onClick={begin}
          className="rounded bg-[#b5603d] px-3 py-2 text-sm text-white hover:bg-[#9c4f31]">
          🩺 Marcar en recuperación
        </button>
        <p className="mt-2 text-xs text-stone-500">
          Úsalo si ves la planta estresada (sequía, golpe de calor o de frío) aunque no haya retraso de riego.
          Tipo detectado: <b>{TYPE_LABEL[type]}</b>.
        </p>
      </section>
    )
  }

  return (
    <section className="mb-6 rounded-xl bg-[#f5ece6] p-4 shadow-sm">
      <h2 className="mb-1 text-lg font-semibold text-stone-800">🩺 Recuperación en curso</h2>
      <p className="mb-2 text-sm text-stone-700">
        {SEV_LABEL[severity]} · {TYPE_LABEL[type]} · chequeo {step}/{steps.length} ·{" "}
        {due ? "toca revisarla hoy" : `próximo en ${Math.ceil((new Date(plant.recovery_check_at!).getTime() - now) / 86400000)} d`}
      </p>
      <p className="mb-2 text-sm text-stone-700"><b>Cómo rehidratar:</b> {rehydrateTip(type)}</p>
      <p className="mb-2 text-sm text-stone-700"><b>En este chequeo pregúntate:</b> {checkPrompt(step)}</p>
      {forbidUntil && (
        <p className="mb-3 rounded bg-[#efe3c8] p-2 text-xs text-stone-800">
          🚫 Hasta el {forbidUntil.toLocaleDateString("es-ES")}: no abones, no trasplantes, no podes drástico.
        </p>
      )}
      <div className="mb-3 flex flex-wrap gap-1">
        <button onClick={() => resolveRecovery(plant, "ok", userId).then(onChanged)}
          className="rounded bg-[#5a7d4a] px-2 py-1 text-xs text-white hover:bg-[#4a6a3a]">✅ Recuperada</button>
        <button onClick={() => resolveRecovery(plant, "topup", userId).then(onChanged)}
          className="rounded bg-[#5a8ca6] px-2 py-1 text-xs text-white hover:bg-[#497691]">💧 Riego de apoyo</button>
        <button onClick={() => resolveRecovery(plant, "still", userId).then(onChanged)}
          className="rounded bg-[#b5603d] px-2 py-1 text-xs text-white hover:bg-[#9c4f31]">🩺 Sigue maltrecha</button>
      </div>

      <button onClick={() => setExpert(!expert)}
        className="text-xs text-[#8a3a1a] hover:underline">
        🔧 {expert ? "Ocultar modo experto" : "Modo experto"}
      </button>
      {expert && (
        <div className="mt-2 grid gap-2 rounded bg-[#faf7f0] p-3 md:grid-cols-3">
          <label className="block text-xs text-stone-800">
            Severidad
            <select value={eSev} onChange={e => setESev(e.target.value)}
              className="mt-1 w-full rounded border border-stone-300 px-2 py-1">
              {SEVS.map(s => <option key={s} value={s}>{SEV_LABEL[s]}</option>)}
            </select>
          </label>
          <label className="block text-xs text-stone-800">
            Tipo de planta
            <select value={eType} onChange={e => setEType(e.target.value)}
              className="mt-1 w-full rounded border border-stone-300 px-2 py-1">
              <option value="">Auto ({TYPE_LABEL[type]})</option>
              {TYPES.map(t => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
            </select>
          </label>
          <label className="block text-xs text-stone-800">
            Próximo chequeo
            <input type="date" value={eDate} onChange={e => setEDate(e.target.value)}
              className="mt-1 w-full rounded border border-stone-300 px-2 py-1" />
          </label>
          <button onClick={saveExpert}
            className="rounded bg-[#5a7d4a] px-3 py-1 text-xs text-white md:col-span-3">
            Guardar ajustes expertos
          </button>
        </div>
      )}
    </section>
  )
}