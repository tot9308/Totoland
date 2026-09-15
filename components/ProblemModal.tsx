"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { type Plant } from "@/lib/plants"
import {
  KIND_LABEL, SEVERITY_LABEL, CULPRIT_LABEL, CULPRIT_BY_KIND,
  type ProtocolKind, type Severity, type Culprit,
} from "@/lib/protocols"

export default function ProblemModal({ plant, onClose, onStarted }: {
  plant: Plant
  onClose: () => void
  onStarted: () => void
}) {
  const [kind, setKind] = useState<ProtocolKind>("pest")
  const [culprit, setCulprit] = useState<Culprit>(null)
  const [severity, setSeverity] = useState<Severity>("moderate")
  const [busy, setBusy] = useState(false)

  const culprits = CULPRIT_BY_KIND[kind]

  async function start(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    const today = new Date().toISOString()
    const { error } = await supabase.from("plants").update({
      recovery_kind: kind,
      recovery_culprit: culprit,
      recovery_severity: severity,
      recovery_started_at: today,
      recovery_step: 1,
      recovery_check_at: new Date(Date.now() + 86400000).toISOString(),
    }).eq("id", plant.id)
    setBusy(false)
    if (error) return alert("Error: " + error.message)
    onStarted()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={start} className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-[#faf7f0] p-5 shadow-xl dark:bg-stone-800">
        <h2 className="mb-3 text-lg font-semibold text-stone-800 dark:text-stone-100">
          🩺 Iniciar seguimiento · {plant.name}
        </h2>

        <label className="mb-3 block text-sm text-stone-800 dark:text-stone-100">
          Tipo de problema
          <select value={kind} onChange={e => { setKind(e.target.value as ProtocolKind); setCulprit(null) }}
            className="mt-1 w-full rounded border border-stone-300 px-3 py-2 dark:border-stone-600 dark:bg-stone-700">
            {(Object.keys(KIND_LABEL) as ProtocolKind[]).map(k => (
              <option key={k} value={k}>{KIND_LABEL[k]}</option>
            ))}
          </select>
        </label>

        {culprits.length > 0 && (
          <label className="mb-3 block text-sm text-stone-800 dark:text-stone-100">
            ¿Cuál crees que es el culpable?
            <select value={culprit ?? ""} onChange={e => setCulprit((e.target.value || null) as Culprit)}
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2 dark:border-stone-600 dark:bg-stone-700">
              <option value="">No lo sé</option>
              {culprits.map(c => <option key={c} value={c}>{CULPRIT_LABEL[c]}</option>)}
            </select>
          </label>
        )}

        <label className="mb-4 block text-sm text-stone-800 dark:text-stone-100">
          Gravedad
          <select value={severity} onChange={e => setSeverity(e.target.value as Severity)}
            className="mt-1 w-full rounded border border-stone-300 px-3 py-2 dark:border-stone-600 dark:bg-stone-700">
            {(Object.keys(SEVERITY_LABEL) as Severity[]).map(s => (
              <option key={s} value={s}>{SEVERITY_LABEL[s]}</option>
            ))}
          </select>
        </label>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose}
            className="rounded px-3 py-2 text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-700">
            Cancelar
          </button>
          <button disabled={busy}
            className="rounded bg-[#5a7d4a] px-4 py-2 text-white hover:bg-[#4a6a3a]">
            Iniciar seguimiento
          </button>
        </div>
      </form>
    </div>
  )
}