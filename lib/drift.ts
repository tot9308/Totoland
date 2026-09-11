import { supabase } from "./supabase"
import { daysUntilDue, wateringDaySet, type Plant } from "./plants"

// Si la planta tiene días fijos y el retraso al regar supera el umbral,
// desplaza el patrón de días para re-anclarlo al día en que riegas.
export async function applyDrift(plant: Plant, driftDays: number, summerStart: number, summerEnd: number) {
  if (!plant.watering_days || driftDays <= 0) return
  const du = daysUntilDue(plant, summerStart, summerEnd)
  const R = du !== null && du < 0 ? -du : 0
  if (R < driftDays) return
  const set = wateringDaySet(plant)
  if (!set) return
  const newSet = [...new Set(set.map(d => (d + R) % 7))].sort((a, b) => a - b)
  await supabase.from("plants").update({ watering_days: newSet.join(",") }).eq("id", plant.id)
}