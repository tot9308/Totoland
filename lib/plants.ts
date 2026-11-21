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
export const EVENT_LABELS: Record<string, string> = {
  watering: "Riego",
  misting: "Pulverizado",
  cleaning: "Limpieza de hojas",
  fertilizing: "Abonado",
  pruning: "Poda",
  repotting: "Trasplante",
  treatment: "Tratamiento",
  observation: "Observacin",
  pest_detection: "Plaga detectada",
  disease_detection: "Enfermedad detectada",
  location_change: "Cambio de ubicacin",
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
  return weekParity(mid(date), anchor, interval)
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

export function daysUntilDue(plant: Plant, summerStart: number, summerEnd: number): number | null {
  const set = wateringDaySet(plant)
  if (set) {
    const span = 7 * (plant.watering_week_interval || 1)
    const today = mid(new Date())
    const last = plant.last_watered_at ? mid(new Date(plant.last_watered_at)) : null
    for (let i = 0; i <= span; i++) {
      const d = new Date(today); d.setDate(d.getDate() - i)
      if (!isDueDay(plant, d, summerStart, summerEnd)) continue
      if (last && last.getTime() >= d.getTime()) {
        for (let j = 1; j <= span + 7; j++) {
          const f = new Date(last); f.setDate(f.getDate() + j)
          if (isDueDay(plant, f, summerStart, summerEnd)) return Math.round((f.getTime() - today.getTime()) / 86400000)
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

export function waterAmountFor(diameterCm: number, style: string): { min: number; max: number } {
  // Modelo fsico: volumen de sustrato en un macetero troncocnico.
  // D = dimetro boca, R = radio boca, r = radio base (~75% boca), h = altura proporcional al 
  // cm = ml
  const D = Math.max(4, diameterCm)
  const R = D / 2
  const r = R * 0.75
  const h = D * 0.9
  const volumeMl = (Math.PI * h / 3) * (R * R + R * r + r * r)

  // Fraccin de recarga por tipo de planta / sustrato (orientativo; el check del sustrato manda)
  const fraction: { min: number; max: number } =
    style === "A" ? { min: 0.10, max: 0.15 } // suculentas/cactus
    : style === "B" ? { min: 0.06, max: 0.10 } // riego escaso
    : style === "C" ? { min: 0.08, max: 0.12 } // medio
    : style === "D" ? { min: 0.10, max: 0.14 } // riego frecuente
    : style === "E" ? { min: 0.12, max: 0.16 } // helechos/tropicales
    : { min: 0.08, max: 0.12 } // desconocido  C

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
// ---------- Pulverizacin ----------
// En verano hay ms humedad ambiental, as que se espacia (2).
// En invierno (calefaccin, aire seco) se mantiene la frecuencia base.
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


// ---------- Riego automtico: ligero por defecto + profundo cada X tiempo ----------
export const LIGHT_FRACTION: Record<string, [number, number]> = {
  A: [0.05, 0.08], // suculentas/cactus
  B: [0.06, 0.10], // riego escaso
  C: [0.08, 0.12], // medio
  D: [0.10, 0.14], // riego frecuente
  E: [0.12, 0.16], // helechos/tropicales
}

export const DEEP_FRACTION: Record<string, [number, number] | null> = {
  A: null, // suculentas nunca riego profundo
  B: [0.18, 0.22], // cada 2 meses
  C: [0.20, 0.25], // primer riego del mes
  D: [0.22, 0.28], // primer riego del mes
  E: [0.25, 0.30], // primer riego del mes
}

export type WateringAdvice = {
  min: number
  max: number
  kind: "light" | "deep"
  instruction: string
}

export function calculateWatering(plant: Plant, today: Date): WateringAdvice | null {
  // Sin drenaje configurado  null (la UI mostrar aviso)
  if (plant.drainage == null) return null

  const volume = plant.pot_diameter_cm ? plantVolume(plant) : null
  if (!volume) return null

  const style = (plant.watering_style ?? "B") as keyof typeof LIGHT_FRACTION
  const light = LIGHT_FRACTION[style] ?? LIGHT_FRACTION.B
  const deepFraction = DEEP_FRACTION[style] ?? null

  const due = isDue(plant, 5, 9) // verano 5-9
  const deep = due && shouldDeepWater(plant, today)

  let fraction: [number, number] = deep && deepFraction ? deepFraction : light

  // Cap sin drenaje: nunca ms de 10% del sustrato
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
      ? "Riega hasta que drene por el fondo y vaca el plato"
      : plant.drainage
        ? "Riega con aproximadamente " + min + "-" + max + " ml"
        : "Riega poco, sin encharcar (" + min + "-" + max + " ml)",
  }
}

export function shouldDeepWater(plant: Plant, today: Date): boolean {
  // Sin drenaje  nunca profundo
  if (!plant.drainage) return false
  // Suculentas/cactus  nunca profundo
  if (plant.watering_style === "A") return false

  const reference = plant.last_deep_watering_at ?? plant.created_at
  if (!reference) return false

  if (plant.watering_style === "B") {
    const monthsDiff = monthsBetween(reference, today)
    return monthsDiff >= 2
  }

  // C, D, E: primer riego del mes
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

/** Volumen aproximado de sustrato en un troncocnico (cm = ml) */
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

