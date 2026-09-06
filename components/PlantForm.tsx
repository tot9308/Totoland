"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function PlantForm({ householdId, onClose, onSaved }: {
  householdId: string
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const [name, setName] = useState("")
  const [species, setSpecies] = useState("")
  const [location, setLocation] = useState("")
  const [freq, setFreq] = useState("")
  const [misting, setMisting] = useState(false)
  const [tips, setTips] = useState("")
  const [busy, setBusy] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    const { error } = await supabase.from("plants").insert({
      household_id: householdId,
      name: name.trim(),
      species: species.trim() || null,
      location: location.trim() || null,
      watering_frequency_days: freq ? Number(freq) : null,
      misting_enabled: misting,
      care_tips: tips.trim() || null,
    })
    setBusy(false)
    if (error) return alert("Error: " + error.message)
    await onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={save} className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-emerald-900">Añadir planta</h2>
        <label className="mb-3 block text-sm text-emerald-900">
          Nombre *
          <input value={name} onChange={e => setName(e.target.value)} required
            className="mt-1 w-full rounded border border-emerald-300 px-3 py-2"
            placeholder="Monstera del salón" />
        </label>
        <label className="mb-3 block text-sm text-emerald-900">
          Especie
          <input value={species} onChange={e => setSpecies(e.target.value)}
            className="mt-1 w-full rounded border border-emerald-300 px-3 py-2"
            placeholder="Monstera deliciosa" />
        </label>
        <label className="mb-3 block text-sm text-emerald-900">
          Ubicación
          <input value={location} onChange={e => setLocation(e.target.value)}
            className="mt-1 w-full rounded border border-emerald-300 px-3 py-2"
            placeholder="Salón" />
        </label>
        <label className="mb-3 block text-sm text-emerald-900">
          Riego cada (días)
          <input type="number" min={1} value={freq} onChange={e => setFreq(e.target.value)}
            className="mt-1 w-full rounded border border-emerald-300 px-3 py-2"
            placeholder="7" />
        </label>
        <label className="mb-4 flex items-center gap-2 text-sm text-emerald-900">
          <input type="checkbox" checked={misting} onChange={e => setMisting(e.target.checked)} />
          Le va bien la pulverización de hojas
        </label>
<label className="mb-4 block text-sm text-emerald-900">
          Cuidados clave (uno por línea)
          <textarea value={tips} onChange={e => setTips(e.target.value)} rows={3}
            className="mt-1 w-full rounded border border-emerald-300 px-3 py-2"
            placeholder={"Luz indirecta\nRegar cuando el sustrato esté seco"} />
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