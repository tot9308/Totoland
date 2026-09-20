"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import type { Plant } from "@/lib/plants"

export default function CropModal({ plant, photoUrl, onClose, onSaved }: {
  plant: Plant
  photoUrl: string
  onClose: () => void
  onSaved: () => void
}) {
  const [crop, setCrop] = useState(plant.crop_box ?? { x: 0, y: 0, width: 100, height: 100 })
  const [busy, setBusy] = useState(false)

  async function save() {
    setBusy(true)
    const { error } = await supabase.from("plants").update({ crop_box: crop }).eq("id", plant.id)
    setBusy(false)
    if (error) return alert("Error: " + error.message)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl bg-[#faf7f0] p-5 shadow-xl">
        <h2 className="mb-3 text-lg font-semibold text-stone-800">✂️ Recortar foto de {plant.name}</h2>
        <p className="mb-3 text-xs text-stone-600">
          Elige qué parte de la foto se mostrará en la tarjeta de la home.
        </p>

        <div className="relative mb-4 aspect-[3/4] overflow-hidden rounded-lg bg-stone-200">
          <img
            src={photoUrl}
            alt={plant.name}
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              objectPosition: `${crop.x}% ${crop.y}%`,
              transform: `scale(${100 / crop.width})`,
              transformOrigin: `${crop.x}% ${crop.y}%`,
            }}
          />
        </div>

        <div className="mb-3 space-y-2">
          <label className="block text-sm text-stone-700">
            Posición horizontal: {crop.x}%
            <input type="range" min="0" max="100" value={crop.x}
              onChange={e => setCrop({ ...crop, x: Number(e.target.value) })}
              className="mt-1 w-full" />
          </label>
          <label className="block text-sm text-stone-700">
            Posición vertical: {crop.y}%
            <input type="range" min="0" max="100" value={crop.y}
              onChange={e => setCrop({ ...crop, y: Number(e.target.value) })}
              className="mt-1 w-full" />
          </label>
          <label className="block text-sm text-stone-700">
            Zoom: {crop.width}%
            <input type="range" min="20" max="100" value={crop.width}
              onChange={e => setCrop({ ...crop, width: Number(e.target.value), height: Number(e.target.value) })}
              className="mt-1 w-full" />
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose}
            className="rounded px-3 py-2 text-stone-700 hover:bg-stone-100">
            Cancelar
          </button>
          <button onClick={save} disabled={busy}
            className="rounded bg-[#5a7d4a] px-4 py-2 text-white hover:bg-[#4a6a3a] disabled:opacity-50">
            {busy ? "Guardando…" : "Guardar recorte"}
          </button>
        </div>
      </div>
    </div>
  )
}