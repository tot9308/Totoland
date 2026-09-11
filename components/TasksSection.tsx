"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { ensureMonthlyTasks, TASK_ICONS, type Task } from "@/lib/tasks"
import { type Plant } from "@/lib/plants"

export default function TasksSection({ householdId, plants, onChanged }: {
  householdId: string
  plants: Plant[]
  onChanged: () => void
}) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  async function load() {
    await ensureMonthlyTasks(householdId, plants, month, year)
    const { data } = await supabase.from("tasks").select("*")
      .eq("household_id", householdId).eq("month", month).eq("year", year)
      .order("created_at")
    setTasks((data as Task[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [householdId])

  async function setStatus(t: Task, status: "done" | "dismissed") {
    await supabase.from("tasks").update({
      status,
      completed_at: status === "done" ? new Date().toISOString() : null,
    }).eq("id", t.id)
    onChanged()
    await load()
  }

  const pending = tasks.filter(t => t.status === "pending")
  if (loading || pending.length === 0) return null

  return (
    <section className="mb-6">
      <h2 className="mb-2 text-lg font-semibold text-stone-800">🗓️ Tareas del mes</h2>
      <ul className="space-y-2">
        {pending.map(t => (
          <li key={t.id} className="rounded-xl bg-[#f7f0e3] p-3 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-stone-800">
                  <span className="mr-1">{TASK_ICONS[t.type] ?? "📋"}</span>{t.title}
                </p>
                {t.description && <p className="mt-1 text-xs text-stone-600">{t.description}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => setStatus(t, "done")}
                  className="rounded bg-[#5a7d4a] px-2 py-1 text-xs text-white hover:bg-[#4a6a3a]">✓ Hecho</button>
                <button onClick={() => setStatus(t, "dismissed")}
                  className="rounded bg-[#faf7f0] px-2 py-1 text-xs text-stone-600 hover:bg-stone-200">✗ Saltar</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}