"use client"

import Link from "next/link"
import { daysSince, effectiveFreq, isDue, type Plant } from "@/lib/plants"

export default function PlantCard({ plant, onWater, onWaterMist, onMore, photoUrl, summerStart, summerEnd }: {
  plant: Plant
  onWater: () => void
  onWaterMist: () => void
  photoUrl?: string
  summerStart: number
  summerEnd: number
}) {
  const d = daysSince(plant.last_watered_at)
  const f = effectiveFreq(plant, summerStart, summerEnd)
  return (
    <div className="rounded-xl bg-white p-4 shadow">
      {photoUrl && (
        <Link href={`/plant/${plant.id}`}>
          <img src={photoUrl} alt={plant.name} className="mb-2 aspect-video w-full rounded object-cover hover:opacity-90" />
        </Link>
      )}
      <div className="mb-1 flex items-start justify-between">
        <h3 className="font-semibold text-emerald-900">
          <Link href={`/plant/${plant.id}`} className="hover:underline">{plant.name}</Link>
        </h3>
        {isDue(plant, summerStart, summerEnd) && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
            le toca
          </span>
        )}
      </div>
      <p className="mb-2 text-sm text-emerald-700">
        {plant.species ?? "—"} · {plant.location ?? "sin ubicación"}
      </p>
      <p className="mb-3 text-xs text-emerald-600">
        {d === null ? "Sin riegos registrados" : `Último riego hace ${d} días`}
        {f ? ` · cada ${f} días` : ""}
      </p>
      <div className="flex gap-2">
        <button onClick={onWater}
          className="flex-1 rounded bg-emerald-600 px-2 py-1.5 text-sm text-white hover:bg-emerald-700">
          💧 Regar
        </button>
        {plant.misting_enabled && (
          <button onClick={onWaterMist}
            className="flex-1 rounded bg-sky-600 px-2 py-1.5 text-sm text-white hover:bg-sky-700">
            💧+🌫
          </button>
        )}

      </div>
    </div>
  )
}