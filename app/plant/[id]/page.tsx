"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { EVENT_LABELS, type Plant } from "@/lib/plants"
import { compressToJpeg } from "@/lib/photos"

type EventRow = {
  id: string
  plant_id: string
  user_id: string
  type: string
  occurred_at: string
  notes: string | null
  batch_id: string | null
}

type PhotoRow = {
  id: string
  storage_path: string
  thumbnail_path: string | null
  taken_at: string
  user_id: string
}

const EVENT_ICONS: Record<string, string> = {
  watering: "💧",
  misting: "🌫",
  cleaning: "🧽",
  fertilizing: "🌾",
  pruning: "✂️",
  repotting: "🪴",
  treatment: "💊",
  observation: "👀",
  pest_detection: "🐛",
  disease_detection: "🦠",
  location_change: "📍",
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  })
}
export const dynamic = "force-dynamic"
export default function PlantDetail() {
  const params = useParams<{ id: string }>()
  const plantId = params.id

  const [userId, setUserId] = useState<string | null>(null)
  const [plant, setPlant] = useState<Plant | null>(null)
  const [events, setEvents] = useState<EventRow[]>([])
  const [photos, setPhotos] = useState<(PhotoRow & { thumbUrl: string; fullUrl: string })[]>([])
  const [names, setNames] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)
  const [editingTips, setEditingTips] = useState(false)
  const [tipsDraft, setTipsDraft] = useState("")

  const reload = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)

    const { data: p } = await supabase.from("plants").select("*").eq("id", plantId).single()
    setPlant(p as Plant)

    const { data: evs } = await supabase
      .from("care_events")
      .select("*")
      .eq("plant_id", plantId)
      .order("occurred_at", { ascending: false })
    const evRows = (evs as EventRow[]) ?? []
    setEvents(evRows)

    const uids = [...new Set(evRows.map(e => e.user_id))]
    if (uids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, display_name").in("id", uids)
      const map: Record<string, string> = {}
      for (const pr of profs ?? []) map[pr.id] = pr.display_name
      setNames(map)
    }

    const { data: phs } = await supabase
      .from("photos")
      .select("*")
      .eq("plant_id", plantId)
      .order("taken_at", { ascending: false })
    const rows = (phs as PhotoRow[]) ?? []
    const withUrls = await Promise.all(rows.map(async r => {
      const { data: t } = await supabase.storage.from("plant-photos").createSignedUrl(r.thumbnail_path ?? r.storage_path, 3600)
      const { data: f } = await supabase.storage.from("plant-photos").createSignedUrl(r.storage_path, 3600)
      return { ...r, thumbUrl: t?.signedUrl ?? "", fullUrl: f?.signedUrl ?? "" }
    }))
    setPhotos(withUrls)
  }, [plantId])

  useEffect(() => { reload() }, [reload])

  async function quickWater(withMist: boolean) {
    if (!plant || !userId) return
    const batch = crypto.randomUUID()
    const rows: object[] = [{ plant_id: plant.id, user_id: userId, type: "watering", batch_id: batch }]
    if (withMist && plant.misting_enabled)
      rows.push({ plant_id: plant.id, user_id: userId, type: "misting", batch_id: batch })
    const { error } = await supabase.from("care_events").insert(rows)
    if (error) return alert(error.message)
    await supabase.from("plants").update({ last_watered_at: new Date().toISOString() }).eq("id", plant.id)
    await reload()
  }
  async function saveTips() {
    if (!plant) return
    const { error } = await supabase
      .from("plants")
      .update({ care_tips: tipsDraft.trim() || null })
      .eq("id", plant.id)
    if (error) return alert(error.message)
    setEditingTips(false)
    await reload()
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file || !plant || !userId) return
    setUploading(true)
    try {
      const uuid = crypto.randomUUID()
      const base = `${plant.household_id}/${plant.id}/${uuid}`
      const full = await compressToJpeg(file, 1600, 0.8)
      const thumb = await compressToJpeg(file, 400, 0.7)
      const { error: e1 } = await supabase.storage.from("plant-photos")
        .upload(`${base}.jpg`, full, { contentType: "image/jpeg" })
      if (e1) throw e1
      const { error: e2 } = await supabase.storage.from("plant-photos")
        .upload(`${base}_thumb.jpg`, thumb, { contentType: "image/jpeg" })
      if (e2) throw e2
      const { error: e3 } = await supabase.from("photos").insert({
        plant_id: plant.id,
        user_id: userId,
        storage_path: `${base}.jpg`,
        thumbnail_path: `${base}_thumb.jpg`,
      })
      if (e3) throw e3
      if (!plant.main_photo_path)
        await supabase.from("plants").update({ main_photo_path: `${base}.jpg` }).eq("id", plant.id)
      await reload()
    } catch (err) {
      alert("Error al subir la foto: " + (err instanceof Error ? err.message : err))
    } finally {
      setUploading(false)
    }
  }
  async function setMain(path: string) {
    if (!plant) return
    const { error } = await supabase.from("plants").update({ main_photo_path: path }).eq("id", plant.id)
    if (error) return alert(error.message)
    await reload()
  }
  async function undoBatch(batch: string) {
    if (!confirm("¿Eliminar esta acción/ronda completa del historial?")) return
    const { error } = await supabase.from("care_events").delete().eq("batch_id", batch)
    if (error) return alert(error.message)
    const { data } = await supabase
      .from("care_events")
      .select("occurred_at")
      .eq("plant_id", plantId)
      .eq("type", "watering")
      .order("occurred_at", { ascending: false })
      .limit(1)
    await supabase.from("plants").update({ last_watered_at: data?.[0]?.occurred_at ?? null }).eq("id", plantId)
    await reload()
  }

  const batchCount: Record<string, number> = {}
  const firstEventOfBatch: Record<string, string> = {}
  for (const ev of events) {
    if (ev.batch_id) {
      batchCount[ev.batch_id] = (batchCount[ev.batch_id] ?? 0) + 1
      if (!firstEventOfBatch[ev.batch_id]) firstEventOfBatch[ev.batch_id] = ev.id
    }
  }

  if (!plant) return <main className="p-6">Cargando…</main>

  return (
    <main className="min-h-screen bg-emerald-50 p-4 md:p-8">
      <header className="mb-6 flex items-start justify-between gap-3">
        <div>
          <Link href="/" className="text-sm text-emerald-700 hover:underline">← Volver</Link>
          <h1 className="text-2xl font-bold text-emerald-900">🪴 {plant.name}</h1>
          <p className="text-sm text-emerald-700">
            {plant.species ?? "—"} · {plant.location ?? "sin ubicación"}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => quickWater(false)}
            className="rounded bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700">
            💧 Regar
          </button>
          {plant.misting_enabled && (
            <button onClick={() => quickWater(true)}
              className="rounded bg-sky-600 px-3 py-2 text-white hover:bg-sky-700">
              💧+🌫
            </button>
          )}
        </div>
      </header>
      <section className="mb-6 rounded-xl bg-amber-50 p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-amber-900">📌 Cuidados clave</h2>
          {!editingTips && (
            <button
              onClick={() => { setTipsDraft(plant.care_tips ?? ""); setEditingTips(true) }}
              className="text-xs text-amber-800 hover:underline"
            >
              {plant.care_tips ? "editar" : "+ añadir"}
            </button>
          )}
        </div>
        {editingTips ? (
          <>
            <textarea
              value={tipsDraft}
              onChange={e => setTipsDraft(e.target.value)}
              rows={3}
              placeholder={"Luz indirecta\nRegar cuando el sustrato esté seco"}
              className="w-full rounded border border-amber-300 px-3 py-2 text-sm"
            />
            <div className="mt-2 flex gap-2">
              <button onClick={saveTips}
                className="rounded bg-amber-600 px-3 py-1.5 text-sm text-white">
                Guardar
              </button>
              <button onClick={() => setEditingTips(false)}
                className="rounded px-3 py-1.5 text-sm text-amber-800">
                Cancelar
              </button>
            </div>
          </>
        ) : plant.care_tips ? (
          <ul className="list-disc space-y-1 pl-5 text-sm text-amber-900">
            {plant.care_tips.split("\n").filter(t => t.trim()).map((t, i) => (
              <li key={i}>{t.trim()}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-amber-800">Aún no hay cuidados clave.</p>
        )}
      </section>

      <section className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-emerald-900">Fotos ({photos.length})</h2>
          <label className="cursor-pointer rounded bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700">
            {uploading ? "Subiendo…" : "+ Añadir foto"}
            <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={onFile} />
          </label>
        </div>
        <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
          {photos.map(ph => (
            <div key={ph.id} className="block">
              <a href={ph.fullUrl} target="_blank" rel="noopener">
                <img src={ph.thumbUrl} alt={fmt(ph.taken_at)} className="aspect-square w-full rounded object-cover" />
              </a>
              <p className="mt-1 text-center text-[11px] text-emerald-700">
                {fmt(ph.taken_at)}{" "}
                <button
                  onClick={() => setMain(ph.storage_path)}
                  title="Foto principal"
                  className="ml-1 rounded px-1 hover:bg-emerald-100"
                >
                  {plant.main_photo_path === ph.storage_path ? "⭐" : "☆"}
                </button>
              </p>
            </div>
          ))}          {photos.length === 0 && <p className="text-sm text-emerald-700">Aún no hay fotos.</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-emerald-900">Historial</h2>
        <ul className="space-y-2">
          {events.map(ev => (
            <li key={ev.id} className="rounded-lg bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm text-emerald-900">
                  <span className="mr-1">{EVENT_ICONS[ev.type] ?? "•"}</span>
                  <strong>{EVENT_LABELS[ev.type] ?? ev.type}</strong>
                  {ev.batch_id && (batchCount[ev.batch_id] ?? 0) > 1 && (
                    <span className="ml-2 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] text-sky-800">
                      ronda de {batchCount[ev.batch_id]}
                    </span>
                  )}
                </div>
                {ev.batch_id && firstEventOfBatch[ev.batch_id] === ev.id && (
                  <button onClick={() => undoBatch(ev.batch_id!)}
                    className="text-xs text-red-600 hover:underline">
                    ↩ deshacer
                  </button>
                )}
              </div>
              <p className="text-xs text-emerald-700">
                {fmt(ev.occurred_at)} · {names[ev.user_id] ?? "alguien"}
              </p>
              {ev.notes && <p className="mt-1 text-sm text-emerald-800">{ev.notes}</p>}
            </li>
          ))}
          {events.length === 0 && <p className="text-sm text-emerald-700">Sin eventos todavía.</p>}
        </ul>
      </section>
    </main>
  )
}