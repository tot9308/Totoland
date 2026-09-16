"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getActiveHouseholdId } from "@/lib/household"
import { DEATH_CAUSES } from "@/lib/causes"

export default function CemeteryStats() {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [total, setTotal] = useState(0)

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const hhId = await getActiveHouseholdId(user.id)
      if (!hhId) return
      const { data: dead } = await supabase.from("plants")
        .select("death_cause").eq("household_id", hhId).eq("status", "dead")
      const c: Record<string, number> = {}
      for (const d of dead ?? []) {
        const k = d.death_cause ?? "unknown"
        c[k] = (c[k] ?? 0) + 1
      }
      setCounts(c)
      setTotal((dead ?? []).length)
    })()
  }, [])

  if (total === 0) return null
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1])

  return (
    <section className="mb-6 rounded-xl bg-[#f5ece6] p-4 shadow-sm dark:bg-stone-800">
      <h2 className="mb-1 font-serif text-lg font-semibold text-stone-800 dark:text-stone-100">
        📖 Qué estoy aprendiendo
      </h2>
      <p className="mb-3 text-xs text-stone-600 dark:text-stone-300">
        {total} planta{total !== 1 ? "s" : ""} enterrada{total !== 1 ? "s" : ""} en esta casa. Tu patrón de bajas:
      </p>
      <ul className="space-y-2">
        {entries.map(([k, n]) => (
          <li key={k}>
            <div className="mb-0.5 flex justify-between text-sm text-stone-700 dark:text-stone-200">
              <span>{DEATH_CAUSES[k] ?? "No lo sé"}</span>
              <span>{n}</span>
            </div>
            <div className="h-1.5 w-full rounded bg-stone-200 dark:bg-stone-700">
              <div className="h-1.5 rounded bg-[#b5603d]" style={{ width: `${(n / total) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-stone-600 dark:text-stone-300">
        💡 Si una causa se repite, revisa esa rutina: suele ser el verdadero culpable.
      </p>
    </section>
  )
}