import Link from "next/link"
import { findSpecies, LIGHT_LABELS, WATER_LABELS, MIST_LABELS, SUBSTRATE_LABELS, DIFF_LABELS, FLAG_LABELS, fertLabel } from "@/lib/species"

export default function SpeciesDetailPage({ params }: { params: { name: string } }) {
  const s = findSpecies(decodeURIComponent(params.name))
  if (!s) return <main className="p-8"><p>Especie no encontrada.</p></main>

  return (
    <main className="min-h-screen bg-stone-50 p-4 md:p-8">
      <header className="mb-6">
        <Link href="/species" className="text-sm text-stone-600 hover:underline">← Volver</Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-800">{s.common}</h1>
        <p className="text-sm italic text-stone-600">{s.sci}</p>
      </header>

      <section className="mb-6 rounded-xl bg-[#faf7f0] p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-stone-800">🌿 Cuidados</h2>
        <div className="grid grid-cols-1 gap-2 text-sm text-stone-700 md:grid-cols-2">
          <p>☀️ <b>Luz:</b> {LIGHT_LABELS[s.light]}</p>
          <p>💧 <b>Riego:</b> {WATER_LABELS[s.water].label} — {WATER_LABELS[s.water].check}</p>
          <p>🌡️ <b>Temperatura:</b> {s.temp} °C</p>
          <p>🌫️ <b>Pulverización:</b> {MIST_LABELS[s.mist]}</p>
          <p>🪴 <b>Sustrato:</b> {SUBSTRATE_LABELS[s.substrate]}</p>
          <p>🌾 <b>Abono:</b> {fertLabel(s.fert)}</p>
          <p>🐶 <b>Tóxica para mascotas:</b> {s.toxic ? "sí" : "no"}</p>
          <p>📊 <b>Dificultad:</b> {DIFF_LABELS[s.difficulty]}</p>
          <p>💧 <b>Orientativo:</b> cada {s.ws} d en verano / {s.ww} d en invierno</p>
        </div>
        {s.flags && FLAG_LABELS[s.flags] && (
          <p className="mt-3 text-sm text-stone-700">{FLAG_LABELS[s.flags]}</p>
        )}
      </section>

      <p className="text-xs text-stone-500">
        Orientativo: manda siempre lo que observes en tu casa.
      </p>
    </main>
  )
}