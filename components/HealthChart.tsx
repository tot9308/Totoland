"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type Snap = { day: string; level: number }
const COLOR = ["#5a7d4a", "#c9a45a", "#b5603d"]

export default function HealthChart({ plantId }: { plantId: string }) {
  const [snaps, setSnaps] = useState<Snap[]>([])

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("health_snapshots")
        .select("day, level").eq("plant_id", plantId)
        .order("day", { ascending: true }).limit(120)
      setSnaps((data as Snap[]) ?? [])
    })()
  }, [plantId])

  if (!snaps.length) return null
  const green = snaps.filter(s => s.level === 0).length
  const pct = Math.round((green / snaps.length) * 100)

  return (
    <section className="mb-6 rounded-xl bg-[#faf7f0] p-4 shadow-sm dark:bg-stone-800">
      <h2 className="mb-2 font-serif text-lg font-semibold text-stone-800 dark:text-stone-100">
        📊 Salud · últimos {snaps.length} días
      </h2>
      <div className="flex flex-wrap gap-1">
        {snaps.map(s => (
          <span key={s.day} title={s.day}
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: COLOR[s.level] }} />
        ))}
      </div>
      <p className="mt-2 text-xs text-stone-600 dark:text-stone-300">
        {pct}% de días en verde ·
        <span style={{ color: COLOR[0] }}> ■ bien</span>
        <span style={{ color: COLOR[1] }}> ■ vigilante</span>
        <span style={{ color: COLOR[2] }}> ■ estrés</span>
      </p>
    </section>
  )
}