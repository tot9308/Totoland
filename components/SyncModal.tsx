"use client"

import { useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import { type Plant } from "@/lib/plants"

const DIA_LARGO = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]

export default function SyncModal({ plants, onClose, onSaved, onWaterTogether }: {
  plants: Plant[]
  onClose: () => void
  onSaved: () => Promise<void>
  onWaterTogether: (list: Plant[]) => void
}) {
  const rowsBase = useMemo(() =>
    plants.filter(p => p.watering_frequency_days != null && p.status !== "dead"),
  [plants])

  const defaultDow = useMemo(() => {
    const withLast = rowsBase.filter(p => p.last_watered_at)
    if (withLast.length) return new Date(withLast[0].last_watered_at!).getDay()
    return 2
  }, [rowsBase])

  const [cycle, setCycle] = useState(7)
  const [tol, setTol] = useState(2)
  const [dow, setDow] = useState(defaultDow)
  const [lastWatered, setLastWatered] = useState(new Date().toISOString().slice(0, 10))
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState(false)
  const [applied, setApplied] = useState(false)

  const rows = useMemo(() => {
    return rowsBase.map(p => {
      const f = Number(p.watering_frequency_days)
      const k = Math.max(1, Math.round(f / cycle))
      const mult = k * cycle
      const diff = mult - f
      const fitsMult = Math.abs(diff) <= tol
      if (fitsMult) {
        return {
          p, f, mode: "mult" as const, mult, k, diff, fits: true,
          label: k === 1 ? `cada ${cycle} d (cada ronda)` : `cada ${mult} d (1 riego cada ${k} rondas)`,
          days: null as number[] | null,
        }
      }
      const m = Math.max(2, Math.round(cycle / f))
      const offsets = Array.from({ length: m }, (_, i) => Math.round((i * cycle) / m))
      const days = offsets.map(o => (dow + o) % 7).sort((a, b) => a - b)
      const names = days.map(d => DIA_LARGO[d]).join(" + ")
      const avg = (cycle / m).toFixed(1).replace(".0", "")
      return {
        p, f, mode: "days" as const, mult, k, diff, fits: true,
        label: `${names} (${m} riegos/semana, media ${avg} d)`,
        days,
      }
    })
  }, [rowsBase, cycle, tol, dow])

  function isSel(id: string) { return selected[id] ?? true }
  const selRows = rows.filter(r => r.fits && isSel(r.p.id))

  async function apply() {
    setBusy(true)
    const lastWateredAt = new Date(lastWatered + "T12:00:00").toISOString()
    for (const r of selRows) {
      if (r.mode === "mult") {
        await supabase.from("plants").update({
          watering_frequency_days: r.mult,
          watering_days: null,
          last_watered_at: lastWateredAt,
        }).eq("id", r.p.id)
      } else {
        await supabase.from("plants").update({
          watering_days: r.days!.join(","),
          last_watered_at: lastWateredAt,
        }).eq("id", r.p.id)
      }
    }
    setBusy(false)
    setApplied(true)
    await onSaved()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-xl bg-[#faf7f0] p-5 shadow-xl">
        <h2 className="mb-1 text-lg font-semibold text-stone-800">🔄 Sincronizar riegos</h2>
        <p className="mb-3 text-xs text-stone-600">
          Ajusta cada planta al ciclo común: o regándola cada varias rondas, o en días fijos de la
          semana anclados al día del grupo (para frecuencias que no son múltiplo del ciclo).
        </p>
        <div className="mb-3 grid grid-cols-3 gap-3">
          <label className="block text-sm text-stone-800">
            Ciclo base
            <select value={cycle} onChange={e => { setCycle(Number(e.target.value)); setApplied(false) }}
              className="mt-1 w-full rounded border border-stone-300 px-2 py-2">
              {[5, 6, 7, 8, 10, 14].map(c => <option key={c} value={c}>{c} días</option>)}
            </select>
          </label>
          <label className="block text-sm text-stone-800">
            Tolerancia
            <select value={tol} onChange={e => { setTol(Number(e.target.value)); setApplied(false) }}
              className="mt-1 w-full rounded border border-stone-300 px-2 py-2">
              {[1, 2, 3].map(t => <option key={t} value={t}>±{t} d</option>)}
            </select>
          </label>
          <label className="block text-sm text-stone-800">
            Día del grupo
            <select value={dow} onChange={e => { setDow(Number(e.target.value)); setApplied(false) }}
              className="mt-1 w-full rounded border border-stone-300 px-2 py-2">
              {DIA_LARGO.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </label>
        </div>

        <label className="mb-3 block text-sm text-stone-800">
          ¿Cuándo regaste por última vez todas las plantas del grupo?
          <input type="date" value={lastWatered} onChange={e => setLastWatered(e.target.value)}
            className="mt-1 w-full rounded border border-stone-300 px-2 py-2" />
          <span className="mt-1 block text-[11px] text-stone-500">
            Si las regaste hoy, déjalo así. Si fue hace 2 días, pon esa fecha.
          </span>
        </label>

        <ul className="mb-3 space-y-1">
          {rows.map(r => (
            <li key={r.p.id} className="flex items-center justify-between gap-2 rounded bg-stone-100 px-3 py-2 text-sm">
              <label className="flex flex-1 items-center gap-2">
                <input type="checkbox" checked={isSel(r.p.id)}
                  onChange={e => setSelected(s => ({ ...s, [r.p.id]: e.target.checked }))} />
                <span className="flex-1 text-stone-800">{r.p.name}</span>
              </label>
              <span className="text-right text-xs text-stone-600">
                cada {r.f} → <b>{r.label}</b>
                {r.mode === "mult" && <span> ({r.diff >= 0 ? `+${r.diff}` : r.diff})</span>}
              </span>
            </li>
          ))}
          {rows.length === 0 && <p className="text-sm text-stone-600">Ninguna planta tiene frecuencia.</p>}
        </ul>

        <p className="mb-3 text-xs text-stone-600">{selRows.length} planta(s) alineadas al ciclo de {cycle} días.</p>

        <div className="flex flex-wrap justify-end gap-2">
          <button onClick={onClose} className="rounded px-3 py-2 text-stone-700 hover:bg-stone-100">Cerrar</button>
          {!applied ? (
            <button onClick={apply} disabled={busy || selRows.length === 0}
              className="rounded bg-[#5a7d4a] px-4 py-2 text-white hover:bg-[#4a6a3a] disabled:opacity-40">
              Aplicar
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