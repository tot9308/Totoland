"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

export default function YearPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)

  const reload = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace("/"); return }
    const { data: mem } = await supabase.from("household_members")
      .select("household_id").eq("user_id", user.id).limit(1).single()
    if (!mem) { router.replace("/"); return }

    const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString()
    const { data: plants } = await supabase.from("plants").select("*").eq("household_id", mem.household_id)
    const { data: events } = await supabase.from("care_events")
      .select("plant_id, type, occurred_at")
      .in("plant_id", (plants ?? []).map(p => p.id))
      .gte("occurred_at", yearStart)
    const { data: photos } = await supabase.from("photos")
      .select("id, taken_at")
      .in("plant_id", (plants ?? []).map(p => p.id))
      .gte("taken_at", yearStart)

    const alive = (plants ?? []).filter(p => p.status !== "dead")
    const dead = (plants ?? []).filter(p => p.status === "dead")
    const wateringEvents = (events ?? []).filter(e => e.type === "watering")

    const byMonth = Array(12).fill(0)
    for (const e of events ?? []) {
      const m = new Date(e.occurred_at).getMonth()
      byMonth[m]++
    }
    const maxMonth = Math.max(...byMonth, 1)

    const speciesCount: Record<string, number> = {}
    for (const e of wateringEvents) {
      const p = (plants ?? []).find(x => x.id === e.plant_id)
      if (p?.species) speciesCount[p.species] = (speciesCount[p.species] ?? 0) + 1
    }
    const topSpecies = Object.entries(speciesCount).sort((a, b) => b[1] - a[1]).slice(0, 3)

    setStats({
      totalPlants: (plants ?? []).length,
      alive: alive.length,
      dead: dead.length,
      totalWaterings: wateringEvents.length,
      totalEvents: (events ?? []).length,
      totalPhotos: (photos ?? []).length,
      byMonth, maxMonth,
      topSpecies,
    })
    setLoading(false)
  }, [router])

  useEffect(() => { reload() }, [reload])

  return (
    <main className="min-h-screen bg-emerald-50 p-4 md:p-8">
      <header className="mb-6 flex items-center gap-3">
        <Link href="/" className="text-sm text-emerald-700 hover:underline">← Volver</Link>
        <h1 className="text-2xl font-bold text-emerald-900">📊 Tu año verde {new Date().getFullYear()}</h1>
      </header>

      {loading ? <p className="text-emerald-800">Cargando…</p> : (
        <>
          <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Plantas vivas" value={stats.alive} icon="🌱" />
            <Stat label="En el cementerio" value={stats.dead} icon="🪦" />
            <Stat label="Riegos" value={stats.totalWaterings} icon="💧" />
            <Stat label="Fotos" value={stats.totalPhotos} icon="📸" />
          </section>

          <section className="mb-6 rounded-xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-emerald-900">Eventos por mes</h2>
            <div className="flex items-end gap-1" style={{ height: 120 }}>
              {stats.byMonth.map((v: number, i: number) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-emerald-500"
                    style={{ height: `${(v / stats.maxMonth) * 100}%`, minHeight: v > 0 ? 4 : 0 }}
                    title={`${MESES[i]}: ${v}`}
                  />
                  <span className="text-[10px] text-emerald-700">{MESES[i]}</span>
                </div>
              ))}
            </div>
          </section>

          {stats.topSpecies.length > 0 && (
            <section className="mb-6 rounded-xl bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-lg font-semibold text-emerald-900">Especies más regadas</h2>
              <ul className="space-y-1 text-sm text-emerald-800">
                {stats.topSpecies.map(([sp, count]: any, i: number) => (
                  <li key={sp}>
                    {["🥇", "🥈", "🥉"][i]} {sp}: {count} riegos
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-lg font-semibold text-emerald-900">Resumen</h2>
            <p className="text-sm text-emerald-800">
              Este año has cuidado <b>{stats.alive}</b> plantas, con <b>{stats.totalWaterings}</b> riegos
              y <b>{stats.totalEvents}</b> eventos en total.
              {stats.dead > 0 && <> En el cementerio descansan <b>{stats.dead}</b> plantas.</>}
              {" "}¡Buen trabajo! 🌿
            </p>
          </section>
        </>
      )}
    </main>
  )
}

function Stat({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="rounded-xl bg-white p-4 text-center shadow-sm">
      <div className="text-2xl">{icon}</div>
      <div className="text-2xl font-bold text-emerald-900">{value}</div>
      <div className="text-xs text-emerald-700">{label}</div>
    </div>
  )
}