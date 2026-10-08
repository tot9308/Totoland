"use client"

import { useState } from "react"

const STEPS = [
  { icon: "👋", title: "Bienvenido a Totoland", text: "Tu casa, tus plantas, sin olvidos. Esto es lo esencial en 20 segundos." },
  { icon: "💧", title: "Regar sin pensar", text: "El botón verde te dice qué toca hoy. Si te equivocas al registrar, puedes deshacer desde el aviso de abajo." },
  { icon: "🚦", title: "La salud, de un vistazo", text: "Marca 🟢 🟡 🔴 cómo ves cada planta. Si algo empeora, la app te insiste y te ofrece el diagnóstico por síntomas." },
  { icon: "🩺", title: "Y si se pone mala", text: "Enfermería te guía día a día con un plan de recuperación. No estás solo ante la plaga." },
  { icon: "🔔", title: "Que no se te olvide", text: "Activa los avisos en Ajustes y elige tu hora. Fin del tour: a cuidar 🌿" },
]

export default function OnboardingModal({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  const s = STEPS[step]
  const last = step === STEPS.length - 1
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-[#faf7f0] p-6 shadow-xl">
        <div className="mb-4 text-center text-5xl">{s.icon}</div>
        <h2 className="mb-2 text-center text-lg font-semibold text-stone-800">{s.title}</h2>
        <p className="mb-5 text-center text-sm text-stone-700">{s.text}</p>
        <div className="mb-4 flex justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <span key={i}
              className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-[#5a7d4a]" : "w-1.5 bg-stone-300"}`} />
          ))}
        </div>
        <div className="flex items-center justify-between gap-2">
          <button onClick={onDone} className="rounded px-3 py-2 text-sm text-stone-500 hover:bg-stone-100">
            Saltar
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)}
                className="rounded border border-stone-300 px-3 py-2 text-sm text-stone-700 hover:bg-stone-100">
                ← Atrás
              </button>
            )}
            <button onClick={() => (last ? onDone() : setStep(step + 1))}
              className="rounded bg-[#5a7d4a] px-4 py-2 text-sm text-white hover:bg-[#4a6a3a]">
              {last ? "Empezar 🌱" : "Siguiente"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}