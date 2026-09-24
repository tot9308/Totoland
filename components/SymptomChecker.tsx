"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { compressToJpeg } from "@/lib/photos"
import { SEVERITY_QUESTION, SYMPTOMS, contextScores, type Cause } from "@/lib/symptoms"
import type { Plant } from "@/lib/plants"
import type { Culprit, ProtocolKind, Severity } from "@/lib/protocols"

const SEV_LABEL: Record<Severity, string> = {
  mild: "Leve",
  moderate: "Moderado",
  severe: "Grave",
}

export default function SymptomChecker({
  plant,
  onStartRecovery,
}: {
  plant?: Plant
  onStartRecovery?: (kind: ProtocolKind, culprit: Culprit | null, severity: Severity) => void
}) {
  const [sel, setSel] = useState<string | null>(null)
  const [step, setStep] = useState(0)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [severity, setSeverity] = useState<Severity | null>(null)
  const [notes, setNotes] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const symptom = SYMPTOMS.find(s => s.id === sel) ?? null
  const baseScores = useMemo(() => contextScores(plant), [plant])

  function pickSymptom(id: string) {
    setSel(id)
    setStep(0)
    setScores(baseScores)
    setSeverity(null)
    setNotes("")
    setFile(null)
  }

  function answer(pts: Record<string, number>) {
    setScores(prev => {
      const next = { ...prev }
      for (const [k, v] of Object.entries(pts)) next[k] = (next[k] ?? 0) + v
      return next
    })
    setStep(s => s + 1)
  }

  function skipAnswer() { setStep(s => s + 1) }

  function back() {
    if (!symptom) return
    if (step === 0) { setSel(null); return }
    if (step > symptom.questions.length) { setStep(symptom.questions.length); return }
    if (step === symptom.questions.length) setSeverity(null)
    setStep(s => s - 1)
  }

  const totalQuestions = symptom ? symptom.questions.length + 1 : 0

  const ranked = useMemo(() => {
    if (!symptom) return []
    const list = symptom.causes
      .map(c => ({ c, sc: scores[c.id] ?? 0 }))
      .filter(x => x.sc > 0)
      .sort((a, b) => b.sc - a.sc)
    const top = list[0]
    const second = list[1]
    return list.map((x, i) => ({
      ...x,
      isTop: i === 0 && (x.sc - (second?.sc ?? 0)) >= 2,
    }))
  }, [symptom, scores])

  const topCause: Cause | null = ranked[0]?.c ?? null

  async function saveObservation() {
    if (!plant || !topCause) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const text = `🔎 Diagnóstico (${symptom!.label}): ${topCause.c}${notes.trim() ? " · " + notes.trim() : ""}`
      const { data: ev, error } = await supabase.from("care_events").insert({
        plant_id: plant.id,
        user_id: user.id,
        type: "observation",
        notes: text,
        detail: topCause.tag,
      }).select("id").single()
      if (error || !ev) throw new Error(error?.message ?? "no se pudo guardar")

      if (file) {
        const uuid = crypto.randomUUID()
        const base = `${plant.household_id}/${plant.id}/${uuid}`
        const full = await compressToJpeg(file, 1600, 0.8)
        const thumb = await compressToJpeg(file, 400, 0.7)
        await supabase.storage.from("plant-photos").upload(`${base}.jpg`, full, { contentType: "image/jpeg" })
        await supabase.storage.from("plant-photos").upload(`${base}_thumb.jpg`, thumb, { contentType: "image/jpeg" })
        await supabase.from("photos").insert({
          plant_id: plant.id, user_id: user.id, event_id: ev.id,
          storage_path: `${base}.jpg`, thumbnail_path: `${base}_thumb.jpg`,
        })
      }
      alert("Diagnóstico guardado en el historial ✅")
      setSel(null); setStep(0); setScores({}); setSeverity(null); setNotes(""); setFile(null)
    } catch (e) {
      alert("Error: " + (e instanceof Error ? e.message : e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mb-6 rounded-xl bg-[#eaf1ee] p-4 shadow-sm dark:bg-stone-800">
      <h2 className="mb-1 text-lg font-semibold text-stone-800 dark:text-stone-100">
        🔎 ¿Qué le pasa{plant ? ` a ${plant.name}` : " a mi planta"}?
      </h2>
      <p className="mb-3 text-xs text-stone-600 dark:text-stone-300">
        Elige el síntoma y responde unas preguntas para afinar la causa.
      </p>

      {/* Lista de síntomas */}
      {!symptom && (
        <div className="flex flex-wrap gap-2">
          {SYMPTOMS.map(s => (
            <button key={s.id} onClick={() => pickSymptom(s.id)}
              className="rounded-full bg-white px-3 py-1.5 text-sm text-stone-700 shadow-sm hover:bg-stone-100 dark:bg-stone-700 dark:text-stone-100 dark:hover:bg-stone-600">
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Preguntas */}
      {symptom && step < symptom.questions.length && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <button onClick={back} className="text-xs text-stone-600 hover:underline dark:text-stone-300">← Atrás</button>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              Pregunta {step + 1} de {totalQuestions}
            </span>
          </div>
          <p className="mb-1 text-sm font-semibold text-stone-800 dark:text-stone-100">{symptom.label}</p>
          <p className="mb-3 text-sm text-stone-700 dark:text-stone-200">{symptom.questions[step].q}</p>
          <div className="flex flex-col gap-2">
            {symptom.questions[step].options.map((o, i) => (
              <button key={i} onClick={() => answer(o.points)}
                className="rounded-lg bg-white px-3 py-2 text-left text-sm text-stone-700 shadow-sm hover:bg-stone-100 dark:bg-stone-700 dark:text-stone-100 dark:hover:bg-stone-600">
                {o.label}
              </button>
            ))}
            <button onClick={skipAnswer}
              className="rounded-lg border border-dashed border-stone-300 px-3 py-2 text-left text-xs text-stone-500 hover:bg-stone-100 dark:border-stone-600 dark:text-stone-400 dark:hover:bg-stone-700">
              🤷 No estoy seguro / prefiero no responder
            </button>
          </div>
        </div>
      )}

      {/* Pregunta de gravedad */}
      {symptom && step === symptom.questions.length && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <button onClick={back} className="text-xs text-stone-600 hover:underline dark:text-stone-300">← Atrás</button>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              Pregunta {step + 1} de {totalQuestions}
            </span>
          </div>
          <p className="mb-1 text-sm font-semibold text-stone-800 dark:text-stone-100">{symptom.label}</p>
          <p className="mb-3 text-sm text-stone-700 dark:text-stone-200">{SEVERITY_QUESTION.q}</p>
          <div className="flex flex-col gap-2">
            {SEVERITY_QUESTION.options.map((o, i) => (
              <button key={i}
                onClick={() => { setSeverity(o.sev); setStep(s => s + 1) }}
                className="rounded-lg bg-white px-3 py-2 text-left text-sm text-stone-700 shadow-sm hover:bg-stone-100 dark:bg-stone-700 dark:text-stone-100 dark:hover:bg-stone-600">
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Resultado */}
      {symptom && step > symptom.questions.length && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <button onClick={() => { setStep(0); setScores(baseScores); setSeverity(null) }}
              className="text-xs text-stone-600 hover:underline dark:text-stone-300">↻ Repetir preguntas</button>
            <button onClick={() => setSel(null)} className="text-xs text-stone-600 hover:underline dark:text-stone-300">
              Cambiar síntoma
            </button>
          </div>

          {ranked.length === 0 ? (
            <div className="rounded-lg bg-white p-3 text-sm text-stone-700 shadow-sm dark:bg-stone-700 dark:text-stone-200">
              Con estas respuestas no queda claro. Revisa el envés de las hojas con lupa y añade un evento
              con foto desde el botón <b>＋ Más</b> de la ficha.
            </div>
          ) : (
            <>
              <p className="mb-3 text-sm font-semibold text-stone-800 dark:text-stone-100">
                Resultado para: {symptom.label}{severity ? ` · ${SEV_LABEL[severity]}` : ""}
              </p>
              <div className="space-y-2">
                {ranked.slice(0, 5).map(({ c, sc, isTop }, i) => {
                  const max = ranked[0].sc
                  const pct = Math.round((sc / max) * 100)
                  return (
                    <div key={c.id} className={`rounded-lg p-3 ${isTop ? "bg-[#5a7d4a]" : "bg-white/80 dark:bg-stone-700/60"}`}>
                      <p className={`text-sm font-semibold ${isTop ? "text-white" : "text-stone-800 dark:text-stone-100"}`}>
                        {isTop ? "🎯 Más probable: " : i === 0 ? "🔸 Muy probable: " : "También podría ser: "}
                        {c.c}
                        <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${isTop ? "bg-white/20 text-white" : "bg-[#f5ece6] text-[#8a3a1a] dark:bg-stone-700"}`}>
                          {c.tag}
                        </span>
                      </p>
                      <div className={`mt-1.5 h-1 rounded ${isTop ? "bg-white/20" : "bg-stone-200 dark:bg-stone-600"}`}>
                        <div className={`h-1 rounded ${isTop ? "bg-white" : "bg-[#5a8ca6]"}`} style={{ width: `${pct}%` }} />
                      </div>
                      <p className={`mt-1.5 text-xs ${isTop ? "text-white/90" : "text-stone-600 dark:text-stone-300"}`}>➡️ {c.fix}</p>
                    </div>
                  )
                })}
              </div>

              {plant && (
                <div className="mt-4 rounded-lg bg-white p-3 shadow-sm dark:bg-stone-700">
                  <p className="mb-2 text-xs font-medium text-stone-700 dark:text-stone-200">
                    Notas (opcional)
                  </p>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                    placeholder="Añade detalles: cuándo empezó, qué cambió…"
                    className="mb-2 w-full rounded border border-stone-300 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100" />
                  <label className="mb-2 block text-xs font-medium text-stone-700 dark:text-stone-200">
                    📷 Foto (opcional)
                    <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] ?? null)}
                      className="mt-1 block w-full text-xs text-stone-600 dark:text-stone-300" />
                  </label>
                  <div className="flex flex-wrap justify-end gap-2">
                    {topCause?.kind && onStartRecovery && (
                      <button
                        onClick={() => onStartRecovery(topCause.kind!, topCause.culprit ?? null, severity ?? "moderate")}
                        className="rounded bg-[#5a7d4a] px-3 py-1.5 text-sm text-white hover:bg-[#4a6a3a]">
                        🩺 Iniciar seguimiento
                      </button>
                    )}
                    <button onClick={saveObservation} disabled={saving}
                      className="rounded border border-[#5a7d4a] px-3 py-1.5 text-sm text-[#5a7d4a] hover:bg-[#eaf1ee] disabled:opacity-40 dark:text-stone-100 dark:hover:bg-stone-600">
                      {saving ? "Guardando…" : "📝 Guardar en historial"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          <p className="pt-3 text-xs text-stone-600 dark:text-stone-300">
            ¿Va a más? Inicia un seguimiento guiado desde{" "}
            <Link href="/recovery" className="font-semibold text-[#5a7d4a] underline dark:text-stone-100">🩺 Enfermería</Link>.
          </p>
        </div>
      )}
    </section>
  )
}