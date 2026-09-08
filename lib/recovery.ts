import { supabase } from "./supabase"
import { type Plant } from "./plants"
import { type SpeciesCard } from "./species"

export type PType = "succulent" | "epiphyte" | "tropical" | "hardy" | "mediterranean"

export const TYPE_LABEL: Record<PType, string> = {
  succulent: "Suculenta / cactus",
  epiphyte: "Epífita (orquídea, bromelia, hoya)",
  tropical: "Tropical de selva",
  hardy: "Interior todoterreno",
  mediterranean: "Mediterránea / aromática",
}

export const SEV_LABEL: Record<string, string> = {
  mild: "🟢 Leve",
  moderate: "🟡 Moderada",
  severe: "🟠 Severa",
  critical: "🔴 Crítica",
}

export const CHECKS: Record<string, number[]> = {
  mild: [3],
  moderate: [3, 7],
  severe: [3, 7, 21],
  critical: [3, 7, 21, 45],
}

const MULT: Record<PType, [number, number, number]> = {
  succulent: [2, 4, 8],
  mediterranean: [2, 4, 8],
  epiphyte: [2, 3, 5],
  hardy: [2, 4, 6],
  tropical: [1.5, 3, 5],
}

export function plantType(card: SpeciesCard | undefined, override: string | null): PType {
  if (override && override in TYPE_LABEL) return override as PType
  if (!card) return "hardy"
  if (card.substrate === 4) return "epiphyte"
  if (card.water === "C" && card.drought === "alta") {
    const tmin = parseInt(card.temp.split("-")[0], 10)
    return tmin <= 10 ? "mediterranean" : "succulent"
  }
  if (card.water === "A" || card.drought === "baja") return "tropical"
  return "hardy"
}

export function severityFor(daysWithoutWater: number, freq: number, type: PType): string {
  const m = MULT[type]
  if (daysWithoutWater <= freq * m[0]) return "mild"
  if (daysWithoutWater <= freq * m[1]) return "moderate"
  if (daysWithoutWater <= freq * m[2]) return "severe"
  return "critical"
}

export function rehydrateTip(type: PType): string {
  switch (type) {
    case "succulent":
    case "mediterranean":
      return "Riega con MEDIA dosis y sin remojo; repite en 3-4 días. Nunca encharques: tras una sequía larga sus raíces pudren rápido."
    case "epiphyte":
      return "Rehidrata por inmersión breve (5-10 min) o pulverizado abundante, y escurre muy bien. No dejes agua en el centro de la roseta."
    case "tropical":
      return "Rehidrata gradual: media dosis, espera 15-20 min y otra media dosis (o remojo de 15 min si el sustrato repele el agua). Sube la humedad ambiental y quítala del sol directo 2-3 días."
    default:
      return "Riega en dos tandas: media dosis, espera 15-20 min y repite. Quítala del sol directo 1-2 días."
  }
}

export function checkPrompt(step: number): string {
  if (step === 1) return "¿Se han erguido las hojas? ¿Hay hojas nuevas mustias?"
  if (step === 2) return "¿Están brotando yemas nuevas? ¿El color vuelve a la normalidad?"
  if (step === 3) return "¿El crecimiento ha vuelto a la normalidad? ¿Quedan secuelas?"
  return "¿Se ha estabilizado? Valora secuelas permanentes."
}

export async function startRecovery(plant: Plant, severity: string, type: PType) {
  const first = CHECKS[severity]?.[0] ?? 3
  await supabase.from("plants").update({
    recovery_check_at: new Date(Date.now() + first * 86400000).toISOString(),
    recovery_step: 1,
    recovery_severity: severity,
    recovery_started_at: new Date().toISOString(),
    plant_type: type,
  }).eq("id", plant.id)
}

export async function resolveRecovery(plant: Plant, action: "ok" | "topup" | "still", userId: string) {
  const severity = plant.recovery_severity ?? "moderate"
  const steps = CHECKS[severity] ?? [3]
  const step = plant.recovery_step ?? 1

  if (action === "ok") {
    await supabase.from("care_events").insert({
      plant_id: plant.id, user_id: userId, type: "observation",
      notes: `Chequeo de recuperación (${step}/${steps.length}): recuperada ✅`, health: "green",
    })
    await supabase.from("plants").update({
      recovery_check_at: null, recovery_step: 0, recovery_severity: null, recovery_started_at: null,
    }).eq("id", plant.id)
    return
  }

  if (action === "topup") {
    await supabase.from("care_events").insert({
      plant_id: plant.id, user_id: userId, type: "watering",
      notes: "Riego de apoyo en recuperación (media dosis)",
    })
    await supabase.from("plants").update({ last_watered_at: new Date().toISOString() }).eq("id", plant.id)
  } else {
    await supabase.from("care_events").insert({
      plant_id: plant.id, user_id: userId, type: "observation",
      notes: `Chequeo de recuperación (${step}/${steps.length}): sigue maltrecha 🩺`, health: "yellow",
    })
  }

  if (step >= steps.length) {
    await supabase.from("plants").update({
      recovery_check_at: null, recovery_step: 0, recovery_severity: null, recovery_started_at: null,
    }).eq("id", plant.id)
  } else {
    const gap = (steps[step] ?? 3) - (steps[step - 1] ?? 0)
    await supabase.from("plants").update({
      recovery_check_at: new Date(Date.now() + gap * 86400000).toISOString(),
      recovery_step: step + 1,
    }).eq("id", plant.id)
  }
}