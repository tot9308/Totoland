export type Achievement = {
  code: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  unlocked_at: string | null
}

export const ALL_ACHIEVEMENTS = [
  { code: "first_plant", title: "Primera planta", description: "Añadiste tu primera planta a Totoland.", icon: "🌱" },
  { code: "collector_10", title: "Coleccionista", description: "10 plantas vivas en casa.", icon: "🌿" },
  { code: "collector_25", title: "Jardín en casa", description: "25 plantas vivas en casa.", icon: "🌳" },
  { code: "species_master", title: "Catálogo vivo", description: "10 especies diferentes en casa.", icon: "🏛️" },
  { code: "waterer_10", title: "Primeros riegos", description: "10 riegos totales registrados.", icon: "💧" },
  { code: "waterer_100", title: "Regador experto", description: "100 riegos totales.", icon: "💦" },
  { code: "chronicler", title: "Cronista", description: "100 eventos registrados en el historial.", icon: "📖" },
  { code: "photographer", title: "Fotógrafo de plantas", description: "50 fotos subidas.", icon: "📸" },
  { code: "punctual_14", title: "Quincena puntual", description: "14 riegos seguidos a tiempo (sin retraso).", icon: "⏰" },
  { code: "punctual_30", title: "Mes puntual", description: "30 riegos seguidos a tiempo.", icon: "📅" },
  { code: "punctual_90", title: "Trimestre impecable", description: "90 riegos seguidos a tiempo. Leyenda.", icon: "🏅" },
  { code: "resurrection", title: "Resurrección", description: "Has revivido una planta del cementerio.", icon: "✨" },
  { code: "collector_50", title: "Jardín botánico personal", description: "50 plantas vivas en casa.", icon: "🌳" },
  { code: "locations_10", title: "Ubicaciones variadas", description: "Plantas en 10 ubicaciones distintas.", icon: "🗺️" },
  { code: "waterer_1000", title: "Veterano de plantas", description: "1.000 riegos totales registrados.", icon: "💦💦" },
  { code: "photographer_100", title: "Álbum completo", description: "100 fotos subidas.", icon: "📸📸" },
  { code: "chronicler_500", title: "Diario de a bordo", description: "500 eventos registrados en el historial.", icon: "📔" },
  { code: "species_25", title: "Bibliotecario botánico", description: "25 especies diferentes en casa.", icon: "📚" },
  { code: "active_100", title: "Cien días cuidando", description: "Actividad registrada en 100 días distintos.", icon: "📅" },
  { code: "punctual_180", title: "Medio año impecable", description: "180 riegos seguidos a tiempo.", icon: "🏅" },
  { code: "anniversary_365", title: "Un año de cuidados", description: "365 días desde tu primer riego.", icon: "🎂" },
  { code: "resurrector_3", title: "Resucitador en serie", description: "3 recuperaciones completadas del cementerio.", icon: "🦋" },
]
import { supabase } from "./supabase"
import type { Plant } from "./plants"

