"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { ALL_ACHIEVEMENTS, type Achievement } from "@/lib/achievements"
import { type Plant } from "@/lib/plants"

export default function AchievementsModal({ householdId, plants, onClose }: {
  householdId: string
  plants: Plant[]
  onClose: () => void
}) {
  const [ach, setAch] = useState<(Achievement & { cur: number; target: number })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const ids = plants.map(p => p.id)
      const { data: evs } = await supabase.from("care_events")
        .select("plant_id, type, occurred_at")
        .in("plant_id", ids)
      const { data: phs } = await supabase.from("photos").select("id").in("plant_id", ids)

      const alive = plants.filter(p => p.status !== "dead")
      const species = new Set(alive.map(p => p.species).filter(Boolean)).size
      const events = (evs ?? []).length
      const photos = (phs ?? []).length

      // Puntualidad: para cada planta, ordeno sus riegos y miro el retraso de cada uno
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
      const cur: Record<string, number> = {
        first_plant: plants.length >= 1 ? 1 : 0,
        collector_10: alive.length,
        collector_25: alive.length,
        species_master: species,
        waterer_10: waterings,
        waterer_100: waterings,
        chronicler: events,
        photographer: photos,
        punctual_14: onTimeStreak,
        punctual_30: onTimeStreak,
        punctual_90: onTimeStreak,
        resurrection: 0,
      }
      const target: Record<string, number> = {
        first_plant: 1, collector_10: 10, collector_25: 25, species_master: 10,
        waterer_10: 10, waterer_100: 100, chronicler: 100, photographer: 50,
        punctual_14: 14, punctual_30: 30, punctual_90: 90, resurrection: 1,
      }

      const list = ALL_ACHIEVEMENTS.map(a => ({
        ...a,
        cur: cur[a.code] ?? 0,
        target: target[a.code] ?? 1,
        unlocked: (cur[a.code] ?? 0) >= (target[a.code] ?? 1),
        unlocked_at: null,
      }))

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        for (const a of list.filter(x => x.unlocked)) {
          await supabase.from("achievements").upsert(
            { household_id: householdId, user_id: user.id, code: a.code },
            { onConflict: "household_id,user_id,code" }
          )
        }
      }

      setAch(list)
      setLoading(false)
    })()
  }, [householdId, plants])

  const unlockedCount = ach.filter(a => a.unlocked).length

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-xl bg-[#faf7f0] p-5 shadow-xl">
        <h2 className="mb-1 text-lg font-semibold text-stone-800">🏆 Logros</h2>
        <p className="mb-4 text-xs text-stone-500">Desbloqueados: {unlockedCount} de {ach.length}.</p>
        {loading ? <p className="text-sm text-stone-600">Cargando…</p> : (
          <ul className="space-y-2">
            {ach.map(a => (
              <li key={a.code}
                className={`rounded-lg p-3 ${a.unlocked ? "bg-stone-50" : "bg-slate-100 opacity-70"}`}>
                <p className="flex items-center justify-between gap-2 font-medium text-stone-800">
                  <span className="flex items-center gap-2">
                    <span className="text-xl">{a.icon}</span>{a.title}
                    {a.unlocked && <span className="text-xs text-stone-500">✓</span>}
                  </span>
                  <span className="text-xs text-stone-600">
                    {Math.min(a.cur, a.target)}/{a.target}
                  </span>
                </p>
                <p className="mt-1 text-xs text-stone-600">{a.description}</p>
                <div className="mt-2 h-1.5 w-full rounded bg-stone-100">
                  <div className="h-1.5 rounded bg-stone-500"
                    style={{ width: `${Math.min(100, (a.cur / a.target) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="rounded px-3 py-2 text-stone-700 hover:bg-stone-100">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}