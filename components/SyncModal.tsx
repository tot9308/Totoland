"use client"

import { useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import { type Plant } from "@/lib/plants"

const round05 = (x: number) => Math.round(x * 2) / 2

function planFor(f: number, cycle: number) {
  const cands: { adj: number; label: string }[] = []
  for (let k = 1; k <= 4; k++)
    cands.push({
      adj: k * cycle,
      label: k === 1 ? `cada ${cycle} d (cada ronda)` : `cada ${k * cycle} d (1 riego cada ${k} rondas)`,
    })
  for (let m = 2; m <= 4; m++)
    cands.push({
      adj: round05(cycle / m),
      label: `${m} riegos por ciclo de ${cycle} d (≈ cada ${round05(cycle / m)} d)`,
    })
  let best = cands[0]
  for (const c of cands) if (Math.abs(c.adj - f) < Math.abs(best.adj - f)) best = c
  return best
}

export default function SyncModal({ plants, onClose, onSaved, onWaterTogether }: {
  plants: Plant[]
  onClose: () => void
  onSaved: () => Promise<void>
  onWaterTogether: (list: Plant[]) => void
}) {
  const [cycle, setCycle] = useState(7)
  const [tol, setTol] = useState(2)
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState(false)
  const [applied, setApplied] = useState(false)

  const rows = useMemo(() => {
    return plants
      .filter(p => p.watering_frequency_days != null)
      .map(p => {
        const f = Number(p.watering_frequency_days)
        const plan = planFor(f, cycle)
        const diff = round05(plan.adj - f)
        const fits = Math.abs(diff) <= tol
        return { p, f, adj: plan.adj, label: plan.label, diff, fits }
      })
  }, [plants, cycle, tol])

  function isSel(id: string, fits: boolean) {
    return selected[id] ?? fits
  }
  const selRows = rows.filter(r => r.fits && isSel(r.p.id, r.fits))

  async function apply() {
    setBusy(true)
    for (const r of selRows) {
      if (r.adj !== r.f)
        await supabase.from("plants").update({ watering_frequency_days: r.adj }).eq("id", r.p.id)
    }
    setBusy(false)
    setApplied(true)
    await onSaved()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-xl bg-[#faf7f0] p-5 shadow-xl">
        <h2 className="mb-1 text-lg font-semibold text-stone-800">🔄 Sincronizar riegos</h2>
        <p className="mb-3 text-xs text-stone-500">
          Ajusta cada planta al ciclo común: o regándola cada varias rondas, o varias veces por ronda
          (p. ej. una de 4 días = 2 riegos por semana). Siempre dentro de tu tolerancia.
        </p>
        <div className="mb-3 grid grid-cols-2 gap-3">
          <label className="block text-sm text-stone-800">
            Ciclo base (días)
            <select value={cycle} onChange={e => { setCycle(Number(e.target.value)); setApplied(false) }}
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2">
              {[5, 6, 7, 8, 10, 14].map(c => <option key={c} value={c}>{c} días</option>)}
            </select>
          </label>
          <label className="block text-sm text-stone-800">
            Tolerancia
            <select value={tol} onChange={e => { setTol(Number(e.target.value)); setApplied(false) }}
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2">
              {[1, 2, 3].map(t => <option key={t} value={t}>±{t} día{t > 1 ? "s" : ""}</option>)}
            </select>
          </label>
        </div>

        <ul className="mb-3 space-y-1">
          {rows.map(r => (
            <li key={r.p.id} className="flex items-center justify-between gap-2 rounded bg-stone-50 px-3 py-2 text-sm">
              <label className="flex flex-1 items-center gap-2">
                <input type="checkbox" disabled={!r.fits}
                  checked={r.fits && isSel(r.p.id, r.fits)}
                  onChange={e => setSelected(s => ({ ...s, [r.p.id]: e.target.checked }))} />
                <span className="flex-1 text-stone-800">{r.p.name}</span>
              </label>
              <span className="text-right text-xs text-stone-600">
                {r.fits ? (
                  <>cada {r.f} → <b>{r.label}</b> ({r.diff >= 0 ? `+${r.diff}` : r.diff})</>
                ) : (
                  <>cada {r.f} d: no encaja (±{tol})</>
                )}
              </span>
            </li>
          ))}
          {rows.length === 0 && <p className="text-sm text-stone-600">Ninguna planta tiene frecuencia.</p>}
        </ul>

        <p className="mb-3 text-xs text-stone-500">
          {selRows.length} planta(s) alineadas al ciclo de {cycle} días.
        </p>

        <div className="flex flex-wrap justify-end gap-2">
          <button onClick={onClose} className="rounded px-3 py-2 text-stone-700 hover:bg-stone-100">Cerrar</button>
          {!applied ? (
            <button onClick={apply} disabled={busy || selRows.length === 0}
              className="rounded bg-[#5a7d4a] px-4 py-2 text-white hover:bg-[#4a6a3a] disabled:opacity-40">
              Aplicar frecuencias
            </button>
          ) : (
            <button onClick={() => { onWaterTogether(selRows.map(r => r.p)); onClose() }}
              className="rounded bg-[#5a8ca6] px-4 py-2 text-white hover:bg-[#497691]">
              💧 Regarlas juntas ahora
            </button>
          )}
        </div>
      </div>
    </div>
  )
}