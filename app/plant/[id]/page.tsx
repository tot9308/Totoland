"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { compressToJpeg } from "@/lib/photos"
import PlantForm from "@/components/PlantForm"
import EventForm from "@/components/EventForm"
import RecoveryPanel from "@/components/RecoveryPanel"
import {
  findSpecies, LIGHT_LABELS, WATER_LABELS, MIST_LABELS,
  SUBSTRATE_LABELS, DIFF_LABELS, FLAG_LABELS, fertLabel,
} from "@/lib/species"
import { TYPE_LABEL, plantType, plantCategory } from "@/lib/recovery"
import { careTemplate } from "@/lib/careTemplate"
import { useConfirm } from "@/components/UiProvider"
import HealthChart from "@/components/HealthChart"
import { DEATH_CAUSES } from "@/lib/causes"
import CropModal from "@/components/CropModal"
import { EVENT_LABELS, waterAmount, daysSince, daysUntilDue, type Plant, mistingDue, mistingFreqForSeason } from "@/lib/plants"
import ShareCard from "@/components/ShareCard"
import SymptomChecker from "@/components/SymptomChecker"
import type { ProtocolKind, Culprit, Severity } from "@/lib/protocols"

type EventRow = {
  id: string
  plant_id: string
  user_id: string
  type: string
  occurred_at: string
  notes: string | null
  batch_id: string | null
  detail: string | null
  health: string | null
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

const HEALTH_ICON: Record<string, string> = { green: "🟢", yellow: "🟡", red: "🔴" }

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
  const [showEdit, setShowEdit] = useState(false)
  const [showEvent, setShowEvent] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const { confirm: confirmAsync } = useConfirm()
  const [showBury, setShowBury] = useState(false)
  const [buryCause, setBuryCause] = useState("unknown")
  const [buryNote, setBuryNote] = useState("")
  const [showCrop, setShowCrop] = useState(false)
  const [showSpecies, setShowSpecies] = useState<boolean | null>(null)
  const [summerStart, setSummerStart] = useState(5)
  const [summerEnd, setSummerEnd] = useState(9)
  const [showShare, setShowShare] = useState(false)
  const [recoveryPreset, setRecoveryPreset] = useState<{ kind: ProtocolKind; culprit: Culprit | null; severity: Severity } | null>(null)

  const reload = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)

    const { data: p } = await supabase.from("plants").select("*").eq("id", plantId).single()
    setPlant(p as Plant)

    if (p) {
      const { data: hh } = await supabase.from("households")
        .select("summer_start_month, summer_end_month").eq("id", p.household_id).single()
      if (hh) { setSummerStart(hh.summer_start_month); setSummerEnd(hh.summer_end_month) }
    }

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

  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.location.hash === "#seguimiento") {
      setTimeout(() => {
        const el = document.getElementById("seguimiento") as HTMLDetailsElement | null
        if (el) {
          el.open = true
          el.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      }, 100)
    }
  }, [plant])

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

  async function quickMist() {
    if (!plant || !userId) return
    const { error } = await supabase.from("care_events").insert({
      plant_id: plant.id, user_id: userId, type: "misting",
    })
    if (error) return alert(error.message)
    await supabase.from("plants").update({ last_misted_at: new Date().toISOString() }).eq("id", plant.id)
    await reload()
  }

  async function markHealth(level: string) {
    if (!plant || !userId) return
    const { error } = await supabase.from("care_events").insert({
      plant_id: plant.id, user_id: userId, type: "observation", health: level,
    })
    if (error) return alert(error.message)
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
    if (!await confirmAsync("¿Eliminar esta acción/ronda completa del historial?")) return
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
  async function deleteEvent(ev: EventRow) {
    if (!await confirmAsync("¿Eliminar este evento del historial?")) return
    const { error } = await supabase.from("care_events").delete().eq("id", ev.id)
    if (error) return alert(error.message)
    if (ev.type === "watering") {
      const { data } = await supabase.from("care_events")
        .select("occurred_at").eq("plant_id", plantId).eq("type", "watering")
        .order("occurred_at", { ascending: false }).limit(1)
      await supabase.from("plants").update({ last_watered_at: data?.[0]?.occurred_at ?? null }).eq("id", plantId)
    }
    await reload()
  }
  function exportPdf() {
    if (!plant) return
    const rows = events.map(ev =>
      `<tr><td>${new Date(ev.occurred_at).toLocaleDateString("es-ES")}</td><td>${EVENT_LABELS[ev.type] ?? ev.type}</td><td>${names[ev.user_id] ?? ""}</td><td>${ev.notes ?? ""}</td></tr>`
    ).join("")
    const imgs = photos.map(ph =>
      `<img src="${ph.fullUrl}" style="width:220px;margin:6px;border-radius:8px"/>`
    ).join("")
    const w = window.open("", "_blank")
    if (!w) return
    w.document.write(`
      <html><head><title>${plant.name} · Totoland</title></head>
      <body style="font-family:sans-serif;padding:24px">
        <h1>🪴 ${plant.name}</h1>
        <p>${plant.species ?? ""} ${plant.location ? "· " + plant.location : ""}</p>
        ${plant.care_tips ? "<p><b>Cuidados clave:</b> " + plant.care_tips.split("\n").join(" · ") + "</p>" : ""}
        <h2>Fotos</h2><div>${imgs || "Sin fotos"}</div>
        <h2>Historial</h2>
        <table border="1" cellpadding="6" style="border-collapse:collapse;width:100%">
          <tr><th>Fecha</th><th>Tipo</th><th>Quién</th><th>Notas</th></tr>
          ${rows}
        </table>
        <script>window.print()</script>
      </body></html>
    `)
    w.document.close()
  }

  function toCemetery() { setShowBury(true) }

  async function confirmBury() {
    if (!plant) return
    const causeLabel = DEATH_CAUSES[buryCause] ?? "No lo sé"
    const notes = `Causa: ${causeLabel}.${buryNote.trim() ? " " + buryNote.trim() : ""}`
    const { error } = await supabase.from("plants").update({
      status: "dead",
      died_at: new Date().toISOString().slice(0, 10),
      death_cause: buryCause,
      notes,
    }).eq("id", plant.id)
    if (error) return alert("Error: " + error.message)
    setShowBury(false)
    alert("Descanse en paz 🪦")
    window.location.href = "/"
  }
  const batchCount: Record<string, number> = {}
  const firstEventOfBatch: Record<string, string> = {}
  for (const ev of events) {
    if (ev.batch_id) {
      batchCount[ev.batch_id] = (batchCount[ev.batch_id] ?? 0) + 1
      if (!firstEventOfBatch[ev.batch_id]) firstEventOfBatch[ev.batch_id] = ev.id
    }
  }
  const lastHealth = events.find(e => e.health) ?? null

  const IMPORTANT = new Set(["observation", "pest_detection", "disease_detection", "treatment", "repotting", "pruning", "fertilizing"])
  type Item = { key: string; at: string; important: boolean; ev: EventRow; count?: number }
  const seenBatch = new Set<string>()
  const items: Item[] = []
  for (const ev of events) {
    if (IMPORTANT.has(ev.type)) {
      items.push({ key: ev.id, at: ev.occurred_at, important: true, ev })
    } else if (ev.batch_id) {
      if (seenBatch.has(ev.batch_id)) continue
      seenBatch.add(ev.batch_id)
      items.push({ key: ev.batch_id, at: ev.occurred_at, important: false, ev, count: batchCount[ev.batch_id] })
    } else {
      items.push({ key: ev.id, at: ev.occurred_at, important: false, ev })
    }
  }
  const ordered = [...items.filter(i => i.important), ...items.filter(i => !i.important)]
  const visibleItems = showAll ? ordered : ordered.slice(0, 3)

  if (!plant) return <main className="p-6">Cargando…</main>

  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString()
  const speciesCard = findSpecies(plant.species ?? "")
  const mainPhoto = photos.find(ph => ph.storage_path === plant.main_photo_path)
  const waterAmt = waterAmount(plant)

  return (
    <main className="min-h-screen bg-stone-50 p-4 md:p-8">
      <header className="mb-6">
        <Link href="/" className="text-sm text-stone-600 hover:underline">← Volver</Link>
        <div className="mt-1 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-stone-800">🪴 {plant.name}</h1>
            <p className="text-sm text-stone-600">
              {plant.species ?? "—"} · {plant.location ?? "sin ubicación"}
            </p>
            {waterAmt && (
              <p className="text-xs text-stone-500">
                💦 Riego: ≈ {waterAmt.min}–{waterAmt.max} ml por vez (maceta de {plant.pot_diameter_cm} cm)
                {plant.has_saucer && " · vacía el plato a los 10-15 min"}
              </p>
            )}
            {plant.last_watered_at && (
              <p className="text-xs text-stone-500">
                💧 Último riego: hace {daysSince(plant.last_watered_at)} días
                {(() => {
                  const du = daysUntilDue(plant, summerStart, summerEnd)
                  if (du === null) return ""
                  return du <= 0 ? " · ¡toca hoy!" : ` · próximo en ${du} días`
                })()}
              </p>
            )}
            {plant.misting_enabled && plant.last_misted_at && (
              <p className="text-xs text-stone-500">
                🌫️ Última pulverización: hace {daysSince(plant.last_misted_at)} días
                {(() => {
                  const f = mistingFreqForSeason(plant, summerStart, summerEnd)
                  if (!f) return ""
                  return mistingDue(plant, summerStart, summerEnd)
                    ? " · ¡toca hoy!"
                    : ` · próxima en ${f - daysSince(plant.last_misted_at)} días`
                })()}
              </p>
            )}
          </div>
          <div className="relative">
            <button onClick={() => setShowMore(m => !m)}
              className="rounded border border-stone-300 px-3 py-2 text-lg leading-none text-stone-700 hover:bg-stone-100">
              ⋮
            </button>
            {showMore && (
              <div className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-lg bg-[#faf7f0] shadow-xl">
                <button onClick={() => { setShowMore(false); setShowEdit(true) }}
                  className="block w-full px-4 py-2 text-left text-sm text-stone-700 hover:bg-stone-100">✏️ Editar planta</button>
                <button onClick={() => { setShowMore(false); setShowEvent(true) }}
                  className="block w-full px-4 py-2 text-left text-sm text-stone-700 hover:bg-stone-100">＋ Añadir otro evento</button>
                <button onClick={() => { setShowMore(false); exportPdf() }}
                  className="block w-full px-4 py-2 text-left text-sm text-stone-700 hover:bg-stone-100">🖨 Ficha PDF</button>
                <Link href="/tasks" onClick={() => setShowMore(false)}
                  className="block w-full px-4 py-2 text-left text-sm text-stone-700 hover:bg-stone-100">📋 Tareas y recordatorios</Link>
                {plant.main_photo_path && (
                  <button onClick={() => { setShowMore(false); setShowCrop(true) }}
                    className="block w-full px-4 py-2 text-left text-sm text-stone-700 hover:bg-stone-100">
                    ✂️ Recortar foto
                  </button>
                )}
                <button onClick={() => { setShowMore(false); toCemetery() }}
                  className="block w-full px-4 py-2 text-left text-sm text-[#8a3a1a] hover:bg-red-50">🪦 Mandar al cementerio</button>
              </div>
            )}
          </div>
        </div>
        {(() => {
          const main = photos.find(ph => ph.storage_path === plant.main_photo_path)
          if (!main) return null
          const cb = plant.crop_box
          return (
            <div className="mx-auto mt-3 w-full max-w-xs">
              <div className="aspect-[4/5] w-full overflow-hidden rounded-xl shadow-sm">
                <img
                  src={main.fullUrl}
                  alt={plant.name}
                  className="h-full w-full object-cover"
                  style={cb ? {
                    objectPosition: `${cb.x}% ${cb.y}%`,
                    transform: `scale(${100 / cb.width})`,
                    transformOrigin: `${cb.x}% ${cb.y}%`,
                  } : undefined}
                />
              </div>
            </div>
          )
        })()}
        <div className="mt-4 flex flex-wrap gap-2">
<button onClick={() => quickWater(false)}
            className="rounded-xl bg-[#5a7d4a] px-4 py-2.5 text-sm text-white hover:bg-[#4a6a3a]">
            💧 Regar {waterAmt ? `(${waterAmt.min}–${waterAmt.max} ml)` : ""}
          </button>
          {plant.misting_enabled && (
            <button onClick={() => quickMist()}
              className="rounded-xl bg-[#7ba7bc] px-4 py-2.5 text-sm text-white hover:bg-[#5a8ca6]">
              🌫️ Solo pulverizar
            </button>
          )}
          {plant.misting_enabled && (
            <button onClick={() => quickWater(true)}
              className="rounded-xl bg-[#5a8ca6] px-4 py-2.5 text-sm text-white hover:bg-[#497691]">
              💧 + 🌫️ Ambas
            </button>
          )}
          <button onClick={() => setShowShare(true)}
            className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-100">
            📤 Compartir
          </button>
        </div>

        <section className="mt-3 rounded-xl bg-[#faf7f0] p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-stone-800">🏥 Salud</h2>
          
          {/* Estado actual */}
          <p className="mb-2 text-sm font-medium text-stone-700">¿Cómo está hoy?</p>
          <div className="flex gap-2">
            <button onClick={() => markHealth("green")}
              className="flex-1 rounded-lg bg-[#dfe9e4] px-3 py-2 text-sm text-stone-800 hover:bg-[#c9dccf]">🟢 Bien</button>
            <button onClick={() => markHealth("yellow")}
              className="flex-1 rounded-lg bg-[#efe3c8] px-3 py-2 text-sm text-stone-800 hover:bg-[#e3d3ae]">🟡 Vigilante</button>
            <button onClick={() => markHealth("red")}
              className="flex-1 rounded-lg bg-[#ecd9cd] px-3 py-2 text-sm text-stone-800 hover:bg-[#e0c3b0]">🔴 Estrés</button>
          </div>
          {lastHealth && (
            <p className="mt-2 text-xs text-stone-600">
              Último estado: {HEALTH_ICON[lastHealth.health!]} · {fmt(lastHealth.occurred_at)}
            </p>
          )}

          {/* Gráfico de evolución */}
          <div className="mt-4">
            <HealthChart plantId={plant.id} forceSnapshot plain />
          </div>

          {/* Seguimiento */}
          <details
            id="seguimiento"
            key={plant.recovery_kind ?? "none"}
            open={!!plant.recovery_kind || !!recoveryPreset}
            className="mt-4 rounded-lg bg-white/50 p-3"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-stone-800">🩺 Seguimiento</span>
                {plant.recovery_kind ? (
                  <span className="rounded-full bg-[#f5ece6] px-2 py-0.5 text-xs font-medium text-[#8a3a1a]">
                    1 en curso
                  </span>
                ) : (
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
                    sin activo
                  </span>
                )}
              </div>
              <span className="text-xs text-stone-400">{plant.recovery_kind ? "▴" : "▾"}</span>
            </summary>
            <div className="mt-3">
              <RecoveryPanel plant={plant} userId={userId ?? ""} onChanged={reload} preset={recoveryPreset} />
            </div>
          </details>
          <details className="mt-4 rounded-lg bg-white/50 p-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
              <span className="text-sm font-semibold text-stone-800">🔎 Diagnóstico por síntomas</span>
              <span className="text-xs text-stone-400">▾</span>
            </summary>
            <div className="mt-3">
              <SymptomChecker
                plant={plant}
                onStartRecovery={(k, c, s) => setRecoveryPreset({ kind: k, culprit: c, severity: s })}
              />
            </div>
          </details>
        </section>

      </header>
      <section className="mb-6 rounded-xl bg-[#f7f0e3] p-4 shadow-sm">
        {editingTips ? (
          <>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-800">📌 Cuidados clave</h2>
            </div>
            <textarea
              value={tipsDraft}
              onChange={e => setTipsDraft(e.target.value)}
              rows={3}
              placeholder={"Luz indirecta\nRegar cuando el sustrato esté seco\nAbonar cada 15 días en primavera"}
              className="w-full rounded border border-stone-300 px-3 py-2 text-sm"
            />
            <div className="mt-2 flex gap-2">
              <button onClick={saveTips}
                className="rounded bg-[#c9a45a] px-3 py-1.5 text-sm text-white">
                Guardar
              </button>
              {speciesCard && (
                <button onClick={() => setTipsDraft(careTemplate(speciesCard))}
                  className="rounded border border-[#c9a45a] px-3 py-1.5 text-sm text-stone-700 hover:bg-[#efe3c8]">
                  ✨ Plantilla
                </button>
              )}
              <button onClick={() => setEditingTips(false)}
                className="rounded px-3 py-1.5 text-sm text-stone-700">
                Cancelar
              </button>
            </div>
          </>
        ) : plant.care_tips ? (
          <>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-800">📌 Cuidados clave</h2>
              <button
                onClick={() => { setTipsDraft(plant.care_tips ?? ""); setEditingTips(true) }}
                className="text-xs text-stone-700 hover:underline"
              >
                ✏️ Editar
              </button>
            </div>
            <ul className="list-disc space-y-1 pl-5 text-sm text-stone-800">
              {plant.care_tips.split("\n").filter(t => t.trim()).map((t, i) => (
                <li key={i}>{t.trim()}</li>
              ))}
            </ul>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-stone-700">Sin cuidados clave todavía.</p>
            <div className="flex gap-2">
              {speciesCard && (
                <button
                  onClick={() => { setTipsDraft(careTemplate(speciesCard)); setEditingTips(true) }}
                  className="rounded border border-[#c9a45a] px-3 py-1.5 text-sm text-stone-700 hover:bg-[#efe3c8]"
                >
                  ✨ Plantilla
                </button>
              )}
              <button
                onClick={() => { setTipsDraft(""); setEditingTips(true) }}
                className="rounded bg-[#c9a45a] px-3 py-1.5 text-sm text-white hover:bg-[#b08f47]"
              >
                ＋ Añadir cuidados
              </button>
            </div>
          </div>
        )}
      </section>

      {speciesCard && (() => {
        const expanded = showSpecies ?? !plant.care_tips
        return (
          <section className="mb-6 rounded-xl bg-[#eaf1ee] p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-stone-800">
                📖 {speciesCard.sci}{" "}
                <span className="text-sm font-normal text-stone-600">({speciesCard.common})</span>
              </h2>
              <button onClick={() => setShowSpecies(!expanded)}
                className="shrink-0 rounded border border-stone-300 px-2 py-1 text-xs text-stone-600 hover:bg-stone-100">
                {expanded ? "Ver menos ▴" : "Ver más ▾"}
              </button>
            </div>
            <div className={`relative ${expanded ? "" : "max-h-32 overflow-hidden"}`}>
              <div className="grid grid-cols-1 gap-1 text-sm text-stone-800 md:grid-cols-2">
                <p>{LIGHT_LABELS[speciesCard.light]}</p>
                <p>
                  {WATER_LABELS[speciesCard.water].label} · {WATER_LABELS[speciesCard.water].check}
                </p>
                <p>🌡️ {speciesCard.temp} °C</p>
                <p>{MIST_LABELS[speciesCard.mist]}</p>
                <p>🪴 Sustrato: {SUBSTRATE_LABELS[speciesCard.substrate]}</p>
                <p>🌾 Abono: {fertLabel(speciesCard.fert)}</p>
                <p>🐶 Tóxica para mascotas: {speciesCard.toxic ? "sí" : "no"}</p>
                <p>Dificultad: {DIFF_LABELS[speciesCard.difficulty]}</p>
                <p>🏷️ Categoría: {plantCategory(speciesCard)}</p>
                <p>🧬 Tipo (recuperación): {TYPE_LABEL[plantType(speciesCard, plant.plant_type)]}</p>
                <p>💧 Orientativo: {speciesCard.ws} d verano / {speciesCard.ww} d invierno</p>
              </div>
              {speciesCard.flags && FLAG_LABELS[speciesCard.flags] && (
                <p className="mt-2 text-sm text-stone-700">{FLAG_LABELS[speciesCard.flags]}</p>
              )}
              {!expanded && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#eaf1ee] to-transparent" />
              )}
            </div>
            <p className="mt-1 text-[11px] text-stone-500">
              Orientativo: manda lo que observes en tu casa.
            </p>
          </section>
        )
      })()}

      <section className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-800">Fotos ({photos.length})</h2>
          <label className="cursor-pointer rounded bg-[#5a7d4a] px-3 py-1.5 text-white hover:bg-[#4a6a3a]">
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
              <p className="mt-1 text-center text-[11px] text-stone-600">
                {fmt(ph.taken_at)}{" "}
                <button
                  onClick={() => setMain(ph.storage_path)}
                  title="Foto principal"
                  className="ml-1 rounded px-1 hover:bg-stone-200"
                >
                  {plant.main_photo_path === ph.storage_path ? "⭐" : "☆"}
                </button>
              </p>
            </div>
          ))}
          {photos.length === 0 && <p className="text-sm text-stone-600">Aún no hay fotos.</p>}
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-800">Historial</h2>
          {ordered.length > 3 && (
            <button onClick={() => setShowAll(s => !s)} className="text-xs text-stone-600 hover:underline">
              {showAll ? "Ver menos" : `Ver más (${ordered.length - 3} más)`}
            </button>
          )}
        </div>
        <ul className="space-y-2">
          {visibleItems.map(it => (
            <li key={it.key} className={`rounded-lg p-3 shadow-sm ${it.important ? "bg-[#f5ece6]" : "bg-[#faf7f0]"}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm text-stone-800">
                  {it.count && it.count > 1 ? (
                    <>
                      <span className="mr-1">💧</span>
                      <strong>Riego</strong>
                      <span className="ml-2 rounded-full bg-[#dfe9e4] px-2 py-0.5 text-[11px] text-stone-700">
                        ronda de {it.count}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="mr-1">{EVENT_ICONS[it.ev.type] ?? "•"}</span>
                      <strong>{EVENT_LABELS[it.ev.type] ?? it.ev.type}</strong>
                      {it.ev.detail && <span className="text-stone-600"> · {it.ev.detail}</span>}
                      {it.ev.health && <span className="ml-1">{HEALTH_ICON[it.ev.health] ?? ""}</span>}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {it.ev.batch_id && (
                    <button onClick={() => undoBatch(it.ev.batch_id!)} className="text-xs text-[#8a3a1a] hover:underline">
                      ↩ deshacer
                    </button>
                  )}
                  <button onClick={() => deleteEvent(it.ev)} title="Eliminar evento"
                    className="text-xs text-stone-500 hover:underline">🗑</button>
                </div>
              </div>
              <p className="text-xs text-stone-600">
                {fmt(it.at)} · {names[it.ev.user_id] ?? "alguien"}
              </p>
              {it.ev.notes && <p className="mt-1 text-sm text-stone-700">{it.ev.notes}</p>}
            </li>
          ))}
          {ordered.length === 0 && <p className="text-sm text-stone-600">Sin eventos todavía.</p>}
        </ul>
      </section>
      {showEdit && (
        <PlantForm householdId={plant.household_id} plant={plant} onClose={() => setShowEdit(false)} onSaved={reload} />
      )}
      {showEvent && (
        <EventForm plant={plant} userId={userId ?? ""} onClose={() => setShowEvent(false)} onSaved={reload} />
      )}
      {showShare && (
        <ShareCard
          plant={plant}
          speciesCard={speciesCard}
          photoUrl={mainPhoto?.fullUrl}
          onClose={() => setShowShare(false)}
        />
      )}

      {showBury && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xs rounded-xl bg-[#faf7f0] p-5 shadow-xl dark:bg-stone-800">
            <h2 className="mb-3 text-lg font-semibold text-stone-800 dark:text-stone-100">
              🪦 Enterrar a {plant?.name}
            </h2>
            <label className="mb-2 block text-sm text-stone-700 dark:text-stone-200">
              Causa de la muerte
              <select value={buryCause} onChange={e => setBuryCause(e.target.value)}
                className="mt-1 w-full rounded border border-stone-300 px-3 py-2 dark:border-stone-600 dark:bg-stone-700">
                {Object.entries(DEATH_CAUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label className="mb-3 block text-sm text-stone-700 dark:text-stone-200">
              Epitafio o nota (opcional)
              <textarea value={buryNote} onChange={e => setBuryNote(e.target.value)} rows={2}
                placeholder="Vivió rápido, murió feliz…"
                className="mt-1 w-full rounded border border-stone-300 px-3 py-2 dark:border-stone-600 dark:bg-stone-700" />
            </label>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowBury(false)}
                className="rounded px-3 py-2 text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-700">
                Cancelar
              </button>
              <button onClick={confirmBury}
                className="rounded bg-[#8a3a1a] px-4 py-2 text-white hover:bg-[#6f2e14]">
                Enterrar
              </button>
            </div>
          </div>
        </div>
      )}

      {showCrop && (() => {
        const main = photos.find(ph => ph.storage_path === plant.main_photo_path)
        if (!main) return null
        return (
          <CropModal
            plant={plant}
            photoUrl={main.fullUrl}
            onClose={() => setShowCrop(false)}
            onSaved={() => { setShowCrop(false); reload() }}
          />
        )
      })()}
    </main>
  )
}