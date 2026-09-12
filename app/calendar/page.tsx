"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { dueDatesInRange, wateringDaySet, type Plant } from "@/lib/plants"

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
const DIAS = ["L","M","X","J","V","S","D"]

type EventRow = { id: string; plant_id: string; type: string; occurred_at: string; notes: string | null }
type TaskRow = { id: string; title: string; plant_id: string | null; type: string }

export default function CalendarPage() {
  const router = useRouter()
  const today = new Date()
  const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [plants, setPlants] = useState<Plant[]>([])
  const [events, setEvents] = useState<EventRow[]>([])
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selDay, setSelDay] = useState<number | null>(null)

  const reload = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace("/"); return }
    const { data: mem } = await supabase.from("household_members")
      .select("household_id").eq("user_id", user.id).limit(1).single()
    if (!mem) { router.replace("/"); return }
    const { data: pl } = await supabase.from("plants").select("*")
      .eq("household_id", mem.household_id).neq("status", "dead").order("name")
    setPlants((pl as Plant[]) ?? [])

    const start = new Date(year, month, 1).toISOString()
    const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString()
    const ids = ((pl as Plant[]) ?? []).map(p => p.id)
    if (ids.length) {
      const { data: ev } = await supabase.from("care_events")
        .select("id, plant_id, type, occurred_at, notes")
        .in("plant_id", ids)
        .gte("occurred_at", start).lte("occurred_at", end)
      setEvents((ev as EventRow[]) ?? [])
    } else setEvents([])
    const { data: tk } = await supabase.from("tasks")
      .select("id, title, plant_id, type")
      .eq("household_id", mem.household_id)
      .eq("month", month + 1).eq("year", year)
    setTasks((tk as TaskRow[]) ?? [])
    setLoading(false)
  }, [router, year, month])

  useEffect(() => { setLoading(true); reload() }, [reload])

  const firstDay = new Date(year, month, 1).getDay()
  const offset = (firstDay + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthEnd = new Date(year, month, daysInMonth, 23, 59, 59)

  const byDay: Record<number, { events: EventRow[]; tasks: TaskRow[]; due: Plant[] }> = {}
  for (let d = 1; d <= daysInMonth; d++) byDay[d] = { events: [], tasks: [], due: [] }

  for (const e of events) {
    const day = new Date(e.occurred_at).getDate()
    if (byDay[day]) byDay[day].events.push(e)
  }
  for (const t of tasks) {
    if (byDay[1]) byDay[1].tasks.push(t)
  }

  // Próximos riegos previstos (solo desde hoy en adelante)
  for (const p of plants) {
    const set = wateringDaySet(p)
    if (set) {
      for (const date of dueDatesInRange(p, new Date(year, month, 1), new Date(year, month, daysInMonth))) {
        const d = date.getDate()
        if (date >= todayMid && byDay[d]) byDay[d].due.push(p)
      }
      continue
    }
    const f = month >= 4 && month <= 8
      ? Number(p.watering_frequency_days)
      : Number(p.watering_frequency_winter_days ?? p.watering_frequency_days)
    if (!f) continue
    const last = p.last_watered_at ? new Date(p.last_watered_at) : null
    let next = last ? new Date(last.getTime() + f * 86400000) : new Date(year, month, 1)
    while (next < new Date(year, month, 1)) next = new Date(next.getTime() + f * 86400000)
    while (next <= monthEnd) {
      const d = next.getDate()
      if (next >= todayMid && byDay[d]) byDay[d].due.push(p)
      next = new Date(next.getTime() + f * 86400000)
    }
  }

  const selectedData = selDay ? byDay[selDay] : null

  return (
    <main className="min-h-screen bg-stone-50 p-4 md:p-8">
      <header className="mb-6 flex flex-wrap items-center gap-3">
        <Link href="/" className="text-sm text-stone-600 hover:underline">← Volver</Link>
        <h1 className="font-serif text-2xl font-bold text-stone-800">📅 Calendario</h1>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => { if (month === 0) { setYear(year - 1); setMonth(11) } else setMonth(month - 1) }}
            className="rounded bg-[#faf7f0] px-3 py-1 text-stone-700 shadow-sm hover:bg-stone-100">‹</button>
          <span className="min-w-[160px] text-center font-medium text-stone-800">
            {MESES[month]} {year}
          </span>
          <button onClick={() => { if (month === 11) { setYear(year + 1); setMonth(0) } else setMonth(month + 1) }}
            className="rounded bg-[#faf7f0] px-3 py-1 text-stone-700 shadow-sm hover:bg-stone-100">›</button>
        </div>
      </header>

      {loading ? (
        <p className="text-stone-600">Cargando…</p>
      ) : (
        <>
          <div className="mb-1 grid grid-cols-7 gap-1">
            {DIAS.map(d => (
              <div key={d} className="text-center text-xs font-medium text-stone-500">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: offset }).map((_, i) => <div key={"e" + i} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1
              const data = byDay[d]
              const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear()
              const hasItems = data.events.length + data.tasks.length + data.due.length > 0
              return (
                <button
                  key={d}
                  onClick={() => setSelDay(selDay === d ? null : d)}
                  className={`min-h-[60px] rounded-lg border p-1.5 text-left transition
                    ${selDay === d ? "border-[#c97b5e] bg-[#c97b5e]/10" : "border-stone-200 bg-[#faf7f0] hover:bg-stone-100"}
                    ${isToday ? "ring-2 ring-[#5a7d4a]" : ""}
                  `}
                >
                  <div className={`text-xs font-semibold ${isToday ? "text-[#5a7d4a]" : "text-stone-700"}`}>{d}</div>
                  {hasItems && (
                    <div className="mt-1 flex flex-wrap gap-0.5">
                      {data.events.some(e => e.type === "watering") && <span className="text-[10px]">💧</span>}
                      {data.events.some(e => e.type !== "watering") && <span className="text-[10px]">📝</span>}
                      {data.due.length > 0 && <span className="text-[10px] text-[#c97b5e]">⏰{data.due.length}</span>}
                      {data.tasks.length > 0 && <span className="text-[10px]">📋</span>}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {selectedData && selDay && (
            <div className="mt-6 rounded-xl bg-[#faf7f0] p-4 shadow-sm">
              <h2 className="mb-3 font-serif text-lg font-semibold text-stone-800">
                {selDay} de {MESES[month]}
              </h2>
              {selectedData.events.length === 0 && selectedData.tasks.length === 0 && selectedData.due.length === 0 ? (
                <p className="text-sm text-stone-600">Sin actividad este día.</p>
              ) : (
                <div className="space-y-3">
                  {selectedData.events.length > 0 && (
                    <div>
                      <h3 className="mb-1 text-xs font-semibold uppercase text-stone-500">Hecho</h3>
                      <ul className="space-y-1">
                        {selectedData.events.map(e => (
                          <li key={e.id} className="text-sm text-stone-700">
                            {e.type === "watering" ? "💧" : "📝"}{" "}
                            <b>{plants.find(p => p.id === e.plant_id)?.name ?? "?"}</b>
                            {e.notes && <span className="text-stone-500"> · {e.notes}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedData.due.length > 0 && (
                    <div>
                      <h3 className="mb-1 text-xs font-semibold uppercase text-[#c97b5e]">Próximo riego previsto</h3>
                      <ul className="space-y-1">
                        {selectedData.due.map(p => (
                          <li key={p.id} className="text-sm text-stone-700">
                            💧 <Link href={`/plant/${p.id}`} className="font-medium hover:underline">{p.name}</Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedData.tasks.length > 0 && (
                    <div>
                      <h3 className="mb-1 text-xs font-semibold uppercase text-stone-500">Tareas del mes</h3>
                      <ul className="space-y-1">
                        {selectedData.tasks.map(t => (
                          <li key={t.id} className="text-sm text-stone-700">📋 {t.title}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3 rounded-lg bg-white p-3 text-xs text-stone-600 shadow-sm">
            <span>💧 riego hecho</span>
            <span>📝 otro evento</span>
            <span className="text-[#c97b5e]">⏰ riego previsto</span>
            <span>📋 tareas del mes</span>
          </div>
        </>
      )}
    </main>
  )
}