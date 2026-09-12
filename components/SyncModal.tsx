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

  const weekly = cycle % 7 === 0

  const rows = useMemo(() => {
    return rowsBase.map(p => {
      const f = Number(p.watering_frequency_days)
      const k = Math.max(1, Math.round(f / cycle))
      const mult = k * cycle
      const diff = mult - f
      const fits = Math.abs(diff) <= tol

      if (fits && weekly) {
        return {
          p, f, mode: "mult" as const, k, diff, change: true,
          label: k === 1 ? `${DIA_LARGO[dow]} (cada semana)` : `${DIA_LARGO[dow]} cada ${k} semanas`,
          days: [dow] as number[], interval: k,
        }
      }
      if (fits && !weekly) {
        return {
          p, f, mode: "freqmult" as const, k, diff, change: true,
          label: `cada ${mult} d (sin día fijo: el ciclo no es semanal)`,
          days: [] as number[], interval: 1,
        }
      }
      if (weekly && f < cycle) {
        const m = Math.max(2, Math.round(cycle / f))
        const offsets = Array.from({ length: m }, (_, i) => Math.round((i * cycle) / m))
        const days = offsets.map(o => (dow + o) % 7).sort((a, b) => a - b)
        const avg = (cycle / m).toFixed(1).replace(".0", "")
        return {
          p, f, mode: "days" as const, k: 1, diff, change: true,
          label: `${days.map(d => DIA_LARGO[d]).join(" + ")} (${m}/semana, media ${avg} d)`,
          days, interval: 1,
        }
      }
      return {
        p, f, mode: "freq" as const, k: 1, diff, change: false,
        label: `cada ${f} d (se queda igual: no encaja sin regar de más o de menos)`,
        days: [] as number[], interval: 1,
      }
    })
  }, [rowsBase, cycle, tol, dow, weekly])

  function isSel(id: string) { return selected[id] ?? true }
  const selRows = rows.filter(r => r.change && isSel(r.p.id))

  async function apply() {
    setBusy(true)
    const base = new Date(lastWatered + "T12:00:00")
    let delta = (dow - base.getDay() + 7) % 7
    if (delta > 3) delta -= 7
    const anchored = new Date(base); anchored.setDate(anchored.getDate() + delta)
    const anchorIso = anchored.toISOString()
    try {
      for (const r of selRows) {
        const payload = r.mode === "mult"
          ? {
              watering_days: r.days.join(","),
              watering_week_interval: r.interval,
              watering_anchor: anchorIso,
              last_watered_at: anchorIso,
              watering_frequency_days: r.k * cycle,
            }
          : r.mode === "days"
            ? {
                watering_days: r.days.join(","),
                watering_week_interval: 1,
                watering_anchor: anchorIso,
                last_watered_at: anchorIso,
              }
            : {
                watering_days: null,
                watering_week_interval: null,
                watering_anchor: null,
                watering_frequency_days: r.k * cycle,
                last_watered_at: new Date(lastWatered + "T12:00:00").toISOString(),
              }
        const { error } = await supabase.from("plants").update(payload).eq("id", r.p.id)
        if (error) throw new Error(error.message)
      }
      setApplied(true)
      await onSaved()
    } catch (e: any) {
      alert("Error al aplicar la sincronización: " + (e?.message ?? e))
    }
    setBusy(false)
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-xl bg-[#faf7f0] p-5 shadow-xl">
        <h2 className="mb-1 text-lg font-semibold text-stone-800">🔄 Sincronizar riegos</h2>
        <p className="mb-3 text-xs text-stone-600">
          Con ciclo de 7 (o 14) días, ancla cada planta a días fijos de la semana para que no se
          desfasen. Con otros ciclos (5, 10…) el patrón rota y se ajustan solo las frecuencias.
        </p>

        {!weekly && (
          <p className="mb-3 rounded bg-amber-100 p-2 text-xs text-amber-800">
            ⚠️ El ciclo de {cycle} días no es semanal: los riegos rotarán por los días de la semana
            y no se anclarán a un día fijo.
          </p>
        )}

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
          <label className={`block text-sm text-stone-800 ${weekly ? "" : "opacity-40"}`}>
            Día del grupo
            <select value={dow} onChange={e => { setDow(Number(e.target.value)); setApplied(false) }} disabled={!weekly}
              className="mt-1 w-full rounded border border-stone-300 px-2 py-2">
              {DIA_LARGO.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </label>
        </div>

        <label className="mb-3 block text-sm text-stone-800">
          ¿Cuándo regaste por última vez el grupo?
          <input type="date" value={lastWatered} onChange={e => setLastWatered(e.target.value)}
            className="mt-1 w-full rounded border border-stone-300 px-2 py-2" />
        </label>

        <ul className="mb-3 space-y-1">
          {rows.map(r => (
            <li key={r.p.id} className="flex items-center justify-between gap-2 rounded bg-stone-100 px-3 py-2 text-sm">
              <label className="flex flex-1 items-center gap-2">
                <input type="checkbox" checked={isSel(r.p.id)} disabled={!r.change}
                  onChange={e => setSelected(s => ({ ...s, [r.p.id]: e.target.checked }))} />
                <span className="flex-1 text-stone-800">{r.p.name}</span>
              </label>
              <span className="text-right text-xs text-stone-600">
                cada {r.f} → <b>{r.label}</b>
              </span>
            </li>
          ))}
          {rows.length === 0 && <p className="text-sm text-stone-600">Ninguna planta tiene frecuencia.</p>}
        </ul>

        <p className="mb-3 text-xs text-stone-600">{selRows.length} planta(s) se van a sincronizar.</p>

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