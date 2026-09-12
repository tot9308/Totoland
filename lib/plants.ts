export type Plant = {
  id: string
  household_id: string
  name: string
  species: string | null
  location: string | null
  watering_frequency_days: number | null
  watering_frequency_winter_days: number | null
  watering_days: string | null
  watering_week_interval: number | null
  watering_anchor: string | null
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
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

export function summerNow(summerStart: number, summerEnd: number): boolean {
  const m = new Date().getMonth() + 1
  return m >= summerStart && m <= summerEnd
}

export function effectiveFreq(plant: Plant, summerStart: number, summerEnd: number): number | null {
  const f = summerNow(summerStart, summerEnd)
    ? plant.watering_frequency_days
    : plant.watering_frequency_winter_days ?? plant.watering_frequency_days
  return f ? Number(f) : null
}

function mid(d: Date): Date {
  const x = new Date(d); x.setHours(0, 0, 0, 0); return x
}

export function wateringDaySet(plant: Plant): number[] | null {
  if (!plant.watering_days) return null
  const arr = plant.watering_days.split(",").map(x => parseInt(x, 10)).filter(n => !isNaN(n))
  return arr.length ? arr : null
}

function weekParity(dateMid: Date, anchorMid: Date, interval: number): boolean {
  const w = Math.round((dateMid.getTime() - anchorMid.getTime()) / 604800000)
  return ((w % interval) + interval) % interval === 0
}

export function isDueDay(plant: Plant, date: Date): boolean {
  const set = wateringDaySet(plant)
  if (!set || !set.includes(date.getDay())) return false
  const interval = plant.watering_week_interval || 1
  const anchor = plant.watering_anchor ? mid(new Date(plant.watering_anchor)) : null
  if (!anchor) return true
  return weekParity(mid(date), anchor, interval)
}

export function dueDatesInRange(plant: Plant, start: Date, end: Date): Date[] {
  const out: Date[] = []
  if (!wateringDaySet(plant)) return out
  const d = mid(start); const e = mid(end)
  while (d <= e) {
    if (isDueDay(plant, d)) out.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return out
}

export function daysUntilDue(plant: Plant, summerStart: number, summerEnd: number): number | null {
  const set = wateringDaySet(plant)
  if (set) {
    const span = 7 * (plant.watering_week_interval || 1)
    const today = mid(new Date())
    const last = plant.last_watered_at ? mid(new Date(plant.last_watered_at)) : null
    for (let i = 0; i <= span; i++) {
      const d = new Date(today); d.setDate(d.getDate() - i)
      if (!isDueDay(plant, d)) continue
      if (last && last.getTime() >= d.getTime()) {
        for (let j = 1; j <= span + 7; j++) {
          const f = new Date(last); f.setDate(f.getDate() + j)
          if (isDueDay(plant, f)) return Math.round((f.getTime() - today.getTime()) / 86400000)
        }
        return null
      }
      return -i
    }
    return null
  }
  const f = effectiveFreq(plant, summerStart, summerEnd)
  if (f == null) return null
  if (!plant.last_watered_at) return 0
  const dExact = (Date.now() - new Date(plant.last_watered_at).getTime()) / 86400000
  const dueExact = f - dExact
  if (dueExact <= 0) return Math.floor(dueExact)
  if (dueExact < 1) return 0
  return Math.ceil(dueExact)
}

export function isDue(plant: Plant, summerStart: number, summerEnd: number): boolean {
  const du = daysUntilDue(plant, summerStart, summerEnd)
  return du !== null && du <= 0
}

const REF: [number, number, number][] = [
  [8, 40, 80], [10, 50, 100], [12, 70, 120], [14, 90, 140], [16, 150, 250],
  [18, 220, 350], [20, 320, 480], [24, 500, 750], [28, 750, 1100],
  [30, 1000, 1500], [35, 1400, 2100], [40, 1800, 2700],
]

export function waterAmountFor(diam: number, style: string): { min: number; max: number } {
  const d = Math.max(REF[0][0], Math.min(REF[REF.length - 1][0], diam))
  let i = 0
  while (i < REF.length - 2 && REF[i + 1][0] < d) i++
  const [d0, mn0, mx0] = REF[i]
  const [d1, mn1, mx1] = REF[i + 1]
  const t = d1 === d0 ? 0 : (d - d0) / (d1 - d0)
  const mult = style === "A" ? 0.7 : style === "C" ? 1.2 : 1
  return {
    min: Math.round(((mn0 + (mn1 - mn0) * t) * mult) / 5) * 5,
    max: Math.round(((mx0 + (mx1 - mx0) * t) * mult) / 5) * 5,
  }
}

export function waterAmount(plant: Plant): { min: number; max: number } | null {
  if (!plant.pot_diameter_cm) return null
  return waterAmountFor(plant.pot_diameter_cm, "B")
}