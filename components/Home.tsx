"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { EVENT_LABELS, daysSince, daysUntilDue, effectiveFreq, isDue, type Plant } from "@/lib/plants"
import { findSpecies } from "@/lib/species"
import { plantType, severityFor, rehydrateTip, startRecovery } from "@/lib/recovery"
import PlantCard from "./PlantCard"
import PlantForm from "./PlantForm"
import AppMenu from "./AppMenu"
import SettingsModal from "./SettingsModal"
import SyncModal from "./SyncModal"
import TasksSection from "./TasksSection"
import AchievementsModal from "./AchievementsModal"
import RecoverySection from "./RecoverySection"
import HouseholdModal from "./HouseholdModal"

type Toast = { message: string; batch: string; plantIds: string[] }
type Size = "grande" | "medio" | "pequeno"

const GRID: Record<Size, string> = {
  grande: "grid-cols-1 md:grid-cols-2",
  medio: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  pequeno: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
}

function lsGet(key: string, def: string): string {
  if (typeof window === "undefined") return def
  return window.localStorage.getItem(key) ?? def
}

export default function Home({ session }: { session: Session }) {
  const userId = session.user.id
  const [householdId, setHouseholdId] = useState<string | null>(null)
  const [plants, setPlants] = useState<Plant[]>([])
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<Toast | null>(null)
  const [showPlantForm, setShowPlantForm] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showSync, setShowSync] = useState(false)
  const [summerStart, setSummerStart] = useState(5)
  const [summerEnd, setSummerEnd] = useState(9)
  const [query, setQuery] = useState("")
  const [sortBy, setSortByState] = useState<"due" | "name" | "location">(
    () => lsGet("tl_sort", "due") as "due" | "name" | "location"
  )
  const [showPhotos, setShowPhotosState] = useState<boolean>(() => lsGet("tl_photos", "1") !== "0")
  const [size, setSizeState] = useState<Size>(() => lsGet("tl_size", "medio") as Size)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showAchievements, setShowAchievements] = useState(false)
  const [showHousehold, setShowHousehold] = useState(false)
  const [recoverySchedule, setRecoverySchedule] = useState<"A" | "B">("B")
  const [reminderTime, setReminderTime] = useState("08:00")

  function setSortBy(v: "due" | "name" | "location") {
    setSortByState(v)
    if (typeof window !== "undefined") window.localStorage.setItem("tl_sort", v)
  }
  function setShowPhotos(v: boolean) {
    setShowPhotosState(v)
    if (typeof window !== "undefined") window.localStorage.setItem("tl_photos", v ? "1" : "0")
  }
  function setSize(v: Size) {
    setSizeState(v)
    if (typeof window !== "undefined") window.localStorage.setItem("tl_size", v)
  }

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
      .select("summer_start_month, summer_end_month, recovery_schedule, reminder_time")
      .eq("id", mem.household_id)
      .single()
    if (hh) {
      setSummerStart(hh.summer_start_month)
      setSummerEnd(hh.summer_end_month)
      setRecoverySchedule((hh.recovery_schedule as "A" | "B") ?? "B")
      setReminderTime(hh.reminder_time ?? "08:00")
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
  const dead = plants.filter(p => p.status === "dead")
  const due = active.filter(p => isDue(p, summerStart, summerEnd))
  const q = query.trim().toLowerCase()
  const visible = active
    .filter(p =>
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.species ?? "").toLowerCase().includes(q) ||
      (p.location ?? "").toLowerCase().includes(q)
    )
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
    const late = list
      .map(p => ({ p, d: daysSince(p.last_watered_at), f: effectiveFreq(p, summerStart, summerEnd) }))
      .filter(x => x.f != null && x.d != null && x.d >= x.f + 3)
    if (late.length > 0) {
      const first = late[0]
      const t = plantType(findSpecies(first.p.species ?? ""), first.p.plant_type)
      const names = late.map(x => `${x.p.name} (${(x.d ?? 0) - (x.f ?? 0)} días de retraso)`).join(", ")
      if (!confirm(
        `Con retraso: ${names}.\n\n${rehydrateTip(t)}\n\n¿Registrar el riego e iniciar la recuperación?`
      )) return
    }
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
    for (const x of late) {
      const t = plantType(findSpecies(x.p.species ?? ""), x.p.plant_type)
      const sev = severityFor(x.d ?? 0, x.f ?? 7, t)
      await startRecovery(x.p, sev, t)
    }
    await reload()
    showToast(`Riego registrado (${list.length})`, batch, list.map(p => p.id))
  }  async function quickEvent(p: Plant, type: string) {
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

  async function changePassword() {
    const current = window.prompt("Contraseña actual:")
    if (!current) return
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: session.user.email!,
      password: current,
    })
    if (authError) return alert("Contraseña actual incorrecta: " + authError.message)
    
    const newPw = window.prompt("Nueva contraseña (mínimo 6 caracteres):")
    if (!newPw) return
    if (newPw.length < 6) return alert("La contraseña debe tener al menos 6 caracteres")
    
    const { error } = await supabase.auth.updateUser({ password: newPw })
    alert(error ? "Error: " + error.message : "Contraseña cambiada ✅")
  }

  return (
    <main className="min-h-screen bg-emerald-50 p-4 md:p-8">
      <header className="mb-6 flex items-center gap-2">
        <AppMenu
          email={session.user.email ?? ""}
          cemeteryCount={dead.length}
          onOpenSettings={() => setShowSettings(true)}
          onOpenSync={() => setShowSync(true)}
                         onOpenAchievements={() => setShowAchievements(true)}
                         onOpenHousehold={() => setShowHousehold(true)}
                         onChangePassword={changePassword}
          onLogout={() => supabase.auth.signOut()}
        />
        <h1 className="text-2xl font-bold text-emerald-900">🌿 Totoland</h1>
      </header>

      <RecoverySection plants={plants} userId={userId} onChanged={reload} />
      {householdId && (
        <TasksSection householdId={householdId} plants={plants} onChanged={reload} />
      )}

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
          <label className="flex items-center gap-1">
            <span aria-hidden>🔍</span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar planta…"
              className="rounded border border-emerald-300 px-2 py-1"
            />
          </label>
          <label>
            Ordenar:{" "}
            <select value={sortBy} onChange={e => setSortBy(e.target.value as "due" | "name" | "location")}
              className="rounded border border-emerald-300 px-2 py-1">
              <option value="due">próximo riego</option>
              <option value="name">nombre</option>
              <option value="location">ubicación</option>
            </select>
          </label>
          <button onClick={() => setShowPlantForm(true)}
            className="rounded bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700">
            + Añadir planta
          </button>
        </div>
      </section>

      {loading ? (
        <p className="text-emerald-800">Cargando…</p>
      ) : (
        <section className={`grid gap-3 ${GRID[size]}`}>
          {visible.map(p => (
            <PlantCard
              key={p.id}
              plant={p}
              photoUrl={showPhotos ? photoUrls[p.id] : undefined}
              summerStart={summerStart}
              summerEnd={summerEnd}
              onWater={() => quickEvent(p, "watering")}
              onWaterMist={() => water([p], true)}
            />
          ))}
          {visible.length === 0 && (
            <p className="text-emerald-800">
              {q ? `Nada coincide con “${query}”.` : "Aún no hay plantas. Añade la primera 🌱"}
            </p>
          )}
        </section>
      )}

      {showPlantForm && householdId && (
        <PlantForm householdId={householdId} onClose={() => setShowPlantForm(false)} onSaved={reload} />
      )}
      {showSettings && householdId && (
        <SettingsModal
          householdId={householdId}
          summerStart={summerStart}
          summerEnd={summerEnd}
          onSeasonSaved={(s, e) => { setSummerStart(s); setSummerEnd(e); reload() }}
          sortBy={sortBy}
          onSortBy={setSortBy}
          showPhotos={showPhotos}
          onShowPhotos={setShowPhotos}
          size={size}
          onSize={setSize}
          recoverySchedule={recoverySchedule}
          onRecoverySchedule={setRecoverySchedule}
          reminderTime={reminderTime}
          onReminderTime={setReminderTime}
          onClose={() => setShowSettings(false)}
        />
      )}
      {showAchievements && householdId && (
        <AchievementsModal
          householdId={householdId}
          plants={plants}
          onClose={() => setShowAchievements(false)}
        />
      )}
      {showHousehold && (
        <HouseholdModal
          userId={userId}
          onClose={() => setShowHousehold(false)}
          onJoined={reload}
        />
      )}
      {showSync && (
        <SyncModal
          plants={active}
          onClose={() => setShowSync(false)}
          onSaved={reload}
          onWaterTogether={list => water(list, false)}
        />
      )}

      {toast && (
        <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-full bg-emerald-900 px-5 py-3 text-white shadow-lg">
          <span>{toast.message}</span>
          <button onClick={undo} className="font-semibold underline">Deshacer</button>
        </div>
      )}
    </main>
  )
}