"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { EVENT_LABELS, type Plant } from "@/lib/plants"

const PESTS = ["Cochinilla", "Araña roja", "Mosca blanca", "Pulgón", "Trips", "Mosquito del sustrato", "Otro"]
const DISEASES = ["Hongo (manchas foliares)", "Podredumbre de raíz", "Oídio", "Mildiu", "Otro"]
const TREATMENTS = ["Jabón potásico", "Aceite de neem", "Fungicida", "Retirada manual", "Aislamiento", "Otro"]
const FERTS = ["Equilibrado (NPK)", "Floración (rico en fósforo)", "Ácido", "Universal"]
const HEALTH = [
  { v: "green", label: "🟢 Sana" },
  { v: "yellow", label: "🟡 Vigilante" },
  { v: "red", label: "🔴 Preocupante" },
]

export default function EventForm({ plant, userId, onClose, onSaved }: {
  plant: Plant
  userId: string
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const [type, setType] = useState("observation")
  const [notes, setNotes] = useState("")
  const [detail, setDetail] = useState("")
  const [health, setHealth] = useState("")
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 10))
  const [locations, setLocations] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("plants")
        .select("location").eq("household_id", plant.household_id)
      const set = new Set((data ?? []).map(p => p.location).filter(Boolean) as string[])
      setLocations([...set].sort())
    })()
  }, [plant.household_id])

  const needsDetail = ["pest_detection", "disease_detection", "treatment", "fertilizing", "location_change"].includes(type)
  const detailOptions =
    type === "pest_detection" ? PESTS :
    type === "disease_detection" ? DISEASES :
    type === "treatment" ? TREATMENTS :
    type === "fertilizing" ? FERTS :
    locations

  const detailLabel =
    type === "pest_detection" ? "Plaga detectada" :
    type === "disease_detection" ? "Enfermedad" :
    type === "treatment" ? "Tratamiento aplicado" :
    type === "fertilizing" ? "Tipo de abono" :
    "Nueva ubicación"

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    const batch = crypto.randomUUID()
    const when = new Date(occurredAt + "T12:00:00").toISOString()
    const finalDetail = needsDetail && detail && detail !== "__otra__" ? detail : null
    const { error } = await supabase.from("care_events").insert({
      plant_id: plant.id,
      user_id: userId,
      type,
      notes: notes.trim() || null,
      detail: finalDetail,
      health: type === "observation" && health ? health : null,
      occurred_at: when,
      batch_id: batch,
    })
    if (error) { setBusy(false); return alert("Error: " + error.message) }
    if (type === "watering")
      await supabase.from("plants").update({ last_watered_at: when }).eq("id", plant.id)
    setBusy(false)
    await onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={save} className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-[#faf7f0] p-5 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-stone-800">＋ Registrar en {plant.name}</h2>

        <label className="mb-3 block text-sm text-stone-800">
          Tipo de evento
          <select value={type} onChange={e => { setType(e.target.value); setDetail("") }}
            className="mt-1 w-full rounded border border-stone-300 px-3 py-2">
            {Object.entries(EVENT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>

        {needsDetail && (
          <label className="mb-3 block text-sm text-stone-800">
            {detailLabel}
            <select value={detail} onChange={e => setDetail(e.target.value)}
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2">
              <option value="">— elegir —</option>
              {detailOptions.map(o => <option key={o} value={o}>{o}</option>)}
              {type === "location_change" && <option value="__otra__">Otra (escríbela en notas)</option>}
            </select>
          </label>
        )}

        {type === "observation" && (
          <div className="mb-3">
            <p className="mb-1 text-sm text-stone-800">Estado de salud</p>
            <div className="flex gap-2">
              {HEALTH.map(h => (
                <button key={h.v} type="button"
                  onClick={() => setHealth(health === h.v ? "" : h.v)}
                  className={`flex-1 rounded px-2 py-2 text-sm ${
                    health === h.v
                      ? "bg-[#5a7d4a] text-white"
                      : "border border-stone-200 bg-stone-50 text-stone-700"
                  }`}>
                  {h.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="mb-3 block text-sm text-stone-800">
          Fecha
          <input type="date" value={occurredAt} onChange={e => setOccurredAt(e.target.value)}
            className="mt-1 w-full rounded border border-stone-300 px-3 py-2" />
        </label>

        <label className="mb-4 block text-sm text-stone-800">
          Notas
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
            placeholder="Ej: dos hojas amarillas abajo, brote nuevo con buena pinta…" />
        </label>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose}
            className="rounded px-3 py-2 text-stone-700 hover:bg-stone-100">Cancelar</button>
          <button disabled={busy}
            className="rounded bg-[#5a7d4a] px-4 py-2 text-white hover:bg-[#4a6a3a]">Guardar</button>
        </div>
      </form>
    </div>
  )
}