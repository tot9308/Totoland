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
  recovery_kind: string | null
  recovery_culprit: string | null
  death_cause: string | null
  crop_box: { x: number; y: number; width: number; height: number } | null
  misting_frequency_days: number | null
  last_misted_at: string | null
  drainage: boolean | null
  last_deep_watering_at: string | null
}

export const EVENT_LABELS: Record<string, string> = {
  watering: "Riego",
  misting: "Pulverizado",
  cleaning: "Limpieza de hojas",
  fertilizing: "Abonado",
  pruning: "Poda",
  repotting: "Trasplante",
  treatment: "Tratamiento",
  observation: "Observacion",
  pest_detection: "Plaga detectada",
  disease_detection: "Enfermedad detectada",
  location_change: "Cambio de ubicacion",
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

function seasonMultiplier(plant: Plant, dateMid: Date, ss: number, se: number): number {
  const m = dateMid.getMonth() + 1
  if (m >= ss && m <= se) return 1
  const summer = Number(plant.watering_frequency_days) || 0
  const winter = Number(plant.watering_frequency_winter_days ?? plant.watering_frequency_days) || 0
  if (!summer || !winter) return 1
  return Math.max(1, Math.round(winter / summer))
}

export function isDueDay(plant: Plant, date: Date, ss: number, se: number): boolean {
  const set = wateringDaySet(plant)
  if (!set || !set.includes(date.getDay())) return false
  const interval = (plant.watering_week_interval || 1) * seasonMultiplier(plant, mid(date), ss, se)
  const anchor = plant.watering_anchor ? mid(new Date(plant.watering_anchor)) : null
  if (!anchor) return true
  const last = mid(new Date(plant.last_watered_at ?? date))
  const anchorMid = mid(anchor)
  if (anchorMid.getTime() >= last.getTime()) return false
  const daysDiff = Math.round((last.getTime() - anchorMid.getTime()) / 86400000)
  return daysDiff % interval === 0
}

export function isWateringDue(plant: Plant, summerStart: number, summerEnd: number): number | null {
  const du = daysUntilDue(plant, summerStart, summerEnd)
  if (du === null) return null
  return du <= 0 ? du : null
}

export function daysUntilDue(plant: Plant, summerStart: number, summerEnd: number): number | null {
  const freq = effectiveFreq(plant, summerStart, summerEnd)
  if (!freq) return null
  const last = plant.last_watered_at
  if (!last) return 0
  const daysDiff = daysSince(last)
  if (daysDiff === null) return null
  return freq - daysDiff
}

export function mistingFreqForSeason(p: Plant, summerStart: number, summerEnd: number): number | null {
  if (!p.misting_enabled) return null
  const base = p.misting_frequency_days
  if (!base) return null
  const month = new Date().getMonth() + 1
  const inSummer = month >= summerStart && month <= summerEnd
  return inSummer ? Math.round(base * 2) : base
}

export function mistingDue(p: Plant, summerStart: number, summerEnd: number): boolean {
  const freq = mistingFreqForSeason(p, summerStart, summerEnd)
  if (!freq) return false
  if (!p.last_misted_at) return true
  const days = daysSince(p.last_misted_at)
  if (days === null) return true
  return days >= freq
}

export const LIGHT_FRACTION: Record<string, [number, number]> = {
  A: [0.05, 0.08],
  B: [0.06, 0.10],
  C: [0.08, 0.12],
  D: [0.10, 0.14],
  E: [0.12, 0.16],
}

export const DEEP_FRACTION: Record<string, [number, number] | null> = {
  A: null,
  B: [0.18, 0.22],
  C: [0.20, 0.25],
  D: [0.22, 0.28],
  E: [0.25, 0.30],
}

export type WateringAdvice = {
  min: number
  max: number
  kind: "light" | "deep"
  instruction: string
}

export function calculateWatering(plant: Plant, today: Date): WateringAdvice | null {
  if (plant.drainage == null) return null
  const volume = plant.pot_diameter_cm ? plantVolume(plant) : null
  if (!volume) return null
  const style = (plant.watering_style ?? "B") as keyof typeof LIGHT_FRACTION
  const light = LIGHT_FRACTION[style] ?? LIGHT_FRACTION.B
  const deepFraction = DEEP_FRACTION[style] ?? null
  const due = isWateringDue(plant, 5, 9)
  const deep = due !== null && shouldDeepWater(plant, today)
  let fraction: [number, number] = deep && deepFraction ? deepFraction : light
  if (!plant.drainage) {
    fraction = [Math.min(fraction[0], 0.10), Math.min(fraction[1], 0.10)]
  }
  const min = round5(volume * fraction[0])
  const max = round5(volume * fraction[1])
  return {
    min,
    max,
    kind: deep ? "deep" : "light",
    instruction: deep
      ? "Riega hasta que drene por el fondo y vacia el plato"
      : plant.drainage
        ? "Riega con aproximadamente " + min + "-" + max + " ml"
        : "Riega poco, sin encharcar (" + min + "-" + max + " ml)",
  }
}

export function shouldDeepWater(plant: Plant, today: Date): boolean {
  if (!plant.drainage) return false
  if (plant.watering_style === "A") return false
  const reference = plant.last_deep_watering_at ?? plant.created_at
  if (!reference) return false
  if (plant.watering_style === "B") {
    const monthsDiff = monthsBetween(reference, today)
    return monthsDiff >= 2
  }
  const lastMonth = new Date(reference).getMonth()
  const lastYear = new Date(reference).getFullYear()
  const curMonth = today.getMonth()
  const curYear = today.getFullYear()
  return !(lastMonth === curMonth && lastYear === curYear)
}

function monthsBetween(date1: string, date2: Date): number {
  const d1 = new Date(date1)
  const y1 = d1.getFullYear()
  const m1 = d1.getMonth()
  const y2 = date2.getFullYear()
  const m2 = date2.getMonth()
  return (y2 - y1) * 12 + (m2 - m1)
}

function plantVolume(plant: Plant): number | null {
  if (!plant.pot_diameter_cm) return null
  const D = Math.max(4, plant.pot_diameter_cm)
  const R = D / 2
  const r = R * 0.75
  const h = D * 0.9
  return (Math.PI * h / 3) * (R * R + R * r + r * r)
}

function round5(x: number): number {
  return Math.round(x / 5) * 5
}

export function dueDatesInRange(plant: Plant, start: Date, end: Date, ss: number, se: number): Date[] {
  const out: Date[] = []
  if (!wateringDaySet(plant)) return out
  const d = mid(start); const e = mid(end)
  while (d <= e) {
    if (isDueDay(plant, d, ss, se)) out.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return out
}

export function isDue(plant: Plant, summerStart: number, summerEnd: number): boolean {
  const du = daysUntilDue(plant, summerStart, summerEnd)
  return du !== null && du <= 0
}

export function waterAmountFor(diameterCm: number, style: string): { min: number; max: number } {
  const D = Math.max(4, diameterCm)
  const R = D / 2
  const r = R * 0.75
  const h = D * 0.9
  const volumeMl = (Math.PI * h / 3) * (R * R + R * r + r * r)

  const fraction: { min: number; max: number } =
    style === "A" ? { min: 0.05, max: 0.08 }
    : style === "B" ? { min: 0.06, max: 0.10 }
    : style === "C" ? { min: 0.08, max: 0.12 }
    : style === "D" ? { min: 0.10, max: 0.14 }
    : style === "E" ? { min: 0.12, max: 0.16 }
    : { min: 0.08, max: 0.12 }

  const round5 = (x: number) => Math.round(x / 5) * 5

  return {
    min: round5(volumeMl * fraction.min),
    max: round5(volumeMl * fraction.max),
  }
}

export function waterAmount(plant: Plant): { min: number; max: number } | null {
  if (!plant.pot_diameter_cm) return null
  return waterAmountFor(plant.pot_diameter_cm, "B")
}

export function healthLevel(plant: Plant, ss: number, se: number): number {
  if (plant.status === "dead") return 2
  if ((plant.recovery_step ?? 0) > 0) return 2
  const du = daysUntilDue(plant, ss, se)
  if (du !== null && du <= -4) return 2
  if (du !== null && du < 0) return 1
  return 0
}