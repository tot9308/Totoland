"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { getActiveHouseholdId } from "@/lib/household"
import { SPECIES, LIGHT_LABELS, WATER_LABELS, DIFF_LABELS } from "@/lib/species"

export default function SpeciesPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [favs, setFavs] = useState<Set<string>>(new Set())
  const [owned, setOwned] = useState<Set<string>>(new Set())
  const [onlyFavs, setOnlyFavs] = useState(false)
  const [onlyOwned, setOnlyOwned] = useState(false)
  const [lightFilter, setLightFilter] = useState<number | null>(null)
  const [waterFilter, setWaterFilter] = useState<string | null>(null)
  const [diffFilter, setDiffFilter] = useState<number | null>(null)
  const [toxicFilter, setToxicFilter] = useState<boolean | null>(null)
  const [query, setQuery] = useState("")

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data: f } = await supabase
        .from("species_favorites").select("sci").eq("user_id", user.id)
      setFavs(new Set((f ?? []).map((r: any) => r.sci)))
      const hid = await getActiveHouseholdId(user.id)
      if (hid) {
        const { data: pl } = await supabase.from("plants")
          .select("species").eq("household_id", hid).neq("status", "dead")
        setOwned(new Set((pl ?? []).map((p: any) => p.species).filter(Boolean)))
      }
    })()
  }, [])

  async function toggleFav(e: React.MouseEvent, sci: string) {
    e.preventDefault()
    e.stopPropagation()
    if (!userId) return
    if (favs.has(sci)) {
      await supabase.from("species_favorites").delete().eq("user_id", userId).eq("sci", sci)
      setFavs(prev => { const n = new Set(prev); n.delete(sci); return n })
    } else {
      await supabase.from("species_favorites").insert({ user_id: userId, sci })
      setFavs(prev => new Set(prev).add(sci))
    }
  }

  const filtered = SPECIES.filter(s => {
    if (onlyFavs && !favs.has(s.sci)) return false
    if (onlyOwned && !owned.has(s.sci)) return false
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

        <div className="mb-3 flex flex-wrap gap-2">
          <button onClick={() => setOnlyFavs(v => !v)}
            className={`rounded-full px-3 py-1.5 text-sm ${onlyFavs ? "bg-[#c9a45a] text-white" : "bg-white text-stone-700 shadow-sm"}`}>
            ⭐ Favoritas ({favs.size})
          </button>
          <button onClick={() => setOnlyOwned(v => !v)}
            className={`rounded-full px-3 py-1.5 text-sm ${onlyOwned ? "bg-[#5a7d4a] text-white" : "bg-white text-stone-700 shadow-sm"}`}>
            🏠 Las que tengo ({owned.size})
          </button>
        </div>

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
          <div key={s.sci} className="relative">
            <Link href={`/species/${encodeURIComponent(s.sci)}`}
              className="block rounded-xl bg-[#faf7f0] p-4 pr-10 shadow-sm transition hover:bg-stone-100">
              <h2 className="mb-1 text-lg font-semibold text-stone-800">
                {owned.has(s.sci) && <span title="La tienes en casa">🏠 </span>}
                {s.common}
              </h2>
              <p className="mb-2 text-xs text-stone-500 italic">{s.sci}</p>
              <div className="flex flex-wrap gap-1 text-xs">
                <span className="rounded bg-[#dfe9e4] px-2 py-0.5 text-stone-700">{LIGHT_LABELS[s.light]}</span>
                <span className="rounded bg-[#dfe9e4] px-2 py-0.5 text-stone-700">{WATER_LABELS[s.water].label}</span>
                <span className="rounded bg-[#dfe9e4] px-2 py-0.5 text-stone-700">{DIFF_LABELS[s.difficulty]}</span>
                {s.toxic && <span className="rounded bg-[#f5ece6] px-2 py-0.5 text-[#8a3a1a]">⚠️ Tóxica</span>}
              </div>
            </Link>
            <button onClick={e => toggleFav(e, s.sci)}
              title={favs.has(s.sci) ? "Quitar de favoritas" : "Añadir a favoritas"}
              className="absolute right-2 top-2 rounded px-1.5 py-1 text-lg hover:bg-stone-200">
              {favs.has(s.sci) ? "⭐" : "☆"}
            </button>
          </div>
        ))}
      </section>
      {filtered.length === 0 && (
        <p className="text-sm text-stone-600">Ninguna especie coincide con los filtros.</p>
      )}
    </main>
  )
}