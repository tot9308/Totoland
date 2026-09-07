"use client"

import { supabase } from "@/lib/supabase"
import { type Plant } from "@/lib/plants"

export default function RecoverySection({ plants, userId, onChanged }: {
  plants: Plant[]
  userId: string
  onChanged: () => void
}) {
  const now = Date.now()
  const inRecovery = plants.filter(p => p.status !== "dead" && p.recovery_check_at)
  if (inRecovery.length === 0) return null

  async function resolve(p: Plant, ok: boolean) {
    const { error } = await supabase.from("care_events").insert({
      plant_id: p.id,
      user_id: userId,
      type: "observation",
      notes: ok
        ? "Chequeo de recuperación: recuperada ✅"
        : "Chequeo de recuperación: sigue maltrecha 🩺",
    })
    if (error) return alert(error.message)
    const next = ok ? null : new Date(Date.now() + 3 * 86400000).toISOString()
    await supabase.from("plants").update({ recovery_check_at: next }).eq("id", p.id)
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
          return (
            <li key={p.id} className="rounded-xl bg-rose-50 p-3 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-emerald-900">
                  <b>{p.name}</b> ·{" "}
                  {due ? "toca revisarla hoy" : `revisar en ${daysLeft} día(s)`}
                </p>
                <div className="flex gap-1">
                  <button onClick={() => resolve(p, true)}
                    className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700">
                    ✅ Recuperada
                  </button>
                  <button onClick={() => resolve(p, false)}
                    className="rounded bg-rose-600 px-2 py-1 text-xs text-white hover:bg-rose-700">
                    🩺 Sigue maltrecha
                  </button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}