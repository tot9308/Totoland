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
  // Modelo físico: volumen de sustrato en un macetero troncocónico.
  // D = diámetro boca, R = radio boca, r = radio base (~75% boca), h = altura proporcional al Ø
  // cm³ = ml
  const D = Math.max(4, diameterCm)
  const R = D / 2
  const r = R * 0.75
  const h = D * 0.9
  const volumeMl = (Math.PI * h / 3) * (R * R + R * r + r * r)

  // Fracción de recarga por tipo de planta / sustrato (orientativo; el check del sustrato manda)
  const fraction: { min: number; max: number } =
    style === "A" ? { min: 0.10, max: 0.15 } // suculentas/cactus
    : style === "B" ? { min: 0.12, max: 0.18 } // riego escaso
    : style === "C" ? { min: 0.15, max: 0.22 } // medio
    : style === "D" ? { min: 0.18, max: 0.25 } // riego frecuente
    : style === "E" ? { min: 0.20, max: 0.30 } // helechos/tropicales
    : { min: 0.15, max: 0.22 } // desconocido → C

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
// ---------- Pulverización ----------
// En verano hay más humedad ambiental, así que se espacia (×2).
// En invierno (calefacción, aire seco) se mantiene la frecuencia base.
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