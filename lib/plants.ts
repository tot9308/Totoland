export type Plant = {
  id: string
  household_id: string
  name: string
  species: string | null
  location: string | null
  watering_frequency_days: number | null
  watering_frequency_winter_days: number | null
  last_watered_at: string | null
  status: string
  misting_enabled: boolean
  notes: string | null
  main_photo_path: string | null
  care_tips: string | null
  acquired_at: string | null
  died_at: string | null
}

export const EVENT_LABELS: Record<string, string> = {
  watering: "Riego",
  misting: "Pulverizar hojas",
  cleaning: "Limpiar hojas",
  fertilizing: "Abonado",
  pruning: "Poda",
  repotting: "Trasplante",
  treatment: "Tratamiento",
  observation: "Observación",
  pest_detection: "Plaga detectada",
  disease_detection: "Enfermedad detectada",
  location_change: "Cambio de ubicación",
}

export function daysSince(dateIso: string | null): number | null {
  if (!dateIso) return null
  return Math.floor((Date.now() - new Date(dateIso).getTime()) / 86400000)
}

// Mayo–septiembre = verano; el resto, invierno
export function effectiveFreq(
  p: Plant,
  summerStart: number,
  summerEnd: number
): number | null {
  const m = new Date().getMonth() + 1
  const inSummer = summerStart <= summerEnd
    ? (m >= summerStart && m <= summerEnd)
    : (m >= summerStart || m <= summerEnd)
  if (inSummer) return p.watering_frequency_days
  return p.watering_frequency_winter_days ?? p.watering_frequency_days
}

export function isDue(p: Plant, summerStart: number, summerEnd: number): boolean {
  if (p.status === "dead") return false
  const f = effectiveFreq(p, summerStart, summerEnd)
  if (f == null) return false
  const d = daysSince(p.last_watered_at)
  return d === null || d >= f
}

export function daysUntilDue(p: Plant, summerStart: number, summerEnd: number): number | null {
  const f = effectiveFreq(p, summerStart, summerEnd)
  if (f == null) return null
  const d = daysSince(p.last_watered_at)
  if (d === null) return -1
  return f - d
}