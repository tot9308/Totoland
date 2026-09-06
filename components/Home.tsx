"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { EVENT_LABELS, TAG_OPTIONS, daysUntilDue, isDue, type Plant } from "@/lib/plants"
import PlantCard from "./PlantCard"
import PlantForm from "./PlantForm"
import EventForm from "./EventForm"
import SeasonModal from "./SeasonModal"

type Toast = { message: string; batch: string; plantIds: string[] }

export default function Home({ session }: { session: Session }) {
  const userId = session.user.id
  const [householdId, setHouseholdId] = useState<string | null>(null)
  const [plants, setPlants] = useState<Plant[]>([])
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})
  const [sortBy, setSortBy] = useState<"due" | "name" | "location">("due")
  const [summerStart, setSummerStart] = useState<number>(5)
  const [summerEnd, setSummerEnd] = useState<number>(9)
  const [showSeason, setShowSeason] = useState(false)
  const [tagFilter, setTagFilter] = useState("")
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<Toast | null>(null)
  const [showPlantForm, setShowPlantForm] = useState(false)
  const [eventPlant, setEventPlant] = useState<Plant | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const reload = useCallback(async () => {
    const { data: mem } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", userId)
      .limit(1)
      .single()
    if (!mem) return
    setHouseholdId(mem.household_id)
    const { data: hh } = await supabase
      .from("households")
      .select("summer_start_month, summer_end_month")
      .eq("id", mem.household_id)
      .single()
    if (hh) {
      setSummerStart(hh.summer_start_month)
      setSummerEnd(hh.summer_end_month)
    }
    const { data } = await supabase
      .from("plants")
      .select("*")
      .eq("household_id", mem.household_id)
      .order("name")
    const list = (data as Plant[]) ?? []
    const urls: Record<string, string> = {}
    await Promise.all(
      list.filter(p => p.main_photo_path).map(async p => {
        const thumb = p.main_photo_path!.replace(/\.jpg$/, "_thumb.jpg")
        const { data: s } = await supabase.storage.from("plant-photos").createSignedUrl(thumb, 3600)
        if (s) urls[p.id] = s.signedUrl
      })
    )
    setPhotoUrls(urls)
    setPlants(list)
    setLoading(false)
  }, [userId])

  useEffect(() => { reload() }, [reload])

  const active = plants.filter(p => p.status !== "dead")
  const due = active.filter(p => isDue(p, summerStart, summerEnd))
  const visible = active
    .filter(p => !tagFilter || p.tags.includes(tagFilter))
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name)
      if (sortBy === "location") return (a.location ?? "∅").localeCompare(b.location ?? "∅")
      const da = daysUntilDue(a, summerStart, summerEnd)
      const db = daysUntilDue(b, summerStart, summerEnd)
      if (da === null && db === null) return a.name.localeCompare(b.name)
      if (da === null) return 1
      if (db === null) return -1
      return da - db
    })

  function showToast(message: string, batch: string, plantIds: string[]) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ message, batch, plantIds })
    toastTimer.current = setTimeout(() => setToast(null), 10000)
  }

  async function water(list: Plant[], withMisting: boolean) {
    if (list.length === 0) return
    const batch = crypto.randomUUID()
    const events = list.flatMap(p => {
      const e: object[] = [{ plant_id: p.id, user_id: userId, type: "watering", batch_id: batch }]
      if (withMisting && p.misting_enabled)
        e.push({ plant_id: p.id, user_id: userId, type: "misting", batch_id: batch })
      return e
    })
    const { error } = await supabase.from("care_events").insert(events)
    if (error) return alert("Error al registrar: " + error.message)
    const now = new Date().toISOString()
    for (const p of list)
      await supabase.from("plants").update({ last_watered_at: now }).eq("id", p.id)
    await reload()
    showToast(`Riego registrado (${list.length})`, batch, list.map(p => p.id))
  }

  async function quickEvent(p: Plant, type: string) {
    const batch = crypto.randomUUID()
    const { error } = await supabase.from("care_events").insert({
      plant_id: p.id, user_id: userId, type, batch_id: batch,
    })
    if (error) return alert("Error: " + error.message)
    if (type === "watering")
      await supabase.from("plants").update({ last_watered_at: new Date().toISOString() }).eq("id", p.id)
    await reload()
    showToast(`${EVENT_LABELS[type]} · ${p.name}`, batch, [p.id])
  }

  async function refreshLastWatered(plantIds: string[]) {
    const { data } = await supabase
      .from("care_events")
      .select("plant_id, occurred_at")
      .eq("type", "watering")
      .in("plant_id", plantIds)
      .order("occurred_at", { ascending: false })
    const latest: Record<string, string> = {}
    for (const ev of data ?? []) if (!latest[ev.plant_id]) latest[ev.plant_id] = ev.occurred_at
    for (const pid of plantIds)
      await supabase.from("plants").update({ last_watered_at: latest[pid] ?? null }).eq("id", pid)
  }

  async function undo() {
    if (!toast) return
    const { error } = await supabase.from("care_events").delete().eq("batch_id", toast.batch)
    if (error) return alert("Error al deshacer: " + error.message)
    await refreshLastWatered(toast.plantIds)
    setToast(null)
    await reload()
  }
  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
    return outputArray
  }

  async function enablePush() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window))
      return alert("Este navegador no soporta avisos")
    const perm = await Notification.requestPermission()
    if (perm !== "granted") return alert("Permiso de avisos denegado")
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
    })
    await supabase.from("push_subscriptions").delete().eq("user_id", userId)
    const { error } = await supabase.from("push_subscriptions").insert({
      user_id: userId,
      endpoint: sub.endpoint,
      subscription: sub.toJSON(),
    })
    if (error) return alert("Error al guardar el aviso: " + error.message)
    alert("Avisos activados ✅")
  }

  return (
    <main className="min-h-screen bg-emerald-50 p-4 md:p-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-emerald-900">🌿 Totoland</h1>
        <div className="flex gap-2">
          <button
            onClick={enablePush}
            className="rounded border border-emerald-300 px-2 py-1 text-sm text-emerald-800"
          >
            🔔 Avisos
          </button>
          <button
            onClick={() => supabase.auth.signOut()}
            className="rounded border border-emerald-300 px-2 py-1 text-sm text-emerald-800"
          >
            Salir
          </button>
        </div>
      </header>

      <section className="mb-6 grid gap-3 md:grid-cols-2">
        <button
          onClick={() => water(due, false)}
          disabled={due.length === 0}
          className="rounded-xl bg-emerald-600 p-5 text-left text-white shadow hover:bg-emerald-700 disabled:opacity-40"
        >
          <div className="text-lg font-semibold">💧 Regar pendientes ({due.length})</div>
          <div className="text-sm text-emerald-100">
            {due.length > 0 ? due.map(p => p.name).join(" · ") : "Nada pendiente hoy 🎉"}
          </div>
        </button>
        <button
          onClick={() => water(active, false)}
          className="rounded-xl bg-white p-5 text-left text-emerald-900 shadow hover:bg-emerald-100"
        >
          <div className="text-lg font-semibold">💧💧 He regado todas ({active.length})</div>
          <div className="text-sm text-emerald-700">Ronda completa</div>
        </button>
      </section>

      <section className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-emerald-900">Mis plantas</h2>
        <div className="flex flex-wrap items-center gap-2 text-sm text-emerald-800">
          <label>
            Ordenar:{" "}
            <select value={sortBy} onChange={e => setSortBy(e.target.value as "due" | "name" | "location")}
              className="rounded border border-emerald-300 px-2 py-1">
              <option value="due">próximo riego</option>
              <option value="name">nombre</option>
              <option value="location">ubicación</option>
            </select>
          </label>
          <label>
            Filtrar:{" "}
            <select value={tagFilter} onChange={e => setTagFilter(e.target.value)}
              className="rounded border border-emerald-300 px-2 py-1">
              <option value="">todas</option>
              {TAG_OPTIONS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <button onClick={() => setShowPlantForm(true)}
            className="rounded bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700">
            + Añadir planta
          </button>
          <button onClick={() => setShowSeason(true)}
            className="rounded border border-emerald-300 px-2 py-1 text-emerald-800">
            ⚙️ Estación
          </button>
        </div>
      </section>

      {loading ? (
        <p className="text-emerald-800">Cargando…</p>
      ) : (
        <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {visible.map(p => (
            <PlantCard
              key={p.id}
              plant={p}
              photoUrl={photoUrls[p.id]}
              summerStart={summerStart}
              summerEnd={summerEnd}
              onWater={() => quickEvent(p, "watering")}
              onWaterMist={() => water([p], true)}
              onMore={() => setEventPlant(p)}
            />
          ))}
          {active.length === 0 && (
            <p className="text-emerald-800">Aún no hay plantas. Añade la primera 🌱</p>
          )}
        </section>
      )}

      {showPlantForm && householdId && (
        <PlantForm householdId={householdId} onClose={() => setShowPlantForm(false)} onSaved={reload} />
      )}
      {eventPlant && (
        <EventForm plant={eventPlant} userId={userId} onClose={() => setEventPlant(null)} onSaved={reload} />
      )}

      {toast && (
        <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-full bg-emerald-900 px-5 py-3 text-white shadow-lg">
          <span>{toast.message}</span>
          <button onClick={undo} className="font-semibold underline">Deshacer</button>
        </div>
      )}
      {showSeason && householdId && (
        <SeasonModal
          householdId={householdId}
          summerStart={summerStart}
          summerEnd={summerEnd}
          onClose={() => setShowSeason(false)}
          onSaved={(s, e) => { setSummerStart(s); setSummerEnd(e); reload() }}
        />
      )}
    </main>
  )
}