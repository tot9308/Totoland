"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]

export default function SeasonModal({ householdId, summerStart, summerEnd, onClose, onSaved }: {
  householdId: string
  summerStart: number
  summerEnd: number
  onClose: () => void
  onSaved: (s: number, e: number) => void
}) {
  const [s, setS] = useState(summerStart)
  const [e, setE] = useState(summerEnd)
  const [busy, setBusy] = useState(false)

  async function save() {
    setBusy(true)
    const { error } = await supabase
      .from("households")
      .update({ summer_start_month: s, summer_end_month: e })
      .eq("id", householdId)
    setBusy(false)
    if (error) return alert("Error: " + error.message)
    onSaved(s, e)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-emerald-900">⚙️ Temporada de riego</h2>
        <p className="mb-3 text-sm text-emerald-700">
          Define qué meses cuentan como <b>verano</b> (riego más frecuente). El resto será invierno.
        </p>
        <div className="mb-3 grid grid-cols-2 gap-3">
          <label className="block text-sm text-emerald-900">
            Empieza en
            <select value={s} onChange={ev => setS(Number(ev.target.value))}
              className="mt-1 w-full rounded border border-emerald-300 px-3 py-2">
              {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </label>
          <label className="block text-sm text-emerald-900">
            Termina en
            <select value={e} onChange={ev => setE(Number(ev.target.value))}
              className="mt-1 w-full rounded border border-emerald-300 px-3 py-2">
              {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </label>
        </div>
        <p className="mb-4 rounded bg-emerald-50 p-2 text-xs text-emerald-700">
          Ahora mismo: <b>verano = {MESES[s - 1]}–{MESES[e - 1]}</b>,
          invierno = el resto del año.
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose}
            className="rounded px-3 py-2 text-emerald-800 hover:bg-emerald-50">
            Cancelar
          </button>
          <button onClick={save} disabled={busy}
            className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700">
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}