"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { type Plant } from "@/lib/plants"
import {
  buildPlan, KIND_LABEL, CULPRIT_LABEL, SEVERITY_LABEL, TRANSVERSAL_WARNINGS,
  type ProtocolKind, type Severity, type Culprit,
} from "@/lib/protocols"
import ProblemModal from "./ProblemModal"
import { useEffect, useState } from "react"

export default function RecoveryPanel({ plant, userId, onChanged }: {
  plant: Plant
  userId: string
  onChanged: () => void
}) {
  const [showStart, setShowStart] = useState(false)
  const inProgress = plant.recovery_started_at && plant.recovery_kind
export default function RecoveryPanel({ plant, userId, onChanged, preset }: {
  plant: Plant
  userId: string
  onChanged: () => void
  preset?: { kind: ProtocolKind; culprit: Culprit | null; severity: Severity } | null
}) {
  const [showStart, setShowStart] = useState(false)
  useEffect(() => { if (preset) setShowStart(true) }, [preset])
  const inProgress = plant.recovery_started_at && plant.recovery_kind

        {showStart && (
          <ProblemModal
            plant={plant}
            onClose={() => setShowStart(false)}
            onStarted={onChanged}
            initialKind={preset?.kind}
            initialCulprit={preset?.culprit ?? null}
            initialSeverity={preset?.severity}
          />
        )}
  if (!inProgress) {
    return (
      <section className="mb-6 rounded-xl bg-[#faf7f0] p-4 shadow-sm dark:bg-stone-800">
        <button onClick={() => setShowStart(true)}
          className="rounded bg-[#b5603d] px-3 py-2 text-sm text-white hover:bg-[#9c4f31]">
          🩺 Iniciar seguimiento
        </button>
        <p className="mt-2 text-xs text-stone-600 dark:text-stone-300">
          Úsalo si detectas sequía, plaga, enfermedad, exceso de riego, exceso de abono o un daño.
          La app te irá guiando con pasos y chequeos.
        </p>
        {showStart && (
          <ProblemModal plant={plant} onClose={() => setShowStart(false)} onStarted={onChanged} />
        )}
      </section>
    )
  }

  const kind = plant.recovery_kind as ProtocolKind
  const culprit = (plant.recovery_culprit ?? null) as Culprit
  const severity = (plant.recovery_severity ?? "moderate") as Severity
  const plan = buildPlan(kind, culprit, severity)
  const startedAt = new Date(plant.recovery_started_at!)
  const dayNow = Math.floor((Date.now() - startedAt.getTime()) / 86400000)

  async function markProgress(action: "ok" | "topup" | "still") {
    if (action === "ok") {
      await supabase.from("care_events").insert({
        plant_id: plant.id, user_id: userId, type: "observation", health: "green",
        notes: `Seguimiento (${KIND_LABEL[kind]}): recuperada ✅`,
      })
      await supabase.from("plants").update({
        recovery_kind: null, recovery_culprit: null, recovery_severity: null,
        recovery_started_at: null, recovery_step: 0, recovery_check_at: null,
      }).eq("id", plant.id)
    } else if (action === "topup") {
      await supabase.from("care_events").insert({
        plant_id: plant.id, user_id: userId, type: "observation", health: "yellow",
        notes: `Seguimiento (${KIND_LABEL[kind]}): seguimos tratamiento 💧`,
      })
      await supabase.from("plants").update({
        recovery_check_at: new Date(Date.now() + 3 * 86400000).toISOString(),
        recovery_step: (plant.recovery_step ?? 1) + 1,
      }).eq("id", plant.id)
    } else {
      // "still" — sin cambios o empeora. Escalada automática tras 2 avisos.
      await supabase.from("care_events").insert({
        plant_id: plant.id, user_id: userId, type: "observation", health: "red",
        notes: `Seguimiento (${KIND_LABEL[kind]}): sin cambios o empeora 🩺`,
      })
      const { data: stills } = await supabase.from("care_events")
        .select("id").eq("plant_id", plant.id).eq("type", "observation")
        .ilike("notes", "%sin cambios%")
        .gte("occurred_at", plant.recovery_started_at!)
      const n = stills?.length ?? 0
      let nextSeverity: Severity = severity
      if (severity === "mild" && n >= 2) nextSeverity = "moderate"
      else if (severity === "moderate" && n >= 3) nextSeverity = "severe"

      await supabase.from("plants").update({
        recovery_severity: nextSeverity,
        recovery_check_at: new Date(Date.now() + 3 * 86400000).toISOString(),
        recovery_step: (plant.recovery_step ?? 1) + 1,
      }).eq("id", plant.id)

      if (nextSeverity !== severity) {
        alert(`Protocolo escalado a "${SEVERITY_LABEL[nextSeverity]}": dos chequeos sin mejora. Revisa el plan actualizado.`)
      }
    }
    onChanged()
  }

  return (
    <section className="mb-6 rounded-xl bg-[#f5ece6] p-4 shadow-sm dark:bg-stone-800">
      <h2 className="mb-1 font-serif text-lg font-semibold text-stone-800 dark:text-stone-100">
        🩺 Seguimiento en curso
      </h2>
      <p className="mb-2 text-sm text-stone-700 dark:text-stone-200">
        <b>{plan.title}</b> · {KIND_LABEL[kind]}
        {culprit && <> · {CULPRIT_LABEL[culprit]}</>}
        {" · "}{SEVERITY_LABEL[severity]} · día {dayNow}
      </p>
      <p className="mb-3 text-sm text-stone-700 dark:text-stone-200">{plan.summary}</p>

      <ul className="mb-3 space-y-2">
        {plan.steps.map((s, i) => {
          const done = s.day < dayNow
          const today = s.day === dayNow
          return (
            <li key={i}
              className={`rounded-lg p-3 text-sm ${
                today ? "border-2 border-[#b5603d] bg-white dark:bg-stone-700"
                : done ? "opacity-60 bg-stone-100 dark:bg-stone-700"
                : "bg-white dark:bg-stone-700"
              }`}>
              <p className="font-medium text-stone-800 dark:text-stone-100">
                {done && "✓ "}{s.type === "check" ? "🔍 " : "• "}
                Día {s.day}: {s.title}
              </p>
              <p className="text-xs text-stone-600 dark:text-stone-300">{s.description}</p>
            </li>
          )
        })}
      </ul>

      {plan.donot && (
        <div className="mb-3 space-y-1 rounded bg-[#efe3c8] p-2 text-xs text-stone-800 dark:bg-stone-700 dark:text-stone-200">
          <p>🚫 <b>Qué NO hacer en este caso:</b> {plan.donot}</p>
        </div>
      )}

      <details className="mb-3 rounded bg-white p-2 text-xs text-stone-700 dark:bg-stone-700 dark:text-stone-200">
        <summary className="cursor-pointer font-medium">⚠️ Advertencias generales (fitotoxicidad, incompatibilidades)</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {TRANSVERSAL_WARNINGS.map((w, i) => <li key={i}>{w}</li>)}
        </ul>
      </details>

      <div className="flex flex-wrap gap-1">
        <button onClick={() => markProgress("ok")}
          className="rounded bg-[#5a7d4a] px-2 py-1 text-xs text-white hover:bg-[#4a6a3a]">
          ✅ Recuperada
        </button>
        <button onClick={() => markProgress("topup")}
          className="rounded bg-[#5a8ca6] px-2 py-1 text-xs text-white hover:bg-[#497691]">
          💧 Sigo el tratamiento
        </button>
        <button onClick={() => markProgress("still")}
          className="rounded bg-[#b5603d] px-2 py-1 text-xs text-white hover:bg-[#9c4f31]">
          🩺 Sin cambios / empeora
        </button>
      </div>
    </section>
  )
}