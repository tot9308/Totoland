"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { type Plant } from "@/lib/plants"

type Memorial = Plant & { thumbUrl: string; eventsCount: number; waterings: number }

export default function CemeteryPage() {
  const router = useRouter()
  const [items, setItems] = useState<Memorial[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace("/"); return }
    const { data: mem } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", user.id)
      .limit(1)
      .single()
    if (!mem) { router.replace("/"); return }

    const { data } = await supabase
      .from("plants")
      .select("*")
      .eq("household_id", mem.household_id)
      .eq("status", "dead")
      .order("died_at", { ascending: false })
    const list = (data as Plant[]) ?? []

    const out: Memorial[] = []
    for (const p of list) {
      let thumbUrl = ""
      if (p.main_photo_path) {
        const thumb = p.main_photo_path.replace(/\.jpg$/, "_thumb.jpg")
        const { data: s } = await supabase.storage.from("plant-photos").createSignedUrl(thumb, 3600)
        thumbUrl = s?.signedUrl ?? ""
      }
      const { count } = await supabase
        .from("care_events").select("*", { count: "exact", head: true }).eq("plant_id", p.id)
      const { count: wcount } = await supabase
        .from("care_events").select("*", { count: "exact", head: true }).eq("plant_id", p.id).eq("type", "watering")
      out.push({ ...p, thumbUrl, eventsCount: count ?? 0, waterings: wcount ?? 0 })
    }
    setItems(out)
    setLoading(false)
  }, [router])

  useEffect(() => { reload() }, [reload])

  async function revive(id: string) {
    const { error } = await supabase.from("plants").update({ status: "alive", died_at: null }).eq("id", id)
    if (error) return alert("Error: " + error.message)
    await reload()
  }

  async function del(id: string) {
    if (!confirm("¿Borrar DEFINITIVAMENTE esta planta con su historial y sus fotos? No se puede deshacer.")) return
    const { error } = await supabase.from("plants").delete().eq("id", id)
    if (error) return alert("Error: " + error.message)
    await reload()
  }

  return (
    <main className="min-h-screen bg-emerald-50 p-4 md:p-8">
      <header className="mb-6 flex items-center gap-3">
        <Link href="/" className="text-sm text-emerald-700 hover:underline">← Volver</Link>
        <h1 className="text-2xl font-bold text-emerald-900">🪦 Cementerio</h1>
        <span className="text-sm text-emerald-700">({items.length})</span>
      </header>

      {loading ? (
        <p className="text-emerald-800">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="text-emerald-800">Cementerio vacío. Que siga así 🌿</p>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map(p => (
            <article key={p.id} className="rounded-xl bg-white p-4 shadow">
              {p.thumbUrl && (
                <Link href={`/plant/${p.id}`}>
                  <img src={p.thumbUrl} alt={p.name}
                    className="mb-2 aspect-video w-full rounded object-cover grayscale" />
                </Link>
              )}
              <h2 className="font-semibold text-emerald-900">
                <Link href={`/plant/${p.id}`} className="hover:underline">{p.name}</Link>
              </h2>
              <p className="text-sm text-emerald-700">{p.species ?? "—"} · {p.location ?? "sin ubicación"}</p>
              <p className="mt-1 text-xs text-emerald-600">
                {p.acquired_at ? `Llegó: ${new Date(p.acquired_at).toLocaleDateString("es-ES")}` : "Llegada sin fecha"}
                {p.died_at ? ` · Se fue: ${new Date(p.died_at).toLocaleDateString("es-ES")}` : ""}
              </p>
              <p className="text-xs text-emerald-600">
                {p.waterings} riegos · {p.eventsCount} momentos en el historial
              </p>
              {p.notes && <p className="mt-2 text-sm italic text-emerald-700">“{p.notes}”</p>}
              <p className="mt-2 text-[11px] text-emerald-500">
                Pulsa el nombre o la foto para ver su ficha completa con fotos e historial.
              </p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => revive(p.id)}
                  className="flex-1 rounded bg-emerald-600 px-2 py-1.5 text-sm text-white hover:bg-emerald-700">
                  🌱 Revivir
                </button>
                <button onClick={() => del(p.id)}
                  className="rounded bg-red-600 px-2 py-1.5 text-sm text-white hover:bg-red-700">
                  🗑 Borrar
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}