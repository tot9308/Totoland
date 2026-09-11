"use client"

import { useRouter } from "next/navigation"
import { daysSince, daysUntilDue, effectiveFreq, type Plant } from "@/lib/plants"

export default function PlantCard({ plant, onWater, onWaterMist, photoUrl, summerStart, summerEnd }: {
  plant: Plant
  onWater: () => void
  onWaterMist: () => void
  photoUrl?: string
  summerStart: number
  summerEnd: number
}) {
  const router = useRouter()
  const due = daysUntilDue(plant, summerStart, summerEnd)
  const freq = effectiveFreq(plant, summerStart, summerEnd)
  const days = daysSince(plant.last_watered_at)
const DIA_NOMBRE = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]

  const overdue = due !== null && due < 0
  const dueSoon = due !== null && due >= 0 && due <= 2

  return (
    <div
      onClick={() => router.push(`/plant/${plant.id}`)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-stone-200/60 bg-[#faf7f0] p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* Foto */}
      {photoUrl && (
        <img
          src={photoUrl}
          alt={plant.name}
          className="mb-3 aspect-[4/3] w-full rounded-xl object-cover"
        />
      )}

      {/* Contenido */}
      <div className="mb-3">
        <h3 className="font-serif text-xl font-semibold text-stone-800 leading-tight">
          {plant.name}
        </h3>
        <p className="mt-0.5 text-xs italic text-stone-500">
          {plant.species ? <em>{plant.species}</em> : <span className="text-stone-400">—</span>}
        </p>
        {plant.location && (
          <p className="mt-1 flex items-center gap-1 text-xs text-stone-600">
            <span>📍</span>{plant.location}
          </p>
        )}
      </div>

      {/* Próximo riego */}
      <div className={`mb-3 rounded-lg px-2.5 py-1.5 text-xs ${
        overdue
          ? "bg-[#c97b5e]/15 text-[#8a3a1a]"
          : dueSoon
            ? "bg-[#efe3c8] text-stone-700"
            : "bg-stone-100 text-stone-600"
      }`}>
        {due === null ? (
          <span>Sin riegos registrados</span>
        ) : overdue ? (
          <span className="font-medium">⚠ Toca regar · {Math.abs(due)} día{Math.abs(due) !== 1 ? "s" : ""} de retraso</span>
        ) : due === 0 ? (
          <span className="font-medium">💧 Toca regar hoy</span>
        ) : (
          <span>
            Próximo riego en <b>{due} día{due !== 1 ? "s" : ""}</b>
            {due <= 4 && (
              <span className="font-medium"> ({DIA_NOMBRE[new Date(Date.now() + due * 86400000).getDay()]})</span>
            )}
          </span>
        )}
        {freq && <span className="block text-[10px] opacity-70">cada {freq} d</span>}
      </div>

      {/* Botones (no propagan el click de la tarjeta) */}
      <div className="flex gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onWater() }}
          className="flex-1 rounded-lg bg-[#5a7d4a] px-2 py-2 text-sm font-medium text-white transition hover:bg-[#4a6a3a]"
        >
          💧 Regar
        </button>
        {plant.misting_enabled && (
          <button
            onClick={(e) => { e.stopPropagation(); onWaterMist() }}
            className="flex-1 rounded-lg bg-[#5a8ca6] px-2 py-2 text-sm font-medium text-white transition hover:bg-[#497691]"
          >
            💧+🌫
          </button>
        )}
      </div>
    </div>
  )
}