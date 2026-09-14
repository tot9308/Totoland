"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import type { Plant } from "@/lib/plants"
import { useConfirm } from "@/components/UiProvider"
import {
  buildPlan, CULPRIT_BY_KIND, CULPRIT_LABEL, KIND_LABEL, SEVERITY_LABEL,
  type ProtocolKind, type Culprit, type Severity,
} from "@/lib/protocols"

type Props = {
  plant: Plant
  userId: string
  speciesCard: any
  onChanged: () => void
}

export default function RecoveryPanel({ plant, userId, onChanged }: Props) {
  const { confirm: confirmAsync } = useConfirm()
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<ProtocolKind>("pest")
  const [culprit, setCulprit] = useState<Culprit>(null)
  const [severity, setSeverity] = useState<Severity>("moderate")

  const startedAt = plant.recovery_started_at ? new Date(plant.recovery_started_at) : null
  const currentPlan = startedAt ? buildPlan(plant.recovery_kind as ProtocolKind, plant.recovery_culprit as Culprit, plant.recovery_severity as Severity) : null
  const day0 = startedAt ? Math.floor((Date.now() - startedAt.getTime()) / 86400000) : 0

  async function startRecovery() {
    if (startedAt) return
    const plan = buildPlan(kind, culprit, severity)
    await supabase.from("plants").update({
      recovery_step: 0,
      recovery_severity: severity,
      recovery_kind: kind,
      recovery_culprit: culprit,
      recovery_started_at: new Date().toISOString(),
    }).eq("id", plant.id)
    await supabase.from("care_events").insert({
      plant_id: plant.id, user_id: userId, type: "observation",
      detail: `Inicio protocolo: ${plan.title}${culprit ? " (" + CULPRIT_LABEL[culprit] + ")" : ""} · ${SEVERITY_LABEL[severity]}`,
    })
    setOpen(false)
    onChanged()
  }

  async function markStepDone(stepIdx: number, result?: "better" | "same" | "worse") {
    if (!currentPlan) return
    const step = currentPlan.steps[stepIdx]
    await supabase.from("care_events").insert({
      plant_id: plant.id, user_id: userId, type: "treatment",
      detail: step.title + (result ? ` → ${result === "better" ? "mejor" : result === "same" ? "igual" : "peor"}` : ""),
    })
    if (result === "worse") {
      // Sube severidad
      const next: Severity = plant.recovery_severity === "mild" ? "moderate" : "severe"
      await supabase.from("plants").update({ recovery_severity: next }).eq("id", plant.id)
      alert("Subida a severidad " + SEVERITY_LABEL[next])
    }
    const nextIdx = Math.min(stepIdx + 1, currentPlan.steps.length - 1)
    await supabase.from("plants").update({ recovery_step: nextIdx }).eq("id", plant.id)
    onChanged()
  }

  async function finishRecovery() {
    if (!await confirmAsync("¿Marcar como recuperada? Se limpiará el protocolo.")) return
    await supabase.from("plants").update({
      recovery_step: 0, recovery_severity: null, recovery_kind: null,
      recovery_culprit: null, recovery_started_at: null,
    }).eq("id", plant.id)
    await supabase.from("care_events").insert({
      plant_id: plant.id, user_id: userId, type: "observation", detail: "Recuperada ✅",
    })
    onChanged()
  }

  if (!startedAt) {
    return (
      <section className="mb-6">
        {!open ? (
          <button onClick={() => setOpen(true)}
            className="w-full rounded-xl border-2 border-dashed border-stone-300 p-4 text-sm text-stone-600 hover:border-[#b5603d] hover:text-[#b5603d]">
            🩺 Iniciar protocolo de recuperación
          </button>
        ) : (
          <div className="rounded-xl bg-[#f5ece6] p-4 shadow-sm">
            <h2 className="mb-3 font-serif text-lg font-semibold text-stone-800">🩺 Nuevo protocolo</h2>

            <label className="mb-2 block text-sm text-stone-700">
              Tipo de problema
              <select value={kind} onChange={e => { setKind(e.target.value as ProtocolKind); setCulprit(null) }}
                className="mt-1 w-full rounded border border-stone-300 bg-white px-3 py-2">
                {Object.entries(KIND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>

            {CULPRIT_BY_KIND[kind].length > 0 && (
              <label className="mb-2 block text-sm text-stone-700">
                Culpable probable
                <select value={culprit ?? ""} onChange={e => setCulprit((e.target.value || null) as Culprit)}
                  className="mt-1 w-full rounded border border-stone-300 bg-white px-3 py-2">
                  <option value="">No lo sé / genérico</option>
                  {CULPRIT_BY_KIND[kind].map(c => <option key={c} value={c}>{CULPRIT_LABEL[c]}</option>)}
                </select>
              </label>
            )}

            <label className="mb-3 block text-sm text-stone-700">
              Severidad
              <div className="mt-1 flex gap-2">
                {(["mild", "moderate", "severe"] as Severity[]).map(s => (
                  <button key={s} onClick={() => setSeverity(s)}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm ${
                      severity === s
                        ? "bg-[#b5603d] text-white"
                        : "bg-white border border-stone-300 text-stone-700 hover:bg-stone-100"
                    }`}>
                    {SEVERITY_LABEL[s]}
                  </button>
                ))}
              </div>
            </label>

            {(() => {
              const preview = buildPlan(kind, culprit, severity)
              return (
                <div className="mb-3 rounded-lg bg-white/70 p-3 text-xs text-stone-700">
                  <p className="mb-1"><b>{preview.title}</b></p>
                  <p className="mb-2">{preview.summary}</p>
                  <p className="mb-2 text-stone-600">📋 {preview.steps.length} pasos · {preview.steps.filter(s => s.type === "check").length} chequeos</p>
                  <p className="text-stone-500">⛔ {preview.donot}</p>
                </div>
              )
            })()}

            <div className="flex gap-2">
              <button onClick={startRecovery}
                className="rounded bg-[#b5603d] px-4 py-2 text-white hover:bg-[#9c4f31]">Iniciar protocolo</button>
              <button onClick={() => setOpen(false)}
                className="rounded px-4 py-2 text-stone-700 hover:bg-stone-100">Cancelar</button>
            </div>
          </div>
        )}
      </section>
    )
  }

  // En protocolo: vista de progreso
  const currentStepIdx = plant.recovery_step ?? 0
  const currentStep = currentPlan?.steps[currentStepIdx]
  const past = currentPlan!.steps.slice(0, currentStepIdx)
  const future = currentPlan!.steps.slice(currentStepIdx + 1)

  return (
    <section className="mb-6 rounded-xl bg-[#f5ece6] p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="font-serif text-lg font-semibold text-stone-800">🩺 {currentPlan!.title}</h2>
          <p className="text-xs text-stone-600">
            {plant.recovery_culprit && CULPRIT_LABEL[plant.recovery_culprit] + " · "}
            {SEVERITY_LABEL[plant.recovery_severity as Severity]} · día {day0}
          </p>
        </div>
        <button onClick={finishRecovery}
          className="rounded border border-stone-300 px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-100">
          ✅ Recuperada
        </button>
      </div>

      {currentStep && day0 >= currentStep.day ? (
        <div className="mb-3 rounded-lg bg-white p-3 shadow-sm">
          <p className="mb-1 text-xs font-medium text-[#b5603d]">
            {currentStep.type === "check" ? "🔎 Chequeo de hoy" : "📌 Toca hoy"} · día {currentStep.day}
          </p>
          <p className="mb-2 text-sm font-semibold text-stone-800">{currentStep.title}</p>
          <p className="text-sm text-stone-700">{currentStep.description}</p>
          {currentStep.type === "check" ? (
            <div className="mt-3 flex gap-2">
              <button onClick={() => markStepDone(currentStepIdx, "better")}
                className="flex-1 rounded bg-[#5a7d4a] px-2 py-1.5 text-sm text-white hover:bg-[#4a6a3a]">😊 Mejor</button>
              <button onClick={() => markStepDone(currentStepIdx, "same")}
                className="flex-1 rounded bg-stone-200 px-2 py-1.5 text-sm text-stone-700 hover:bg-stone-300">😐 Igual</button>
              <button onClick={() => markStepDone(currentStepIdx, "worse")}
                className="flex-1 rounded bg-[#b5603d] px-2 py-1.5 text-sm text-white hover:bg-[#9c4f31]">😟 Peor</button>
            </div>
          ) : (
            <button onClick={() => markStepDone(currentStepIdx)}
              className="mt-3 w-full rounded bg-[#5a7d4a] px-3 py-2 text-sm text-white hover:bg-[#4a6a3a]">
              ✓ Marcar como hecho
            </button>
          )}
        </div>
      ) : currentStep ? (
        <div className="mb-3 rounded-lg bg-white/60 p-3 text-sm text-stone-600">
          ⏳ Próximo paso: <b>día {currentStep.day}</b> — {currentStep.title}
          <span className="ml-1 text-xs">
            (faltan {currentStep.day - day0} día{currentStep.day - day0 !== 1 ? "s" : ""})
          </span>
        </div>
      ) : null}
      {future.length > 0 && (
        <details className="mb-2">
          <summary className="cursor-pointer text-xs font-medium text-stone-600">
            Próximos pasos ({future.length})
          </summary>
          <ul className="mt-2 space-y-1">
            {future.map((s, i) => (
              <li key={i} className="text-xs text-stone-600">
                <span className="font-medium">día {s.day}</span> — {s.title}
              </li>
            ))}
          </ul>
        </details>
      )}

      {past.length > 0 && (
        <details>
          <summary className="cursor-pointer text-xs font-medium text-stone-600">
            Hechos ({past.length})
          </summary>
          <ul className="mt-2 space-y-1">
            {past.map((s, i) => (
              <li key={i} className="text-xs text-stone-500 line-through">
                día {s.day} — {s.title}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}