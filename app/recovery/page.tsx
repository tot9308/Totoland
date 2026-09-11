"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { type Plant } from "@/lib/plants"
import { CHECKS, SEV_LABEL, TYPE_LABEL, resolveRecovery, type PType } from "@/lib/recovery"

type Ev = { id: string; plant_id: string; occurred_at: string; notes: string | null }

export default function RecoveryPage() {
  const router = useRouter()
  const [plants, setPlants] = useState<Plant[]>([])
  const [history, setHistory] = useState<(Ev & { plantName: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState("")

  const reload = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace("/"); return }
    setUserId(user.id)
    const { data: mem } = await supabase.from("household_members")
      .select("household_id").eq("user_id", user.id).limit(1).single()
    if (!mem) { router.replace("/"); return }
    const { data: pl } = await supabase.from("plants").select("*")
      .eq("household_id", mem.household_id).neq("status", "dead").order("name")
    const list = (pl as Plant[]) ?? []
    setPlants(list)
    const ids = list.map(p => p.id)
    if (ids.length) {
      const { data: evs } = await supabase.from("care_events")
        .select("id, plant_id, occurred_at, notes")
        .in("plant_id", ids)
        .eq("type", "observation")
        .order("occurred_at", { ascending: false })
        .limit(200)
      const rec = (evs ?? []).filter(e => (e.notes ?? "").includes("Chequeo de recuperación"))
      setHistory(rec.slice(0, 10).map(e => ({
        ...e,
        plantName: list.find(p => p.id === e.plant_id)?.name ?? "?",
      })))
    } else {
      setHistory([])
    }
    setLoading(false)
  }, [router])

  useEffect(() => { reload() }, [reload])

  const inRecovery = plants.filter(p => p.recovery_check_at)
  const now = Date.now()

  return (
    <main className="min-h-screen bg-stone-50 p-4 md:p-8">
      <header className="mb-6 flex items-center gap-3">
        <Link href="/" className="text-sm text-stone-600 hover:underline">← Volver</Link>
        <h1 className="text-2xl font-bold text-stone-800">🩺 Seguimiento de recuperación</h1>
      </header>

      <section className="mb-6 rounded-xl bg-[#faf7f0] p-4 text-sm text-stone-700 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold text-stone-800">Cómo funciona</h2>
        <p className="mb-1">
          Cuando una planta sufre sequía (o la marcas manualmente), Totoland calcula la{" "}
          <b>severidad</b> según su tipo y los días sin agua, y programa chequeos en los días
          3, 7, 21 y 45 según el caso. En cada chequeo evalúas síntomas y decides:
          recuperada, riego de apoyo o seguir vigilando.
        </p>
        <p>
          Durante 3 semanas desde el inicio hay <b>zona prohibida</b>: no abonar, no trasplantar,
          no poda drástica. La teoría completa y las instrucciones de rehidratación por tipo
          están en la <Link href="/guide" className="underline">📚 Guía</Link>.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-lg font-semibold text-stone-800">
          En recuperación ahora ({inRecovery.length})
        </h2>
        {loading ? <p className="text-stone-700">Cargando…</p> : inRecovery.length === 0 ? (
          <p className="rounded-xl bg-[#faf7f0] p-4 text-sm text-stone-600 shadow-sm">
            Ninguna planta en recuperación ahora mismo 🎉
          </p>
        ) : (
          <ul className="space-y-2">
            {inRecovery.map(p => {
              const sev = p.recovery_severity ?? "moderate"
              const steps = CHECKS[sev] ?? [3]
              const step = p.recovery_step ?? 1
              const t = new Date(p.recovery_check_at!).getTime()
              const due = t <= now
              return (
                <li key={p.id} className="rounded-xl bg-[#f5ece6] p-3 shadow-sm">
                  <p className="mb-2 text-sm text-stone-800">
                    <Link href={`/plant/${p.id}`} className="font-semibold hover:underline">{p.name}</Link>
                    {" · "}{SEV_LABEL[sev]}
                    {p.plant_type && <span> · {TYPE_LABEL[p.plant_type as PType]}</span>}
                    {" · "}chequeo {step}/{steps.length} · {due ? "toca hoy" : `en ${Math.ceil((t - now) / 86400000)} d`}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <button onClick={() => resolveRecovery(p, "ok", userId).then(reload)}
                      className="rounded bg-[#5a7d4a] px-2 py-1 text-xs text-white hover:bg-[#4a6a3a]">
                      ✅ Recuperada
                    </button>
                    <button onClick={() => resolveRecovery(p, "topup", userId).then(reload)}
                      className="rounded bg-[#5a8ca6] px-2 py-1 text-xs text-white hover:bg-[#497691]">
                      💧 Apoyo
                    </button>
                    <button onClick={() => resolveRecovery(p, "still", userId).then(reload)}
                      className="rounded bg-[#b5603d] px-2 py-1 text-xs text-white hover:bg-[#9c4f31]">
                      🩺 Maltrecha
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {history.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-stone-800">Historial reciente</h2>
          <ul className="space-y-1">
            {history.map(e => (
              <li key={e.id} className="rounded-lg bg-[#faf7f0] p-2 text-xs text-stone-600 shadow-sm">
                {new Date(e.occurred_at).toLocaleDateString("es-ES")} · <b>{e.plantName}</b> · {e.notes}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}