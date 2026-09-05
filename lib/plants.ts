export type Plant = {
  id: string
  household_id: string
  name: string
  species: string | null
  location: string | null
  watering_frequency_days: number | null
  last_watered_at: string | null
  status: string
  misting_enabled: boolean
  notes: string | null
  main_photo_path: string | null
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

export function isDue(p: Plant): boolean {
  if (p.status === "dead" || p.watering_frequency_days == null) return false
  const d = daysSince(p.last_watered_at)
  return d === null || d >= p.watering_frequency_days
}