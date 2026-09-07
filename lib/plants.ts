import { findSpecies } from "./species"

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
  pot_diameter_cm: number | null
  has_saucer: boolean
  recovery_check_at: string | null
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

export function effectiveFreq(p: Plant, summerStart: number, summerEnd: number): number | null {
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

export function waterAmountFor(diameterCm: number, style: string): { min: number; max: number } {
  const d = Math.max(4, diameterCm)
  const r = d / 2 - 1
  const h = d * 0.9
  const vol = Math.PI * r * r * h
const [a, b] = style === "A" ? [0.1, 0.15] : style === "C" ? [0.15, 0.2] : [0.12, 0.18]
  const round10 = (x: number) => Math.max(50, Math.round(x / 10) * 10)
  return { min: round10(vol * a), max: round10(vol * b) }
}

export function waterAmount(p: Plant): { min: number; max: number } | null {
  if (!p.pot_diameter_cm) return null
  const style = findSpecies(p.species ?? "")?.water ?? "B"
  return waterAmountFor(p.pot_diameter_cm, style)
}