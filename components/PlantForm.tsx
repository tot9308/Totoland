"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { waterAmountFor, type Plant } from "@/lib/plants"
import { searchSpecies, LIGHT_LABELS, WATER_LABELS, findSpecies, type SpeciesCard } from "@/lib/species"
import { careTemplate } from "@/lib/careTemplate"

export default function PlantForm({ householdId, plant, onClose, onSaved }: {
  householdId: string
  plant?: Plant | null
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const [name, setName] = useState(plant?.name ?? "")
  const [species, setSpecies] = useState(plant?.species ?? "")
  const [showSug, setShowSug] = useState(false)
  const [location, setLocation] = useState(plant?.location ?? "")
  const [freqSummer, setFreqSummer] = useState(plant?.watering_frequency_days?.toString() ?? "")
  const [freqWinter, setFreqWinter] = useState(plant?.watering_frequency_winter_days?.toString() ?? "")
  const [misting, setMisting] = useState(plant?.misting_enabled ?? false)
  const [tips, setTips] = useState(plant?.care_tips ?? "")
  const [acquiredAt, setAcquiredAt] = useState(plant?.acquired_at ? plant.acquired_at.slice(0, 10) : "")
  const [potDiameter, setPotDiameter] = useState(plant?.pot_diameter_cm?.toString() ?? "")
  const [hasSaucer, setHasSaucer] = useState(plant?.has_saucer ?? false)
  const [busy, setBusy] = useState(false)

  const suggestions = searchSpecies(species)
  const style = findSpecies(species)?.water ?? "B"

  function pick(s: SpeciesCard) {
    setSpecies(s.sci)
    setShowSug(false)
    if (!freqSummer) setFreqSummer(String(s.ws))
    if (!freqWinter) setFreqWinter(String(s.ww))
    setMisting(s.mist === "Sí")
    if (!tips) setTips(careTemplate(s))
  }

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
      pot_diameter_cm: potDiameter ? Number(potDiameter) : null,
      has_saucer: hasSaucer,
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
      <form onSubmit={save} className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-[#faf7f0] p-5 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-stone-800">
          {plant ? "Editar planta" : "Añadir planta"}
        </h2>
        <label className="mb-3 block text-sm text-stone-800">
          Nombre *
          <input value={name} onChange={e => setName(e.target.value)} required
            className="mt-1 w-full rounded border border-stone-300 px-3 py-2" />
        </label>
        <label className="relative mb-3 block text-sm text-stone-800">
          Especie (científico o nombre común)
          <input
            value={species}
            onChange={e => { setSpecies(e.target.value); setShowSug(true) }}
            onFocus={() => setShowSug(true)}
            onBlur={() => setTimeout(() => setShowSug(false), 150)}
            className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
            placeholder="Escribe: monstera, poto, hed…"
          />
          {showSug && suggestions.length > 0 && (
            <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded border border-stone-200 bg-[#faf7f0] shadow-lg">
              {suggestions.map(s => (
                <li key={s.sci}>
                  <button
                    type="button"
                    onMouseDown={() => pick(s)}
                    className="w-full px-3 py-2 text-left hover:bg-stone-100"
                  >
                    <span className="font-medium">{s.sci}</span>
                    <span className="ml-2 text-xs text-stone-500">{s.common}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </label>
        <label className="mb-3 block text-sm text-stone-800">
          Ubicación
          <input value={location} onChange={e => setLocation(e.target.value)}
            className="mt-1 w-full rounded border border-stone-300 px-3 py-2" />
        </label>
        <div className="mb-3 grid grid-cols-2 gap-2">
          <label className="block text-sm text-stone-800">
            Riego verano (días)
            <input type="number" min={1} value={freqSummer} onChange={e => setFreqSummer(e.target.value)}
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2" />
          </label>
          <label className="block text-sm text-stone-800">
            Riego invierno (días)
            <input type="number" min={1} value={freqWinter} onChange={e => setFreqWinter(e.target.value)}
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2" />
          </label>
        </div>
        <label className="mb-3 block text-sm text-stone-800">
          Fecha de adquisición
          <input type="date" value={acquiredAt} onChange={e => setAcquiredAt(e.target.value)}
            className="mt-1 w-full rounded border border-stone-300 px-3 py-2" />
        </label>
        <div className="mb-2 grid grid-cols-2 gap-2">
          <label className="block text-sm text-stone-800">
            Diámetro maceta (cm)
            <input type="number" min={1} value={potDiameter} onChange={e => setPotDiameter(e.target.value)}
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2" />
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm text-stone-800">
            <input type="checkbox" checked={hasSaucer} onChange={e => setHasSaucer(e.target.checked)} />
            Tiene plato
          </label>
        </div>
        {potDiameter && (
          <p className="mb-3 rounded bg-[#eaf1ee] p-2 text-xs text-stone-700">
            💦 Con esa maceta: ≈ {waterAmountFor(Number(potDiameter), style).min}–{waterAmountFor(Number(potDiameter), style).max} ml por riego.
            El plato no cambia la cantidad: vacíalo a los 10-15 min.
          </p>
        )}
        <label className="mb-3 flex items-center gap-2 text-sm text-stone-800">
          <input type="checkbox" checked={misting} onChange={e => setMisting(e.target.checked)} />
          Le va bien la pulverización de hojas
        </label>
        <label className="mb-4 block text-sm text-stone-800">
          Cuidados clave (uno por línea)
          <textarea value={tips} onChange={e => setTips(e.target.value)} rows={3}
            className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
            placeholder={"Luz indirecta\nRegar cuando el sustrato esté seco"} />
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose}
            className="rounded px-3 py-2 text-stone-700 hover:bg-stone-100">
            Cancelar
          </button>
          <button disabled={busy} className="rounded bg-[#5a7d4a] px-4 py-2 text-white hover:bg-[#4a6a3a]">
            Guardar
          </button>
        </div>
      </form>
    </div>
  )
}