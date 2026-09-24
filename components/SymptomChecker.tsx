"use client"

import { useState } from "react"
import Link from "next/link"

type Cause = { id: string; c: string; fix: string; tag: string }
type Option = { label: string; points: Record<string, number> }
type Question = { q: string; options: Option[] }
type Symptom = { id: string; label: string; causes: Cause[]; questions: Question[] }

const SYMPTOMS: Symptom[] = [
  {
    id: "yellow", label: "🟡 Hojas amarillas",
    causes: [
      { id: "overwater", c: "Exceso de riego (raíz asfixiada)", fix: "Deja secar más entre riegos; comprueba drenaje y vacía el plato.", tag: "Exceso de riego" },
      { id: "underwater", c: "Riego escaso o irregular", fix: "Riega a fondo y mantén una pauta constante según la ficha.", tag: "Sequía" },
      { id: "light", c: "Falta de luz", fix: "Acerca a la ventana y gira la maceta cada semana.", tag: "Luz" },
      { id: "fert", c: "Falta de nutrientes", fix: "Abona a dosis suaves en primavera-verano.", tag: "Abono" },
      { id: "natural", c: "Renovación natural de hojas viejas", fix: "Si son 1-2 hojas bajas al mes, es normal: retíralas.", tag: "Natural" },
    ],
    questions: [
      { q: "Toca el sustrato ahora: ¿cómo está?", options: [
        { label: "Húmedo o empapado", points: { overwater: 2 } },
        { label: "Seco del todo", points: { underwater: 2 } },
        { label: "Seco solo por arriba", points: { underwater: 1, light: 1 } },
        { label: "Normal, ni seco ni encharcado", points: { fert: 1, light: 1 } },
      ]},
      { q: "¿Qué hojas amarillean primero?", options: [
        { label: "Las de abajo (las viejas)", points: { natural: 2, overwater: 1 } },
        { label: "Las de arriba o brotes nuevos", points: { fert: 2, light: 1 } },
        { label: "Un poco por todas partes", points: { overwater: 1, underwater: 1 } },
      ]},
      { q: "¿Cómo va el riego últimamente?", options: [
        { label: "Riego de más o el plato queda con agua", points: { overwater: 2 } },
        { label: "Se me olvida o alargo mucho", points: { underwater: 2 } },
        { label: "Sigo la pauta de la ficha", points: { fert: 1, natural: 1 } },
      ]},
      { q: "¿Cuánta luz recibe donde está?", options: [
        { label: "Poca: lejos de ventana o pasillo", points: { light: 2 } },
        { label: "Media: ventana sin sol directo", points: { light: 1, fert: 1 } },
        { label: "Buena: cerca de ventana luminosa", points: { natural: 1, fert: 1 } },
      ]},
    ],
  },
  {
    id: "tips", label: "🟤 Puntas o bordes secos",
    causes: [
      { id: "dry_air", c: "Ambiente seco (calefacción o aire)", fix: "Sube la humedad: pulveriza, plato con guijarros o humidificador.", tag: "Ambiente" },
      { id: "salts", c: "Sales del agua del grifo", fix: "Usa agua reposada 24 h, filtrada o de lluvia.", tag: "Agua" },
      { id: "irregular", c: "Riego irregular (sed puntual)", fix: "Mantén el intervalo constante; no dejes secar de más.", tag: "Riego" },
      { id: "fert_excess", c: "Exceso de abono", fix: "Enjuaga el sustrato con abundante agua y baja la dosis.", tag: "Abono" },
    ],
    questions: [
      { q: "¿Dónde seca exactamente?", options: [
        { label: "Solo las puntas", points: { dry_air: 2, salts: 1 } },
        { label: "Bordes enteros de la hoja", points: { irregular: 2, fert_excess: 1 } },
        { label: "Punta y borde a la vez, crujiente", points: { salts: 1, irregular: 1, dry_air: 1 } },
      ]},
      { q: "¿Hay calefacción o aire seco cerca?", options: [
        { label: "Sí, radiador o estufa cerca", points: { dry_air: 2 } },
        { label: "Aire acondicionado o corriente", points: { dry_air: 2 } },
        { label: "No, ambiente normal", points: { salts: 1, irregular: 1 } },
      ]},
      { q: "¿Con qué agua riegas?", options: [
        { label: "Del grifo, directa", points: { salts: 2 } },
        { label: "Reposada, filtrada o de lluvia", points: { irregular: 1, fert_excess: 1 } },
      ]},
      { q: "¿Abonas con frecuencia o dosis altas?", options: [
        { label: "Sí, cada poco o dosis plena", points: { fert_excess: 2 } },
        { label: "Lo justo o nada", points: { irregular: 1, dry_air: 1 } },
      ]},
    ],
  },
  {
    id: "droop", label: "🥀 Mustia o caída",
    causes: [
      { id: "thirsty", c: "Sed aguda", fix: "Riego profundo o inmersión 10-15 min si está seco del todo.", tag: "Sequía" },
      { id: "root_rot", c: "Raíz podrida por encharcamiento", fix: "Saca del tiesto, corta raíces negras y trasplanta a sustrato seco.", tag: "Exceso de riego" },
      { id: "cold", c: "Golpe de frío o corriente", fix: "Aleja del frío; no riegues de más mientras se recupera.", tag: "Ambiente" },
      { id: "heat", c: "Golpe de calor o sol fuerte", fix: "Mueve a sombra y refresca el ambiente sin encharcar.", tag: "Ambiente" },
    ],
    questions: [
      { q: "Toca el sustrato: ¿cómo está?", options: [
        { label: "Seco del todo, maceta ligera", points: { thirsty: 3 } },
        { label: "Húmedo o empapado", points: { root_rot: 3 } },
        { label: "Normal", points: { cold: 1, heat: 1 } },
      ]},
      { q: "¿Pasó de golpe o poco a poco?", options: [
        { label: "De un día para otro", points: { cold: 2, heat: 2, thirsty: 1 } },
        { label: "Poco a poco en varios días", points: { root_rot: 2, thirsty: 1 } },
      ]},
      { q: "¿Cambió de sitio o clima recientemente?", options: [
        { label: "Sí: frío, ventana abierta o corriente", points: { cold: 2 } },
        { label: "Sí: sol directo u ola de calor", points: { heat: 2 } },
        { label: "No, mismo sitio", points: { thirsty: 1, root_rot: 1 } },
      ]},
    ],
  },
  {
    id: "pests", label: "🍯 Pegajoso, bichos o bolitas",
    causes: [
      { id: "cochinilla", c: "Cochinilla (bolitas algodonosas o escudos)", fix: "Retira con bastoncillo con alcohol; jabón potásico al atardecer, repite en 5 días.", tag: "Plaga" },
      { id: "pulgon", c: "Pulgón (bichitos verdes o negros)", fix: "Chorro de agua y jabón potásico cada 3 días hasta limpiar.", tag: "Plaga" },
      { id: "moscablanca", c: "Mosca blanca (vuela al tocar)", fix: "Trampas amarillas y jabón potásico en el envés.", tag: "Plaga" },
      { id: "arana", c: "Araña roja (telarañas finas y punteado)", fix: "Sube la humedad y aplica acaricida; revisa el envés.", tag: "Plaga" },
      { id: "sustrato_mosca", c: "Mosca del sustrato (mosquitas de la tierra)", fix: "Deja secar la capa superior; trampas amarillas pegajosas.", tag: "Plaga" },
    ],
    questions: [
      { q: "¿Qué ves exactamente?", options: [
        { label: "Bolitas blancas algodonosas o escudos marrones", points: { cochinilla: 3 } },
        { label: "Bichitos verdes o negros en brotes y envés", points: { pulgon: 3 } },
        { label: "Mosquitas que vuelan al tocar la planta", points: { moscablanca: 2, sustrato_mosca: 1 } },
        { label: "Mosquitas que salen de la tierra al regar", points: { sustrato_mosca: 3 } },
        { label: "Telarañas finas y punteado amarillo", points: { arana: 3 } },
      ]},
      { q: "¿Dónde se concentran?", options: [
        { label: "Tallo y uniones de hojas", points: { cochinilla: 2 } },
        { label: "Brotes tiernos y envés", points: { pulgon: 2, arana: 1 } },
        { label: "Solo la superficie de la tierra", points: { sustrato_mosca: 2 } },
        { label: "Por toda la planta", points: { moscablanca: 1, arana: 1 } },
      ]},
      { q: "¿Hay melaza pegajosa en las hojas?", options: [
        { label: "Sí, brillo pegajoso", points: { cochinilla: 1, pulgon: 1, moscablanca: 1 } },
        { label: "No", points: { arana: 1, sustrato_mosca: 1 } },
      ]},
    ],
  },
  {
    id: "spots", label: "🕳️ Manchas en las hojas",
    causes: [
      { id: "fungal", c: "Hongo (mancha marrón con halo amarillo)", fix: "Retira hojas afectadas, no mojes la hoja y aplica fungicida.", tag: "Enfermedad" },
      { id: "sunburn", c: "Quemadura de sol (mancha seca marrón clara)", fix: "Filtra el sol del mediodía; acostumbra al sol poco a poco.", tag: "Luz" },
      { id: "edema", c: "Edema por encharcamiento (bultos corchosos)", fix: "Riega menos y mejora la ventilación.", tag: "Exceso de riego" },
      { id: "cold_spot", c: "Daño por frío (manchas oscuras blandas)", fix: "Aleja del frío y retira lo muy dañado.", tag: "Ambiente" },
    ],
    questions: [
      { q: "¿Cómo son las manchas?", options: [
        { label: "Marrones con borde amarillo", points: { fungal: 3 } },
        { label: "Secas, marrón claro, en zona soleada", points: { sunburn: 3 } },
        { label: "Bultos o zonas corchosas por el envés", points: { edema: 2 } },
        { label: "Oscuras, blandas o acuosas", points: { cold_spot: 2, fungal: 1 } },
      ]},
      { q: "¿Mojas las hojas al regar o pulverizar?", options: [
        { label: "Sí, quedan mojadas", points: { fungal: 2 } },
        { label: "No, solo el sustrato", points: { sunburn: 1, edema: 1 } },
      ]},
      { q: "¿Le da sol directo o ha pasado frío?", options: [
        { label: "Sol directo del mediodía", points: { sunburn: 2 } },
        { label: "Frío o corriente reciente", points: { cold_spot: 2 } },
        { label: "Ninguno de los dos", points: { fungal: 1, edema: 1 } },
      ]},
    ],
  },
  {
    id: "drop", label: "🍂 Caída de hojas",
    causes: [
      { id: "shock", c: "Estrés por cambio de ubicación", fix: "Paciencia 2-3 semanas; no la muevas más ni abones ahora.", tag: "Estrés" },
      { id: "overwater", c: "Exceso de riego", fix: "Deja secar y revisa el drenaje; huele el sustrato por si huele a podrido.", tag: "Exceso de riego" },
      { id: "light_low", c: "Falta de luz", fix: "Acerca a la ventana más luminosa disponible.", tag: "Luz" },
      { id: "draft", c: "Corrientes de aire", fix: "Aleja de puertas, ventanas y salidas de aire.", tag: "Ambiente" },
    ],
    questions: [
      { q: "¿Cuándo empezó la caída?", options: [
        { label: "Al traerla o moverla de sitio", points: { shock: 3 } },
        { label: "Sin cambio de sitio", points: { overwater: 1, light_low: 1, draft: 1 } },
      ]},
      { q: "¿Cómo caen las hojas?", options: [
        { label: "Amarillean y caen", points: { overwater: 2, light_low: 1 } },
        { label: "Verdes y crujientes", points: { draft: 2, shock: 1 } },
        { label: "Verdes y blandas", points: { overwater: 1, shock: 1 } },
      ]},
      { q: "¿Cómo están el sustrato y la luz?", options: [
        { label: "Sustrato húmedo casi siempre", points: { overwater: 2 } },
        { label: "Sitio oscuro o lejos de ventana", points: { light_low: 2 } },
        { label: "Corriente o puerta cerca", points: { draft: 2 } },
        { label: "Todo normal", points: { shock: 1 } },
      ]},
    ],
  },
  {
    id: "nogrow", label: "🐌 No crece o crece rara",
    causes: [
      { id: "rest", c: "Reposo invernal (normal)", fix: "De noviembre a febrero es normal: no abones ni fuerces.", tag: "Natural" },
      { id: "light_low", c: "Falta de luz", fix: "Más luz: acerca a ventana o añade luz artificial.", tag: "Luz" },
      { id: "pot", c: "Maceta inadecuada (grande o agotada)", fix: "Trasplanta en primavera a maceta justa con sustrato fresco.", tag: "Sustrato" },
      { id: "fert_low", c: "Falta de abono", fix: "Abona a dosis suaves cada 15 días en temporada.", tag: "Abono" },
    ],
    questions: [
      { q: "¿En qué estación estamos?", options: [
        { label: "Otoño-invierno (nov-feb)", points: { rest: 3 } },
        { label: "Primavera-verano", points: { light_low: 1, fert_low: 1, pot: 1 } },
      ]},
      { q: "¿Cómo crece cuando lo hace?", options: [
        { label: "Estirada, pálida y con hojas pequeñas", points: { light_low: 3 } },
        { label: "Hojas normales pero muy pocas", points: { fert_low: 2, pot: 1 } },
        { label: "Nada en absoluto", points: { pot: 2, rest: 1 } },
      ]},
      { q: "¿Cuánto lleva sin trasplantar?", options: [
        { label: "Más de 2 años o raíces por el drenaje", points: { pot: 3 } },
        { label: "Menos de 2 años", points: { fert_low: 1, light_low: 1 } },
      ]},
    ],
  },
]

