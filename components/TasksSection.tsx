"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { MONTHLY_TASKS, SPECIES_MONTHLY_TASKS, TASK_ICONS, type Task } from "@/lib/tasks"
import { type Plant } from "@/lib/plants"

export default function TasksSection({ householdId, plants, onChanged }: {
  householdId: string
  plants: Plant[]
  onChanged: () => void
}) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  async function load() {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("household_id", householdId)
      .eq("year", currentYear)
      .eq("month", currentMonth)
      .order("created_at")
    setTasks((data as Task[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    (async () => {
      await load()
      await maybeGenerate()
      await load()
    })()
  }, [householdId])

  async function maybeGenerate() {
    const { data: existing } = await supabase
      .from("tasks").select("id").eq("household_id", householdId)
      .eq("year", currentYear).eq("month", currentMonth).limit(1)
    if (existing && existing.length > 0) return

    const toInsert: object[] = []
    for (const t of MONTHLY_TASKS.filter(m => m.month === currentMonth)) {
      toInsert.push({
        household_id: householdId, plant_id: null, type: t.type,
        title: t.title, description: t.description,
        month: currentMonth, year: currentYear,
      })
    }
    for (const p of plants) {
      if (p.status === "dead" || !p.species) continue
      const spec = SPECIES_MONTHLY_TASKS[p.species] ?? []
      for (const t of spec.filter(s => s.month === currentMonth)) {
        toInsert.push({
          household_id: householdId, plant_id: p.id, type: t.type,
          title: `${p.name}: ${t.title}`, description: t.description,
          month: currentMonth, year: currentYear,
        })
      }
    }
    if (toInsert.length > 0)
      await supabase.from("tasks").insert(toInsert)
  }

  async function complete(t: Task) {
    await supabase.from("tasks")
      .update({ status: "done", completed_at: new Date().toISOString() })
      .eq("id", t.id)
    onChanged()
    await load()
  }

  async function dismiss(t: Task) {
    await supabase.from("tasks")
      .update({ status: "dismissed" })
      .eq("id", t.id)
    await load()
  }

  const pending = tasks.filter(t => t.status === "pending")
  if (loading) return null
  if (pending.length === 0) return null

  return (
    <section className="mb-6">
      <h2 className="mb-2 text-lg font-semibold text-emerald-900">🗓️ Tareas del mes</h2>
      <ul className="space-y-2">
        {pending.map(t => (
          <li key={t.id} className="rounded-xl bg-amber-50 p-3 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-emerald-900">
                  <span className="mr-1">{TASK_ICONS[t.type] ?? "📋"}</span>{t.title}
                </p>
                {t.description && <p className="mt-1 text-xs text-emerald-700">{t.description}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => complete(t)}
                  className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700">
                  ✓ Hecho
                </button>
                <button onClick={() => dismiss(t)}
                  className="rounded bg-white px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-100">
                  ✗ Saltar
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}