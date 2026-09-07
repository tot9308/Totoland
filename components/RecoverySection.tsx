"use client"

import { supabase } from "@/lib/supabase"
import { type Plant } from "@/lib/plants"

export default function RecoverySection({ plants, userId, schedule, onChanged }: {
  plants: Plant[]
  userId: string
  schedule: "A" | "B"
  onChanged: () => void
}) {
  const now = Date.now()
  const inRecovery = plants.filter(p => p.status !== "dead" && p.recovery_check_at)
  if (inRecovery.length === 0) return null

  function nextCheck(p: Plant): { step: number; at: string | null } {
    const step = p.recovery_step ?? 1
    if (schedule === "B") {
      if (step >= 2) return { step: 0, at: null }
      return { step: 2, at: new Date(Date.now() + 4 * 86400000).toISOString() }
    }
    return { step: 1, at: new Date(Date.now() + 3 * 86400000).toISOString() }
  }

  async function resolve(p: Plant, action: "ok" | "topup" | "still") {
    if (action === "ok") {
      await supabase.from("care_events").insert({
        plant_id: p.id, user_id: userId, type: "observation",
        notes: "Chequeo de recuperación: recuperada ✅",
      })
      await supabase.from("plants")
        .update({ recovery_check_at: null, recovery_step: 0 }).eq("id", p.id)
    } else {
      if (action === "topup") {
        await supabase.from("care_events").insert({
          plant_id: p.id, user_id: userId, type: "watering",
          notes: "Riego de apoyo en recuperación (media dosis, sustrato seco)",
        })
        await supabase.from("plants")
          .update({ last_watered_at: new Date().toISOString() }).eq("id", p.id)
      } else {
        await supabase.from("care_events").insert({
          plant_id: p.id, user_id: userId, type: "observation",
          notes: "Chequeo de recuperación: sigue maltrecha 🩺",
        })
      }
      const nx = nextCheck(p)
      await supabase.from("plants")
        .update({ recovery_check_at: nx.at, recovery_step: nx.step }).eq("id", p.id)
    }
    onChanged()
  }

  return (
    <section className="mb-6">
      <h2 className="mb-2 text-lg font-semibold text-emerald-900">🩺 Chequeos de recuperación</h2>
      <ul className="space-y-2">
        {inRecovery.map(p => {
          const t = new Date(p.recovery_check_at!).getTime()
          const due = t <= now
          const daysLeft = Math.ceil((t - now) / 86400000)
          const step = p.recovery_step ?? 1
          const total = schedule === "B" ? 2 : 1
          return (
            <li key={p.id} className="rounded-xl bg-rose-50 p-3 shadow-sm">
              <p className="mb-2 text-sm text-emerald-900">
                <b>{p.name}</b> · chequeo {step}/{total} ·{" "}
                {due ? "toca hoy" : `en ${daysLeft} día(s)`}
              </p>
              <div className="flex flex-wrap gap-1">
                <button onClick={() => resolve(p, "ok")}
                  className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700">
                  ✅ Recuperada
                </button>
                <button onClick={() => resolve(p, "topup")}
                  className="rounded bg-sky-600 px-2 py-1 text-xs text-white hover:bg-sky-700">
                  💧 Riego de apoyo
                </button>
                <button onClick={() => resolve(p, "still")}
                  className="rounded bg-rose-600 px-2 py-1 text-xs text-white hover:bg-rose-700">
                  🩺 Sigue maltrecha
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}