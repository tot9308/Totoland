"use client"

import Link from "next/link"
import { type Plant } from "@/lib/plants"
import { CHECKS, SEV_LABEL, TYPE_LABEL, resolveRecovery, type PType } from "@/lib/recovery"

export default function RecoverySection({ plants, userId, onChanged }: {
  plants: Plant[]
  userId: string
  onChanged: () => void
}) {
  const now = Date.now()
  const inRecovery = plants.filter(p => p.status !== "dead" && p.recovery_check_at)
  if (inRecovery.length === 0) return null

  return (
    <section className="mb-6">
      <h2 className="mb-2 text-lg font-semibold text-emerald-900">🩺 Recuperaciones en curso</h2>
      <ul className="space-y-2">
        {inRecovery.map(p => {
          const t = new Date(p.recovery_check_at!).getTime()
          const due = t <= now
          const sev = p.recovery_severity ?? "moderate"
          const steps = CHECKS[sev] ?? [3]
          const step = p.recovery_step ?? 1
          return (
            <li key={p.id} className="rounded-xl bg-rose-50 p-3 shadow-sm">
              <p className="mb-2 text-sm text-emerald-900">
                <Link href={`/plant/${p.id}`} className="font-semibold hover:underline">{p.name}</Link>
                {" · "}{SEV_LABEL[sev]}
                {p.plant_type && <span> · {TYPE_LABEL[p.plant_type as PType]}</span>}
                {" · "}chequeo {step}/{steps.length} · {due ? "toca hoy" : `en ${Math.ceil((t - now) / 86400000)} d`}
              </p>
              <div className="flex flex-wrap gap-1">
                <button onClick={() => resolveRecovery(p, "ok", userId).then(onChanged)}
                  className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700">✅ Recuperada</button>
                <button onClick={() => resolveRecovery(p, "topup", userId).then(onChanged)}
                  className="rounded bg-sky-600 px-2 py-1 text-xs text-white hover:bg-sky-700">💧 Apoyo</button>
                <button onClick={() => resolveRecovery(p, "still", userId).then(onChanged)}
                  className="rounded bg-rose-600 px-2 py-1 text-xs text-white hover:bg-rose-700">🩺 Maltrecha</button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}