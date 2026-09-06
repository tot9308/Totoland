"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { type Plant } from "@/lib/plants"

export default function PlantForm({ householdId, plant, onClose, onSaved }: {
  householdId: string
  plant?: Plant | null
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const [name, setName] = useState(plant?.name ?? "")
  const [species, setSpecies] = useState(plant?.species ?? "")
  const [location, setLocation] = useState(plant?.location ?? "")
  const [freqSummer, setFreqSummer] = useState(plant?.watering_frequency_days?.toString() ?? "")
  const [freqWinter, setFreqWinter] = useState(plant?.watering_frequency_winter_days?.toString() ?? "")
  const [misting, setMisting] = useState(plant?.misting_enabled ?? false)
  const [tips, setTips] = useState(plant?.care_tips ?? "")
  const [acquiredAt, setAcquiredAt] = useState(plant?.acquired_at ? plant.acquired_at.slice(0, 10) : "")
  const [busy, setBusy] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    const payload = {
      name: name.trim(),
      species: species.trim() || null,
      location: location.trim() || null,
      watering_frequency_days: freqSummer ? Number(freqSummer) : null,
      watering_frequency_winter_days: freqWinter ? Number(freqWinter) : null,
      misting_enabled: misting,
      care_tips: tips.trim() || null,
      acquired_at: acquiredAt || null,
    }
    const { error } = plant
      ? await supabase.from("plants").update(payload).eq("id", plant.id)
      : await supabase.from("plants").insert({ ...payload, household_id: householdId })
    setBusy(false)
    if (error) return alert("Error: " + error.message)
    await onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={save} className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-emerald-900">
          {plant ? "Editar planta" : "Añadir planta"}
        </h2>
        <label className="mb-3 block text-sm text-emerald-900">
          Nombre *
          <input value={name} onChange={e => setName(e.target.value)} required
            className="mt-1 w-full rounded border border-emerald-300 px-3 py-2" />
        </label>
        <label className="mb-3 block text-sm text-emerald-900">
          Especie
          <input value={species} onChange={e => setSpecies(e.target.value)}
            className="mt-1 w-full rounded border border-emerald-300 px-3 py-2" />
        </label>
        <label className="mb-3 block text-sm text-emerald-900">
          Ubicación
          <input value={location} onChange={e => setLocation(e.target.value)}
            className="mt-1 w-full rounded border border-emerald-300 px-3 py-2" />
        </label>
        <div className="mb-3 grid grid-cols-2 gap-2">
          <label className="block text-sm text-emerald-900">
            Riego verano (días)
            <input type="number" min={1} value={freqSummer} onChange={e => setFreqSummer(e.target.value)}
              className="mt-1 w-full rounded border border-emerald-300 px-3 py-2" />
          </label>
          <label className="block text-sm text-emerald-900">
            Riego invierno (días)
            <input type="number" min={1} value={freqWinter} onChange={e => setFreqWinter(e.target.value)}
              className="mt-1 w-full rounded border border-emerald-300 px-3 py-2" />
          </label>
        </div>
        <label className="mb-3 block text-sm text-emerald-900">
          Fecha de adquisición
          <input type="date" value={acquiredAt} onChange={e => setAcquiredAt(e.target.value)}
            className="mt-1 w-full rounded border border-emerald-300 px-3 py-2" />
        </label>
        <label className="mb-3 flex items-center gap-2 text-sm text-emerald-900">
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