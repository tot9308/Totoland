"use client"

import { useState } from "react"

const LS_KEY = "tl_firststeps_hidden"

export default function FirstStepsCard({ hasPlant, hasWatering, hasHealth, pushGranted }: {
  hasPlant: boolean
  hasWatering: boolean
  hasHealth: boolean
  pushGranted: boolean
}) {
  const [hidden, setHidden] = useState(() => {
    if (typeof window === "undefined") return false
    return window.localStorage.getItem(LS_KEY) === "1"
  })
  const steps = [
    { id: "plant", label: "Añade tu primera planta", done: hasPlant, hint: "con \"+ Añadir planta\"" },
    { id: "water", label: "Registra un riego", done: hasWatering, hint: "botón 💧 Regar de su tarjeta" },
    { id: "health", label: "Marca cómo está hoy", done: hasHealth, hint: "ficha → 🏥 Salud → 🟢 🟡 🔴" },
    { id: "push", label: "Activa los avisos", done: pushGranted, hint: "Menú → Ajustes → Notificaciones" },
  ]
  const pending = steps.filter(s => !s.done).length
  if (hidden || pending === 0) return null
  return (
    <section className="mb-6 rounded-xl border-2 border-dashed border-[#5a7d4a]/60 bg-[#eaf1ee] p-4 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-800">🎓 Primeros pasos</h2>
        <button onClick={() => { setHidden(true); window.localStorage.setItem(LS_KEY, "1") }}
          className="text-xs text-stone-500 hover:underline">ocultar</button>
      </div>
      <p className="mb-3 text-xs text-stone-600">
        Cuatro cosas y dominas lo básico. Se marcan solas al hacerlo.
      </p>
      <ul className="space-y-2">
        {steps.map(s => (
          <li key={s.id} className="flex items-start gap-2 text-sm">
            <span>{s.done ? "✅" : "⬜"}</span>
            <span className={s.done ? "text-stone-500 line-through" : "text-stone-800"}>
              {s.label}
              {!s.done && <span className="ml-1 text-xs text-stone-500">— {s.hint}</span>}
            </span>
          </li>
        ))}
      </ul>
      {pending === 1 && (
        <p className="mt-2 text-xs font-medium text-[#5a7d4a]">¡Te queda solo una! 🎉</p>
      )}
    </section>
  )
}