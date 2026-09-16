"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { getActiveHouseholdId } from "@/lib/household"
import { currentRecoveryStep, CULPRIT_LABEL } from "@/lib/protocols"
import type { Plant } from "@/lib/plants"

const DOT: Record<string, string> = { green: "🟢", yellow: "🟡", red: "🔴" }

type Rec = { title: string; culprit: string | null; stepTitle: string; day: number; due: boolean }
type Row = { plant: Plant; health: string | null; days: number; rec: Rec | null }

export default function InfirmaryPage() {
  const router = useRouter()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace("/"); return }
      const hhId = await getActiveHouseholdId(user.id)
      if (!hhId) { router.replace("/"); return }
      const { data: pl } = await supabase.from("plants")
        .select("*").eq("household_id", hhId).neq("status", "dead").order("name")
      const plants = (pl as Plant[]) ?? []
      const ids = plants.map(p => p.id)

      const healthMap: Record<string, { health: string; occurred_at: string }> = {}
      if (ids.length) {
        const { data: hs } = await supabase.from("care_events")
          .select("plant_id, health, occurred_at").in("plant_id", ids)
          .not("health", "is", null).order("occurred_at", { ascending: false })
        for (const h of hs ?? [])
          if (!healthMap[h.plant_id]) healthMap[h.plant_id] = { health: h.health!, occurred_at: h.occurred_at }
      }

      const out: Row[] = []
      for (const p of plants) {
        const hh = healthMap[p.id] ?? null
        const r = currentRecoveryStep(p)
        const rec: Rec | null = r ? {
          title: r.plan.title,
          culprit: p.recovery_culprit ? CULPRIT_LABEL[p.recovery_culprit] : null,
          stepTitle: r.step.title,
          day: r.day,
          due: r.isDueToday,
        } : null
        const days = hh ? Math.floor((Date.now() - new Date(hh.occurred_at).getTime()) / 86400000) : 0
        const sick = hh && hh.health !== "green"
        if (sick || rec) out.push({ plant: p, health: hh?.health ?? null, days, rec })
      }
      out.sort((a, b) => {
        const rank = (r: Row) => (r.health === "red" ? 0 : r.health === "yellow" ? 1 : 2)
        return rank(a) - rank(b)
      })
      setRows(out)
      setLoading(false)
    })()
  }, [router])

  return (
    <main className="min-h-screen bg-stone-50 p-4 md:p-8 dark:bg-stone-900">
      <header className="mb-6 flex items-center gap-3">
        <Link href="/" className="text-sm text-stone-600 hover:underline dark:text-stone-300">← Volver</Link>
        <h1 className="font-serif text-2xl font-bold text-stone-800 dark:text-stone-100">🩺 Enfermería</h1>
      </header>

      {loading ? (
        <p className="text-sm text-stone-600 dark:text-stone-300">Cargando…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-xl bg-[#dfe9e4] p-6 text-center text-stone-700 dark:bg-stone-800 dark:text-stone-200">
          🎉 Enfermería vacía: ninguna planta con problemas ahora mismo.
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-stone-600 dark:text-stone-300">
            {rows.length} planta{rows.length !== 1 ? "s" : ""} en cuidados.
          </p>
          <ul className="space-y-3">
            {rows.map(r => (
              <li key={r.plant.id}>
                <Link href={`/plant/${r.plant.id}`}
                  className="block rounded-xl bg-[#faf7f0] p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-stone-800">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-serif text-lg font-semibold text-stone-800 dark:text-stone-100">
                      {r.health && DOT[r.health]} {r.plant.name}
                    </p>
                    {r.health && r.health !== "green" && (
                      <span className="text-xs text-stone-500 dark:text-stone-300">
                        desde hace {r.days} día{r.days !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  {r.rec && (
                    <p className="mt-1 text-sm text-stone-700 dark:text-stone-200">
                      🩺 <b>{r.rec.title}</b>{r.rec.culprit && ` · ${r.rec.culprit}`} · día {r.rec.day}
                    </p>
                  )}
                  {r.rec && (
                    <p className="mt-0.5 text-xs text-stone-600 dark:text-stone-300">
                      {r.rec.due ? "🔎 Toca chequeo hoy: " : "Próximo paso: "}{r.rec.stepTitle}
                    </p>
                  )}
                  {!r.rec && r.health && r.health !== "green" && r.days >= 4 && (
                    <p className="mt-1 text-xs text-stone-600 dark:text-stone-300">
                      💬 Lleva {r.days} días así: en la home te preguntará si sigue igual.
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  )
}