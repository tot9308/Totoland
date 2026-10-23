"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { dueDatesInRange, wateringDaySet, type Plant } from "@/lib/plants"
import { getActiveHouseholdId } from "@/lib/household"

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
  const [summerStart, setSummerStart] = useState(5)
  const [summerEnd, setSummerEnd] = useState(9)
  const [vacStart, setVacStart] = useState<string | null>(null)
  const [vacEnd, setVacEnd] = useState<string | null>(null)
  const [vacDays, setVacDays] = useState<Set<number>>(new Set())
  const [vacAffectedByDay, setVacAffectedByDay] = useState<Record<number, Plant[]>>({})

  const reload = useCallback(async () => {
    setLoading(true)
    console.log("[Calendar] reload started, year=", year, "month=", month)
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error("[Calendar] Auth error:", authError)
        router.replace("/")
        return
      }
      console.log("[Calendar] User:", user.id)
      const household_id = await getActiveHouseholdId(user.id)
      if (!household_id) {
        console.error("[Calendar] No active household found for user", user.id)
        router.replace("/")
        return
      }
      console.log("[Calendar] Household:", household_id)
      const mem = { household_id }
      const { data: pl, error: plantsError } = await supabase.from("plants").select("*")
        .eq("household_id", mem.household_id).neq("status", "dead").order("name")
      if (plantsError) {
        console.error("[Calendar] Plants error:", plantsError)
      }
      const plantsArr = (pl as Plant[]) ?? []
      console.log("[Calendar] Plants loaded:", plantsArr.length, plantsArr.map(p => p.name))
      setPlants(plantsArr)
      const { data: hh, error: hhError } = await supabase.from("households")
        .select("summer_start_month, summer_end_month, vacation_start, vacation_end").eq("id", mem.household_id).single()
      if (hhError) {
        console.error("[Calendar] Household error:", hhError)
      }
      if (hh) {
        setSummerStart(hh.summer_start_month ?? 5)
        setSummerEnd(hh.summer_end_month ?? 9)
        setVacStart(hh.vacation_start ?? null)
        setVacEnd(hh.vacation_end ?? null)
      }

      const start = new Date(year, month, 1).toISOString()
      const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString()
      const ids = plantsArr.map(p => p.id)
      console.log("[Calendar] Plant IDs:", ids)
      if (ids.length) {
        const { data: ev, error: eventsError } = await supabase.from("care_events")
          .select("id, plant_id, type, occurred_at, notes")
          .in("plant_id", ids)
          .gte("occurred_at", start).lte("occurred_at", end)
        if (eventsError) {
          console.error("[Calendar] Events error:", eventsError)
        }
        setEvents((ev as EventRow[]) ?? [])
      } else setEvents([])
      const { data: tk, error: tasksError } = await supabase.from("tasks")
        .select("id, title, plant_id, type")
        .eq("household_id", mem.household_id)
        .eq("month", month + 1).eq("year", year)
      if (tasksError) {
        console.error("[Calendar] Tasks error:", tasksError)
      }
      setTasks((tk as TaskRow[]) ?? [])
      console.log("[Calendar] reload completed OK")
    } catch (err) {
      console.error("[Calendar] Reload error:", err)
    } finally {
      setLoading(false)
    }
  }, [router, year, month])

  useEffect(() => { setLoading(true); reload() }, [reload])

  useEffect(() => {
    if (!vacStart || !vacEnd) {
      setVacDays(new Set())
      setVacAffectedByDay({})
      return
    }
    const vs = new Date(vacStart)
    const ve = new Date(vacEnd)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const vacSet = new Set<number>()
    const affectedByDay: Record<number, Plant[]> = {}

    for (let d = 1; d <= daysInMonth; d++) {
      const dayDate = new Date(year, month, d)
      if (dayDate >= vs && dayDate <= ve) {
        vacSet.add(d)
        const affected: Plant[] = []
        for (const p of plants) {
          const dueDates = dueDatesInRange(p, dayDate, dayDate, summerStart, summerEnd)
          if (dueDates.length > 0) affected.push(p)
        }
        affectedByDay[d] = affected
      }
    }
    setVacDays(vacSet)
    setVacAffectedByDay(affectedByDay)
  }, [plants, vacStart, vacEnd, year, month, summerStart, summerEnd])

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
  try {
    for (const p of plants ?? []) {
      try {
        const set = wateringDaySet(p)
        if (set) {
          for (const date of dueDatesInRange(p, new Date(year, month, 1), new Date(year, month, daysInMonth), summerStart, summerEnd)) {
            const d = date.getDate()
            if (date >= todayMid && byDay[d]) byDay[d].due.push(p)
          }
          continue
        }
        const inSummer = (month + 1) >= summerStart && (month + 1) <= summerEnd
        const f = inSummer
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
      } catch (e) {
        console.error("Error calculando riego para planta", p.id, p.name, e)
      }
    }
  } catch (e) {
    console.error("Error en bucle de riegos del calendario:", e)
  }

  const selectedData = selDay ? byDay[selDay] : null
  const selectedIsVacation = selDay ? vacDays.has(selDay) : false
  const selectedVacAffected = selectedIsVacation && selDay !== null ? (vacAffectedByDay[selDay] ?? []) : []

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
              const isVacation = vacDays.has(d)
              const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear()
              const hasItems = data.events.length + data.tasks.length + data.due.length > 0
              const vacAffected = isVacation ? (vacAffectedByDay[d] ?? []) : []
              return (
                <button
                  key={d}
                  onClick={() => setSelDay(selDay === d ? null : d)}
                  className={`min-h-[60px] rounded-lg border p-1.5 text-left transition
                    ${selDay === d ? "border-[#c97b5e] bg-[#c97b5e]/10" : isVacation ? "border-[#eab308] bg-[#fef3c7]/30" : "border-stone-200 bg-[#faf7f0] hover:bg-stone-100"}
                    ${isToday ? "ring-2 ring-[#5a7d4a]" : ""}
                    ${isVacation ? "ring-1 ring-[#eab308]" : ""}`}
                >
                  <div className={`text-xs font-semibold ${isToday ? "text-[#5a7d4a]" : isVacation ? "text-[#854d0e]" : "text-stone-700"}`}>{d}</div>
                  {(hasItems || vacAffected.length > 0) && (
                    <div className="mt-1 flex flex-wrap gap-0.5">
                      {data.events.some(e => e.type === "watering") && <span className="text-[10px]">💧</span>}
                      {data.events.some(e => e.type !== "watering") && <span className="text-[10px]">📝</span>}
                      {data.due.length > 0 && <span className="text-[10px] text-[#c97b5e]">⏰{data.due.length}</span>}
                      {data.tasks.length > 0 && <span className="text-[10px]">📋</span>}
                      {isVacation && vacAffected.length > 0 && <span className="text-[10px] text-[#854d0e]">🏖️{vacAffected.length}</span>}
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
                  {selectedIsVacation && selectedVacAffected.length > 0 && (
                    <div>
                      <h3 className="mb-1 text-xs font-semibold uppercase text-[#854d0e]">🏖️ Día de vacaciones - plantas con riego pendiente</h3>
                      <ul className="space-y-1">
                        {selectedVacAffected.map((p: Plant) => (
                          <li key={p.id} className="text-sm text-stone-700">
                            💧 <Link href={`/plant/${p.id}`} className="font-medium hover:underline">{p.name}</Link>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-1 text-xs text-stone-500">
                        Los avisos de riego están ocultos durante las vacaciones. Usa "Adelantar riegos" en Ajustes si quieres regar antes de salir.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3 rounded-lg bg-[#faf7f0] p-3 text-xs text-stone-600 shadow-sm">
            <span>💧 riego hecho</span>
            <span>📝 otro evento</span>
            <span className="text-[#c97b5e]">⏰ riego previsto</span>
            <span>📋 tareas del mes</span>
            <span className="text-[#854d0e]">🏖️ día de vacaciones</span>
          </div>
        </>
      )}
    </main>
  )
}