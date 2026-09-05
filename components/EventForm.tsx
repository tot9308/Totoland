"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { EVENT_LABELS, type Plant } from "@/lib/plants"

export default function EventForm({ plant, userId, onClose, onSaved }: {
  plant: Plant
  userId: string
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const [type, setType] = useState("observation")
  const [notes, setNotes] = useState("")
  const [busy, setBusy] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    const { error } = await supabase.from("care_events").insert({
      plant_id: plant.id,
      user_id: userId,
      type,
      batch_id: crypto.randomUUID(),
      notes: notes.trim() || null,
    })
    if (!error && type === "watering")
      await supabase.from("plants").update({ last_watered_at: new Date().toISOString() }).eq("id", plant.id)
    setBusy(false)
    if (error) return alert("Error: " + error.message)
    await onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={save} className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-emerald-900">Registrar · {plant.name}</h2>
        <label className="mb-3 block text-sm text-emerald-900">
          Tipo
          <select value={type} onChange={e => setType(e.target.value)}
            className="mt-1 w-full rounded border border-emerald-300 px-3 py-2">
            {Object.entries(EVENT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
        <label className="mb-4 block text-sm text-emerald-900">
          Notas
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            className="mt-1 w-full rounded border border-emerald-300 px-3 py-2"
            placeholder="Hojas con buena pinta, tierra algo seca…" />
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose}
            className="rounded px-3 py-2 text-emerald-800 hover:bg-emerald-50">
            Cancelar
          </button>
          <button disabled={busy} className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700">
            Guardar
          </button>
        </div>
      </form>
    </div>
  )
}