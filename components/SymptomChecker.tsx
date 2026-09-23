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
      { c: "Envejecimiento natural", fix: "Si son solo las hojas más viejas (abajo), es normal: quítalas.", tag: "Natural" },
    ],
  },
  {
    id: "tips", label: "🟤 Puntas secas", causes: [
      { c: "Ambiente seco o calefacción", fix: "Pulveriza o sube la humedad; aleja de radiadores.", tag: "Ambiente" },
      { c: "Sales del agua del grifo", fix: "Riega con agua reposada 24 h o de lluvia.", tag: "Agua" },
      { c: "Riego irregular", fix: "Mantén una pauta constante según la especie.", tag: "Riego" },
      { c: "Exceso de abono", fix: "Enjuaga el sustrato con abundante agua y reduce el abono.", tag: "Abono" },
    ],
  },
  {
    id: "droop", label: "🥀 Caída o aspecto mustio", causes: [
      { c: "Sed aguda", fix: "Riego profundo por inmersión si el sustrato está seco del todo.", tag: "Sequía" },
      { c: "Raíz dañada por encharcamiento", fix: "Saca del tiesto, revisa raíces y trasplanta a sustrato seco.", tag: "Exceso de riego" },
      { c: "Corriente de aire frío", fix: "Aleja de ventanas mal aisladas o puertas que se abren mucho.", tag: "Ambiente" },
    ],
  },
  {
    id: "sticky", label: "🍯 Pegajoso o bolitas en tallo", causes: [
      { c: "Cochinilla algodonosa", fix: "Retira con bastoncillo empapado en alcohol; aplica jabón potásico al atardecer.", tag: "Plaga" },
      { c: "Pulgón", fix: "Chorro de agua a presión o jabón potásico cada 3 días hasta que desaparezcan.", tag: "Plaga" },
      { c: "Mosca blanca", fix: "Trampas cromáticas amarillas + jabón potásico en el envés.", tag: "Plaga" },
    ],
  },
  {
    id: "spots", label: "🕳️ Manchas en las hojas", causes: [
      { c: "Hongo por hoja mojada", fix: "Evita mojar la hoja al pulverizar y ventila la zona.", tag: "Enfermedad" },
      { c: "Quemadura de sol directo", fix: "Filtra la luz del mediodía con una cortina.", tag: "Luz" },
      { c: "Manchas marrones con borde amarillo", fix: "Probable hongo: retira hojas afectadas y aplica fungicida.", tag: "Enfermedad" },
      { c: "Manchas blancas polvorientas", fix: "Oídio: mejora ventilación y aplica azufre o bicarbonato.", tag: "Enfermedad" },
    ],
  },
  {
    id: "stretch", label: "🌱 Crece estirada o pálida", causes: [
      { c: "Falta de luz clara", fix: "Mueve a zona más luminosa; gira la maceta cada semana.", tag: "Luz" },
      { c: "Temperatura demasiado alta", fix: "Baja la temperatura nocturna si es posible.", tag: "Ambiente" },
    ],
  },
  {
    id: "drop", label: "🍂 Caída de hojas", causes: [
      { c: "Cambio brusco de ubicación", fix: "Dale tiempo: las plantas se adaptan en 2-3 semanas.", tag: "Estrés" },
      { c: "Corrientes de aire", fix: "Aleja de puertas, ventanas y aire acondicionado.", tag: "Ambiente" },
      { c: "Exceso de riego", fix: "Deja secar el sustrato y revisa el drenaje.", tag: "Exceso de riego" },
      { c: "Falta de luz", fix: "Acerca a una ventana más luminosa.", tag: "Luz" },
    ],
  },
  {
    id: "wrinkled", label: "🧻 Hojas arrugadas o blandas", causes: [
      { c: "Falta de agua en suculentas", fix: "Riego profundo hasta que salga agua por el drenaje.", tag: "Sequía" },
      { c: "Raíz podrida", fix: "Saca del tiesto, corta raíces negras y trasplanta a sustrato seco.", tag: "Exceso de riego" },
    ],
  },
  {
    id: "web", label: "🕸️ Telarañas finas en el envés", causes: [
      { c: "Araña roja", fix: "Aumenta humedad (odia el ambiente húmedo) y aplica acaricida específico.", tag: "Plaga" },
    ],
  },
  {
    id: "mold", label: "🧪 Moho blanco en el sustrato", causes: [
      { c: "Exceso de humedad y poca ventilación", fix: "Retira la capa superficial, deja secar y mejora la circulación de aire.", tag: "Ambiente" },
      { c: "Sustrato viejo o de mala calidad", fix: "Trasplanta a sustrato fresco y poroso.", tag: "Sustrato" },
    ],
  },
  {
    id: "gnats", label: "🦟 Mosquitas volando alrededor", causes: [
      { c: "Mosca del sustrato (larvas en tierra húmeda)", fix: "Deja secar la capa superficial entre riegos; trampas amarillas pegajosas.", tag: "Plaga" },
    ],
  },
  {
    id: "slow", label: "🐌 Crecimiento muy lento o parado", causes: [
      { c: "Reposo invernal normal", fix: "Si es invierno (nov-feb), es natural: no fuerces con abono.", tag: "Natural" },
      { c: "Falta de luz", fix: "Acerca a la ventana más luminosa de la casa.", tag: "Luz" },
      { c: "Maceta demasiado grande", fix: "Las raíces tardan en colonizar; trasplanta a una más justa.", tag: "Sustrato" },
      { c: "Falta de abono", fix: "Si es primavera-verano, abona a dosis suaves.", tag: "Abono" },
    ],
  },
  {
    id: "small", label: "🌿 Hojas nuevas más pequeñas", causes: [
      { c: "Falta de luz", fix: "Mueve a zona con más horas de luz directa o indirecta brillante.", tag: "Luz" },
      { c: "Falta de nutrientes", fix: "Abona con fertilizante equilibrado cada 15 días en temporada.", tag: "Abono" },
    ],
  },
  {
    id: "purple", label: "🟣 Coloración rojiza o morada", causes: [
      { c: "Estrés por frío", fix: "Si es una planta tropical, aléjala de ventanas frías.", tag: "Ambiente" },
      { c: "Exceso de luz directa", fix: "Filtra la luz del mediodía si no es una planta de sol.", tag: "Luz" },
      { c: "Falta de fósforo", fix: "Abona con fertilizante rico en fósforo (floración).", tag: "Abono" },
    ],
  },
  {
    id: "roots", label: "🌱 Raíces saliendo por el drenaje o superficie", causes: [
      { c: "Maceta pequeña", fix: "Trasplanta a una maceta 2-3 cm mayor en primavera.", tag: "Sustrato" },
      { c: "Sustrato degradado", fix: "Si lleva más de 2 años, trasplanta a sustrato fresco.", tag: "Sustrato" },
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