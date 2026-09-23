"use client"

import { useState } from "react"
import Link from "next/link"

type Cause = { c: string; fix: string; tag: string }
type Symptom = { id: string; label: string; causes: Cause[] }

const SYMPTOMS: Symptom[] = [
  {
    id: "yellow", label: "🟡 Hojas amarillas", causes: [
      { c: "Exceso de riego (raíz asfixiada)", fix: "Deja secar más entre riegos y comprueba el drenaje del tiesto.", tag: "Exceso de riego" },
      { c: "Falta de luz", fix: "Acerca la planta a la ventana o sube la intensidad lumínica.", tag: "Luz" },
      { c: "Falta de abono", fix: "Abona en dosis suaves durante primavera-verano.", tag: "Abono" },
    ],
  },
  {
    id: "tips", label: "🟤 Puntas secas", causes: [
      { c: "Ambiente seco o calefacción", fix: "Pulveriza o sube la humedad; aleja de radiadores.", tag: "Ambiente" },
      { c: "Sales del agua del grifo", fix: "Riega con agua reposada 24 h o de lluvia.", tag: "Agua" },
      { c: "Riego irregular", fix: "Mantén una pauta constante según la especie.", tag: "Riego" },
    ],
  },
  {
    id: "sticky", label: "🍯 Pegajoso o bolitas en tallo", causes: [
      { c: "Cochinilla o pulgón", fix: "Revisa el envés de las hojas; aplica jabón potásico al atardecer y repite en 5 días.", tag: "Plaga" },
    ],
  },
  {
    id: "spots", label: "🕳️ Manchas en las hojas", causes: [
      { c: "Hongo por hoja mojada", fix: "Evita mojar la hoja al pulverizar y ventila la zona.", tag: "Enfermedad" },
      { c: "Quemadura de sol directo", fix: "Filtra la luz del mediodía con una cortina.", tag: "Luz" },
    ],
  },
  {
    id: "droop", label: "🥀 Caída o aspecto mustio", causes: [
      { c: "Sed aguda", fix: "Riego profundo por inmersión si el sustrato está seco del todo.", tag: "Sequía" },
      { c: "Raíz dañada por encharcamiento", fix: "Saca del tiesto, revisa raíces y trasplanta a sustrato seco.", tag: "Exceso de riego" },
    ],
  },
  {
    id: "stretch", label: "🌱 Crece estirada o pálida", causes: [
      { c: "Falta de luz clara", fix: "Mueve a zona más luminosa; gira la maceta cada semana.", tag: "Luz" },
    ],
  },
]

export default function SymptomChecker() {
  const [sel, setSel] = useState<string | null>(null)
  const symptom = SYMPTOMS.find(s => s.id === sel)

  return (
    <section className="mb-6 rounded-xl bg-[#eaf1ee] p-4 shadow-sm">
      <h2 className="mb-1 text-lg font-semibold text-stone-800">🔎 ¿Qué le pasa a mi planta?</h2>
      <p className="mb-3 text-xs text-stone-600">
        Elige el síntoma y te digo las causas más probables y qué hacer.
      </p>
      <div className="mb-3 flex flex-wrap gap-2">
        {SYMPTOMS.map(s => (
          <button key={s.id} onClick={() => setSel(sel === s.id ? null : s.id)}
            className={`rounded-full px-3 py-1.5 text-sm ${sel === s.id
              ? "bg-[#5a7d4a] text-white"
              : "bg-white text-stone-700 shadow-sm hover:bg-stone-100"}`}>
            {s.label}
          </button>
        ))}
      </div>
      {symptom && (
        <div className="space-y-2">
          {symptom.causes.map((k, i) => (
            <div key={i} className="rounded-lg bg-white/80 p-3">
              <p className="text-sm font-semibold text-stone-800">
                {k.c}{" "}
                <span className="ml-1 rounded-full bg-[#f5ece6] px-2 py-0.5 text-[10px] font-medium text-[#8a3a1a]">
                  {k.tag}
                </span>
              </p>
              <p className="mt-1 text-xs text-stone-600">➡️ {k.fix}</p>
            </div>
          ))}
          <p className="pt-1 text-xs text-stone-600">
            ¿Va a más? Inicia un seguimiento guiado desde{" "}
            <Link href="/recovery" className="font-semibold text-[#5a7d4a] underline">Enfermería</Link>.
          </p>
        </div>
      )}
    </section>
  )
}