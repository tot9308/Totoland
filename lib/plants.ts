import { supabase } from "./supabase"

export type Plant = {
  id: string
  household_id: string
  name: string
  species: string | null
  location: string | null
  watering_frequency_days: number | null
  watering_frequency_winter_days: number | null
  watering_days: string | null
  last_watered_at: string | null
  status: "alive" | "dead"
  misting_enabled: boolean
  notes: string | null
  main_photo_path: string | null
  care_tips: string | null
  acquired_at: string | null
  died_at: string | null
  pot_diameter_cm: number | null
  has_saucer: boolean
  recovery_check_at: string | null
  recovery_step: number
  recovery_severity: string | null
  recovery_started_at: string | null
  plant_type: string | null
}

export const EVENT_LABELS: Record<string, string> = {
  watering: "Riego",
  misting: "Pulverizado",
  cleaning: "Limpieza de hojas",
  fertilizing: "Abonado",
  pruning: "Poda",
  repotting: "Trasplante",
  treatment: "Tratamiento",
  observation: "Observación",
  pest_detection: "Plaga detectada",
  disease_detection: "Enfermedad detectada",
  location_change: "Cambio de ubicación",
}

export function daysSince(iso: string | null): number | null {
  if (!iso) return null
  const diff = Date.now() - new Date(iso).getTime()
  return Math.floor(diff / 86400000)
}

export function summerNow(summerStart: number, summerEnd: number): boolean {
  const m = new Date().getMonth() + 1
  return m >= summerStart && m <= summerEnd
}

export function effectiveFreq(plant: Plant, summerStart: number, summerEnd: number): number | null {
  const inS = summerNow(summerStart, summerEnd)
  const f = inS
    ? plant.watering_frequency_days
    : plant.watering_frequency_winter_days ?? plant.watering_frequency_days
  return f ? Number(f) : null
}

export function wateringDaySet(plant: Plant): number[] | null {
  if (!plant.watering_days) return null
  const arr = plant.watering_days.split(",").map(x => parseInt(x, 10)).filter(n => !isNaN(n))
  return arr.length ? arr : null
}

export function daysUntilDue(plant: Plant, summerStart: number, summerEnd: number): number | null {
  const set = wateringDaySet(plant)
  if (set) {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const last = plant.last_watered_at ? new Date(plant.last_watered_at) : null
    if (last) last.setHours(0, 0, 0, 0)
    for (let i = 0; i <= 7; i++) {
      const d = new Date(today); d.setDate(d.getDate() - i)
      if (!set.includes(d.getDay())) continue
      if (last && last.getTime() >= d.getTime()) {
        for (let j = 1; j <= 8; j++) {
          const f = new Date(last); f.setDate(f.getDate() + j)
          if (set.includes(f.getDay()))
            return Math.round((f.getTime() - today.getTime()) / 86400000)
        }
        return null
      }
      return -i
    }
    return null
  }
  const f = effectiveFreq(plant, summerStart, summerEnd)
  if (f == null) return null
  const d = daysSince(plant.last_watered_at)
  if (d == null) return 0
  return f - d
}

export function isDue(plant: Plant, summerStart: number, summerEnd: number): boolean {
  const du = daysUntilDue(plant, summerStart, summerEnd)
  return du !== null && du <= 0
}

export function waterAmount(plant: Plant): { min: number; max: number } | null {
  if (!plant.pot_diameter_cm) return null
  return waterAmountFor(plant.pot_diameter_cm, "B")
}

export function waterAmountFor(diam: number, style: string): { min: number; max: number } {
  const r = diam / 2
  const h = diam * 0.85
  const volMl = Math.round(Math.PI * r * r * h)
  const ratio = style === "A" ? 0.25 : style === "C" ? 0.08 : 0.18
  return { min: Math.round(volMl * ratio * 0.5), max: Math.round(volMl * ratio) }
}