export async function detectNewAchievements(userId: string, householdId: string, plants: Plant[]): Promise<Achievement[]> {
  // 1. Cargar datos necesarios
  const ids = plants.map(p => p.id)
  const { data: evs } = await supabase.from("care_events")
    .select("plant_id, type, occurred_at")
    .in("plant_id", ids)
  const { data: phs } = await supabase.from("photos").select("id").in("plant_id", ids)

  // 2. Calcular métricas
  const alive = plants.filter(p => p.status !== "dead")
  const species = new Set(alive.map(p => p.species).filter(Boolean)).size
  const locations = new Set(alive.map(p => p.location).filter(Boolean)).size
  const events = (evs ?? []).length
  const photos = (phs ?? []).length

  // Puntualidad
  const byPlant: Record<string, number[]> = {}
  for (const e of evs ?? []) {
    if (e.type !== "watering") continue
    ;(byPlant[e.plant_id] ??= []).push(new Date(e.occurred_at).getTime())
  }
  let onTimeStreak = 0
  const allOnTime: { t: number; ok: boolean }[] = []
  for (const p of plants) {
    const freq = p.watering_frequency_days
    const times = (byPlant[p.id] ?? []).sort((a, b) => a - b)
    for (let i = 0; i < times.length; i++) {
      let ok = true
      if (i > 0 && freq) {
        const gap = Math.round((times[i] - times[i - 1]) / 86400000)
        ok = gap <= freq + 2
      }
      allOnTime.push({ t: times[i], ok })
    }
  }
  allOnTime.sort((a, b) => b.t - a.t)
  for (const x of allOnTime) {
    if (x.ok) onTimeStreak++
    else break
  }

  const waterings = allOnTime.length

  // Días activos (días distintos con al menos un evento)
  const activeDays = new Set((evs ?? []).map(e => new Date(e.occurred_at).toISOString().split('T')[0])).size

  // Recuperaciones completadas (buscar en care_events notas con "recuperada ✅")
  const { data: recoveries } = await supabase.from("care_events")
    .select("id").in("plant_id", ids)
    .ilike("notes", "%recuperada%")
  const recoveryCount = (recoveries ?? []).length

  // Antigüedad desde primer riego
  const firstWatering = allOnTime.length > 0 ? new Date(allOnTime[allOnTime.length - 1].t) : null
  const daysSinceFirst = firstWatering ? Math.floor((Date.now() - firstWatering.getTime()) / 86400000) : 0

  // 3. Calcular progreso de cada logro
  const cur: Record<string, number> = {
    first_plant: plants.length >= 1 ? 1 : 0,
    collector_10: alive.length,
    collector_25: alive.length,
    collector_50: alive.length,
    species_master: species,
    species_25: species,
    locations_10: locations,
    waterer_10: waterings,
    waterer_100: waterings,
    waterer_1000: waterings,
    chronicler: events,
    chronicler_500: events,
    photographer: photos,
    photographer_100: photos,
    punctual_14: onTimeStreak,
    punctual_30: onTimeStreak,
    punctual_90: onTimeStreak,
    punctual_180: onTimeStreak,
    resurrection: recoveryCount,
    resurrector_3: recoveryCount,
    active_100: activeDays,
    anniversary_365: daysSinceFirst,
  }
  const target: Record<string, number> = {
    first_plant: 1, collector_10: 10, collector_25: 25, collector_50: 50,
    species_master: 10, species_25: 25, locations_10: 10,
    waterer_10: 10, waterer_100: 100, waterer_1000: 1000,
    chronicler: 100, chronicler_500: 500,
    photographer: 50, photographer_100: 100,
    punctual_14: 14, punctual_30: 30, punctual_90: 90, punctual_180: 180,
    resurrection: 1, resurrector_3: 3,
    active_100: 100, anniversary_365: 365,
  }
  // 4. Detectar logros desbloqueados
  const unlocked = ALL_ACHIEVEMENTS
    .filter(a => (cur[a.code] ?? 0) >= (target[a.code] ?? 1))
    .map(a => a.code)

  // 5. Comparar con lo que ya está en BD
  const { data: existing } = await supabase.from("achievements")
    .select("code").eq("household_id", householdId).eq("user_id", userId)
  const existingCodes = new Set((existing ?? []).map(e => e.code))
  const newOnes = unlocked.filter(code => !existingCodes.has(code))

  // 6. Insertar los nuevos
  for (const code of newOnes) {
    await supabase.from("achievements").upsert(
      { household_id: householdId, user_id: userId, code },
      { onConflict: "household_id,user_id,code" }
    )
  }

  // 7. Devolver los logros recién desbloqueados
  return ALL_ACHIEVEMENTS.filter(a => newOnes.includes(a.code)).map(a => ({
    ...a,
    unlocked: true,
    unlocked_at: new Date().toISOString(),
  }))
}