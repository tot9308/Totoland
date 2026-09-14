"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { waterAmountFor, type Plant } from "@/lib/plants"
import { findSpecies } from "@/lib/species"
import { getActiveHouseholdId } from "@/lib/household"

type Ev = { plant_id: string; occurred_at: string }

export default function WaterStats() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [rows, setRows] = useState<{ name: string; liters: number }[]>([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const household_id = await getActiveHouseholdId(user.id)
      if (!household_id) return
      const mem = { household_id }
      const { data: pl } = await supabase.from("plants")
        .select("*").eq("household_id", mem.household_id)
      const plants = (pl as Plant[]) ?? []
      const start = new Date(year, 0, 1).toISOString()
      const end = new Date(year, 11, 31, 23, 59, 59).toISOString()
      const ids = plants.map(p => p.id)
      if (!ids.length) { setRows([]); setTotal(0); return }
      const { data: ev } = await supabase.from("care_events")
        .select("plant_id, occurred_at").in("plant_id", ids)
        .eq("type", "watering").gte("occurred_at", start).lte("occurred_at", end)
      const per = new Map<string, number>()
      for (const e of (ev as Ev[]) ?? []) {
        const p = plants.find(x => x.id === e.plant_id)
        if (!p || !p.pot_diameter_cm) continue
        const style = findSpecies(p.species ?? "")?.water ?? "B"
        const amt = waterAmountFor(p.pot_diameter_cm, style)
        per.set(e.plant_id, (per.get(e.plant_id) ?? 0) + (amt.min + amt.max) / 2)
      }
      const list = plants
        .map(p => ({ name: p.name, liters: (per.get(p.id) ?? 0) / 1000 }))
        .filter(r => r.liters > 0)
        .sort((a, b) => b.liters - a.liters)
      setRows(list)
      setTotal(list.reduce((s, r) => s + r.liters, 0))
    })()
  }, [year])

  const max = rows.length ? rows[0].liters : 1

  return (
    <section className="mb-6 rounded-xl bg-[#faf7f0] p-4 shadow-sm dark:bg-stone-800">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold text-stone-800 dark:text-stone-100">💧 Agua regada</h2>
        <select value={year} onChange={e => setYear(Number(e.target.value))}
          className="rounded border border-stone-300 px-2 py-1 text-sm dark:border-stone-600 dark:bg-stone-700">
          {[0, 1, 2].map(i => (
            <option key={i} value={new Date().getFullYear() - i}>{new Date().getFullYear() - i}</option>
          ))}
        </select>
      </div>
      <p className="mb-3 text-sm text-stone-700 dark:text-stone-200">
        Total del año: <b>{total.toFixed(1)} L</b> <span className="text-xs text-stone-500">(estimado por tamaño de maceta)</span>
      </p>
      <ul className="space-y-2">
        {rows.map(r => (
          <li key={r.name}>
            <div className="flex justify-between text-xs text-stone-700 dark:text-stone-200">
              <span>{r.name}</span><span>{r.liters.toFixed(1)} L</span>
            </div>
            <div className="h-2 rounded bg-stone-200 dark:bg-stone-600">
              <div className="h-2 rounded bg-[#5a8ca6]" style={{ width: `${(r.liters / max) * 100}%` }} />
            </div>
          </li>
        ))}
        {!rows.length && (
          <p className="text-sm text-stone-600 dark:text-stone-300">
            Sin riegos con tamaño de maceta registrado este año.
          </p>
        )}
      </ul>
    </section>
  )
}