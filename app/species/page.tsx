"use client"

import { useState } from "react"
import Link from "next/link"
import { SPECIES, LIGHT_LABELS, WATER_LABELS, DIFF_LABELS, type SpeciesCard } from "@/lib/species"

export default function SpeciesPage() {
  const [lightFilter, setLightFilter] = useState<number | null>(null)
  const [waterFilter, setWaterFilter] = useState<string | null>(null)
  const [diffFilter, setDiffFilter] = useState<number | null>(null)
  const [toxicFilter, setToxicFilter] = useState<boolean | null>(null)
  const [query, setQuery] = useState("")

  const filtered = SPECIES.filter(s => {
    if (lightFilter !== null && s.light !== lightFilter) return false
    if (waterFilter !== null && s.water !== waterFilter) return false
    if (diffFilter !== null && s.difficulty !== diffFilter) return false
    if (toxicFilter !== null && s.toxic !== toxicFilter) return false
    if (query.trim()) {
      const q = query.toLowerCase()
      if (!s.sci.toLowerCase().includes(q) && !s.common.toLowerCase().includes(q)) return false
    }
    return true
  })

  return (
    <main className="min-h-screen bg-stone-50 p-4 md:p-8">
      <header className="mb-6 flex items-center gap-3">
        <Link href="/" className="text-sm text-stone-600 hover:underline">← Volver</Link>
        <h1 className="text-2xl font-bold text-stone-800">📖 Buscador de especies</h1>
      </header>

      <section className="mb-6 rounded-xl bg-[#faf7f0] p-4 shadow-sm">
        <label className="mb-3 block text-sm text-stone-800">
          🔍 Buscar
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Monstera, poto, hedera…"
            className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
          />
        </label>
        <div className="mb-3 grid grid-cols-2 gap-2">
          <label className="block text-sm text-stone-800">
            Luz
            <select value={lightFilter ?? ""} onChange={e => setLightFilter(e.target.value ? Number(e.target.value) : null)}
              className="mt-1 w-full rounded border border-stone-300 px-2 py-2">
              <option value="">Todas</option>
              {Object.entries(LIGHT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="block text-sm text-stone-800">
            Riego
            <select value={waterFilter ?? ""} onChange={e => setWaterFilter(e.target.value || null)}
              className="mt-1 w-full rounded border border-stone-300 px-2 py-2">
              <option value="">Todos</option>
              {Object.entries(WATER_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </label>
          <label className="block text-sm text-stone-800">
            Dificultad
            <select value={diffFilter ?? ""} onChange={e => setDiffFilter(e.target.value ? Number(e.target.value) : null)}
              className="mt-1 w-full rounded border border-stone-300 px-2 py-2">
              <option value="">Todas</option>
              {Object.entries(DIFF_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="block text-sm text-stone-800">
            Mascotas
            <select value={toxicFilter === null ? "" : String(toxicFilter)}
              onChange={e => setToxicFilter(e.target.value === "" ? null : e.target.value === "true")}
              className="mt-1 w-full rounded border border-stone-300 px-2 py-2">
              <option value="">Todas</option>
              <option value="false">🐶 Seguras</option>
              <option value="true">⚠️ Tóxicas</option>
            </select>
          </label>
        </div>
        <p className="text-xs text-stone-600">{filtered.length} especies coinciden</p>
      </section>

      <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map(s => (
          <Link key={s.sci} href={`/species/${encodeURIComponent(s.sci)}`}
            className="block rounded-xl bg-[#faf7f0] p-4 shadow-sm transition hover:bg-stone-100">
            <h2 className="mb-1 text-lg font-semibold text-stone-800">{s.common}</h2>
            <p className="mb-2 text-xs text-stone-500 italic">{s.sci}</p>
            <div className="flex flex-wrap gap-1 text-xs">
              <span className="rounded bg-[#dfe9e4] px-2 py-0.5 text-stone-700">{LIGHT_LABELS[s.light]}</span>
              <span className="rounded bg-[#dfe9e4] px-2 py-0.5 text-stone-700">{WATER_LABELS[s.water].label}</span>
              <span className="rounded bg-[#dfe9e4] px-2 py-0.5 text-stone-700">{DIFF_LABELS[s.difficulty]}</span>
              {s.toxic && <span className="rounded bg-[#f5ece6] px-2 py-0.5 text-[#8a3a1a]">⚠️ Tóxica</span>}
            </div>
          </Link>
        ))}
      </section>
    </main>
  )
}