export default function SymptomChecker() {
  const [sel, setSel] = useState<string | null>(null)
  const [step, setStep] = useState(0)
  const [scores, setScores] = useState<Record<string, number>>({})

  const symptom = SYMPTOMS.find(s => s.id === sel) ?? null

  function pickSymptom(id: string) { setSel(id); setStep(0); setScores({}) }
  function answer(pts: Record<string, number>) {
    setScores(prev => {
      const next = { ...prev }
      for (const [k, v] of Object.entries(pts)) next[k] = (next[k] ?? 0) + v
      return next
    })
    setStep(s => s + 1)
  }
  function back() { if (step === 0) setSel(null); else setStep(s => s - 1) }

  const ranked = symptom
    ? [...symptom.causes].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0))
    : []

  return (
    <section className="mb-6 rounded-xl bg-[#eaf1ee] p-4 shadow-sm">
      <h2 className="mb-1 text-lg font-semibold text-stone-800">🔎 ¿Qué le pasa a mi planta?</h2>
      <p className="mb-3 text-xs text-stone-600">
        Elige el síntoma y responde unas preguntas para afinar la causa.
      </p>

      {!symptom && (
        <div className="flex flex-wrap gap-2">
          {SYMPTOMS.map(s => (
            <button key={s.id} onClick={() => pickSymptom(s.id)}
              className="rounded-full bg-white px-3 py-1.5 text-sm text-stone-700 shadow-sm hover:bg-stone-100">
              {s.label}
            </button>
          ))}
        </div>
      )}

      {symptom && step < symptom.questions.length && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <button onClick={back} className="text-xs text-stone-600 hover:underline">← Atrás</button>
            <span className="text-xs text-stone-500">Pregunta {step + 1} de {symptom.questions.length}</span>
          </div>
          <p className="mb-1 text-sm font-semibold text-stone-800">{symptom.label}</p>
          <p className="mb-3 text-sm text-stone-700">{symptom.questions[step].q}</p>
          <div className="flex flex-col gap-2">
            {symptom.questions[step].options.map((o, i) => (
              <button key={i} onClick={() => answer(o.points)}
                className="rounded-lg bg-white px-3 py-2 text-left text-sm text-stone-700 shadow-sm hover:bg-stone-100">
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {symptom && step >= symptom.questions.length && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <button onClick={() => { setStep(0); setScores({}) }} className="text-xs text-stone-600 hover:underline">
              ↻ Repetir preguntas
            </button>
            <button onClick={() => setSel(null)} className="text-xs text-stone-600 hover:underline">
              Cambiar síntoma
            </button>
          </div>
          <p className="mb-3 text-sm font-semibold text-stone-800">Resultado para: {symptom.label}</p>
          <div className="space-y-2">
            {ranked.map((c, i) => {
              const sc = scores[c.id] ?? 0
              if (sc <= 0 && i > 0) return null
              return (
                <div key={c.id} className={`rounded-lg p-3 ${i === 0 ? "bg-[#5a7d4a]" : "bg-white/80"}`}>
                  <p className={`text-sm font-semibold ${i === 0 ? "text-white" : "text-stone-800"}`}>
                    {i === 0 ? "🎯 Más probable: " : "También podría ser: "}{c.c}{" "}
                    <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${i === 0 ? "bg-white/20 text-white" : "bg-[#f5ece6] text-[#8a3a1a]"}`}>
                      {c.tag}
                    </span>
                  </p>
                  <p className={`mt-1 text-xs ${i === 0 ? "text-white/90" : "text-stone-600"}`}>➡️ {c.fix}</p>
                </div>
              )
            })}
          </div>
          <p className="pt-2 text-xs text-stone-600">
            ¿Va a más? Inicia un seguimiento guiado desde{" "}
            <Link href="/recovery" className="font-semibold text-[#5a7d4a] underline">Enfermería</Link>.
          </p>
        </div>
      )}
    </section>
  )
}