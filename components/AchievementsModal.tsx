"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { ALL_ACHIEVEMENTS, type Achievement } from "@/lib/achievements"
import { type Plant } from "@/lib/plants"

type Stats = {
  alive: number
  species: number
  events: number
  photos: number
  waterings: number
  lateDays: number
  revives: number
}

export default function AchievementsModal({ householdId, plants, onClose }: {
  householdId: string
  plants: Plant[]
  onClose: () => void
}) {
  const [ach, setAch] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const { data: evs } = await supabase.from("care_events")
        .select("type, occurred_at")
        .in("plant_id", plants.map(p => p.id))
        .order("occurred_at", { ascending: true })
      const { data: phs } = await supabase.from("photos")
        .select("id").in("plant_id", plants.map(p => p.id))

      const waterings = (evs ?? []).filter(e => e.type === "watering").map(e => new Date(e.occurred_at).getTime())
      waterings.sort((a, b) => a - b)
      let maxStreak = 0, curStreak = 0
      for (let i = 0; i < waterings.length; i++) {
        const next = waterings[i + 1]
        if (!next) break
        const diffDays = Math.round((next - waterings[i]) / 86400000)
        if (diffDays <= 2) curStreak++
        else { curStreak = 0 }
        if (curStreak > maxStreak) maxStreak = curStreak
      }

      const stats: Stats = {
        alive: plants.filter(p => p.status !== "dead").length,
        species: new Set(plants.filter(p => p.status !== "dead").map(p => p.species).filter(Boolean)).size,
        events: (evs ?? []).length,
        photos: (phs ?? []).length,
        waterings: waterings.length,
        lateDays: maxStreak,
        revives: 0,
      }

      const unlocked: Record<string, boolean> = {
        first_plant: plants.length >= 1,
        collector_10: stats.alive >= 10,
        collector_25: stats.alive >= 25,
        chronicler: stats.events >= 100,
        photographer: stats.photos >= 50,
        punctual_7: maxStreak >= 7,
        punctual_14: maxStreak >= 14,
        punctual_30: maxStreak >= 30,
        waterer_10: stats.waterings >= 10,
        waterer_100: stats.waterings >= 100,
        resurrection: false,
        species_master: stats.species >= 10,
      }

      const list: Achievement[] = ALL_ACHIEVEMENTS.map(a => ({
        ...a,
        unlocked: unlocked[a.code] ?? false,
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
      <div className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
        <h2 className="mb-1 text-lg font-semibold text-emerald-900">🏆 Logros</h2>
        <p className="mb-4 text-xs text-emerald-600">
          Desbloqueados: {unlockedCount} de {ach.length}.
        </p>
        {loading ? <p className="text-sm text-emerald-700">Cargando…</p> : (
          <ul className="space-y-2">
            {ach.map(a => (
              <li key={a.code}
                className={`rounded-lg p-3 ${a.unlocked ? "bg-emerald-50" : "bg-slate-100 opacity-60"}`}>
                <p className="flex items-center gap-2 font-medium text-emerald-900">
                  <span className="text-xl">{a.icon}</span>
                  {a.title}
                  {a.unlocked && <span className="text-xs text-emerald-600">✓</span>}
                </p>
                <p className="text-xs text-emerald-700">{a.description}</p>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex justify-end">
          <button onClick={onClose}
            className="rounded px-3 py-2 text-emerald-800 hover:bg-emerald-50">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}