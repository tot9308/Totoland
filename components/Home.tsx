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
import HouseholdModal from "./HouseholdModal"
import Logo from "./Logo"
import { applyDrift } from "@/lib/drift"
import { getActiveHouseholdId } from "@/lib/household"
import { useRouter } from "next/navigation"
import { useConfirm } from "@/components/UiProvider"
import { currentRecoveryStep, CULPRIT_LABEL } from "@/lib/protocols"

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
  const router = useRouter()
  const { confirm: confirmAsync } = useConfirm()
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
  const [driftDays, setDriftDays] = useState(0)
  const [showPw, setShowPw] = useState(false)
  const [pwCurrent, setPwCurrent] = useState("")
  const [pwNew, setPwNew] = useState("")
  const [healthByPlant, setHealthByPlant] = useState<Record<string, { health: string; occurred_at: string }>>({})

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
    const household_id = await getActiveHouseholdId(userId)
    if (!household_id) { router.replace("/"); return }
    const mem = { household_id }
    setHouseholdId(mem.household_id)

    const { data: hh } = await supabase
      .from("households")
      .select("summer_start_month, summer_end_month, reminder_time, drift_days")
      .eq("id", mem.household_id)
      .single()
    if (hh) {
      setSummerStart(hh.summer_start_month)
      setSummerEnd(hh.summer_end_month)
      setDriftDays(hh.drift_days ?? 0)
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
    const ids = list.map(p => p.id)
    const healthMap: Record<string, { health: string; occurred_at: string }> = {}
    if (ids.length) {
      const { data: hs } = await supabase.from("care_events")
        .select("plant_id, health, occurred_at").in("plant_id", ids)
        .not("health", "is", null).order("occurred_at", { ascending: false })
      for (const h of hs ?? [])
        if (!healthMap[h.plant_id]) healthMap[h.plant_id] = { health: h.health!, occurred_at: h.occurred_at }
    }
    setHealthByPlant(healthMap)
    setLoading(false)
  }, [userId, router])

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
      if (sortBy === "location") return (a.location ?? "").localeCompare(b.location ?? "")
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
      if (!await confirmAsync(
        `Con retraso: ${names}. ${rehydrateTip(t)} ¿Registrar el riego e iniciar la recuperación?`
      )) return
    }
    const batch = crypto.randomUUID()
    const events = list.flatMap(p => {
      const e: object[] = [{ plant_id: p.id, user_id: userId, type: "watering", batch_id: batch }]
      if (withMisting && p.misting_enabled)
        e.push({ plant_id: p.id, user_id: userId, type: "misting", batch_id: batch })
      return e
    })
    for (const p of list) await applyDrift(p, driftDays, summerStart, summerEnd)
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
  async function confirmHealth(p: Plant, same: boolean) {
    const cur = healthByPlant[p.id]
    const level = same ? (cur?.health ?? "yellow") : "green"
    const { error } = await supabase.from("care_events").insert({
      plant_id: p.id, user_id: userId, type: "observation", health: level,
    })
    if (error) return alert(error.message)
    await reload()
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

  function changePassword() { setShowPw(true) }

  async function submitPw() {
    if (!pwCurrent) return alert("Introduce la contraseña actual")
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: session.user.email!, password: pwCurrent,
    })
    if (authError) return alert("Contraseña actual incorrecta")
    if (pwNew.length < 6) return alert("La contraseña debe tener al menos 6 caracteres")
    const { error } = await supabase.auth.updateUser({ password: pwNew })
    if (error) return alert("Error: " + error.message)
    setShowPw(false); setPwCurrent(""); setPwNew("")
    alert("Contraseña cambiada ✅")
  }

  return (
    <main className="min-h-screen bg-stone-50 p-4 md:p-8">
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
        <Logo size={36} />
      </header>

      {householdId && (
        <TasksSection householdId={householdId} plants={plants} onChanged={reload} />
      )}

      <section className="mb-6 grid gap-3 md:grid-cols-2">
        <button
          onClick={() => water(due, false)}
          disabled={due.length === 0}
          className="rounded-xl bg-[#5a7d4a] p-5 text-left text-white shadow hover:bg-[#4a6a3a] disabled:opacity-40"
        >
          <div className="text-lg font-semibold">💧 Regar pendientes ({due.length})</div>
          <div className="text-sm text-emerald-100">
            {due.length > 0 ? due.map(p => p.name).join(" · ") : "Nada pendiente hoy 🎉"}
          </div>
        </button>
        <button
          onClick={() => water(active, false)}
          className="rounded-xl bg-[#faf7f0] p-5 text-left text-stone-800 shadow hover:bg-stone-200"
        >
          <div className="text-lg font-semibold">💧💧 He regado todas ({active.length})</div>
          <div className="text-sm text-stone-600">Ronda completa</div>
        </button>
      </section>

      <section className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-stone-800">Mis plantas</h2>
        <div className="flex flex-wrap items-center gap-2 text-sm text-stone-700">
          <label className="flex items-center gap-1">
            <span aria-hidden>🔍</span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar planta…"
              className="rounded border border-stone-300 px-2 py-1"
            />
          </label>
          <label>
            Ordenar:{" "}
            <select value={sortBy} onChange={e => setSortBy(e.target.value as "due" | "name" | "location")}
              className="rounded border border-stone-300 px-2 py-1">
              <option value="due">próximo riego</option>
              <option value="name">nombre</option>
              <option value="location">ubicación</option>
            </select>
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={showPhotos} onChange={e => setShowPhotos(e.target.checked)} />
            fotos
          </label>
          <select value={size} onChange={e => setSize(e.target.value as Size)}
            className="rounded border border-stone-300 px-2 py-1">
            <option value="grande">cuadrícula grande</option>
            <option value="medio">cuadrícula media</option>
            <option value="pequeno">cuadrícula pequeña</option>
          </select>
          <button onClick={() => setShowPlantForm(true)}
            className="rounded bg-[#5a7d4a] px-3 py-1.5 text-white hover:bg-[#4a6a3a]">
            + Añadir planta
          </button>
        </div>
      </section>

      {loading ? (
        <p className="text-stone-700">Cargando…</p>
      ) : (
        <section className={`grid gap-3 ${GRID[size]}`}>
          {visible.map(p => {
            const hh = healthByPlant[p.id]
            const days = hh ? Math.floor((Date.now() - new Date(hh.occurred_at).getTime()) / 86400000) : 0
            const nudge = hh && hh.health !== "green" && days >= 4
            return (
              <div key={p.id}>
                <PlantCard
                  plant={p}
                  photoUrl={showPhotos ? photoUrls[p.id] : undefined}
                  summerStart={summerStart}
                  summerEnd={summerEnd}
                  health={hh?.health}
                  onWater={() => quickEvent(p, "watering")}
                  onWaterMist={() => water([p], true)}
                />
                                {(() => {
                  const rec = currentRecoveryStep(p)
                  if (!rec || !rec.isDueToday) return null
                  return (
                    <div className="mt-1 rounded-lg bg-[#f5ece6] p-2 text-xs text-stone-700">
                      🩺 <b>Chequeo de recuperación</b> · {rec.plan.title}
                      {p.recovery_culprit && " (" + CULPRIT_LABEL[p.recovery_culprit] + ")"}
                      <span className="ml-1 text-stone-500">(día {rec.step.day})</span>
                    </div>
                  )
                })()}
{nudge && (
                  <div className="mt-1 rounded-lg bg-[#f5ece6] p-2 text-xs text-stone-700">
                    {hh!.health === "red" ? "🔴" : "🟡"} Lleva {days} días así. ¿Sigue igual?
                    <div className="mt-1 flex gap-2">
                      <button onClick={() => confirmHealth(p, true)}
                        className="rounded bg-stone-200 px-2 py-1 hover:bg-stone-300">Sigue igual</button>
                      <button onClick={() => confirmHealth(p, false)}
                        className="rounded bg-[#dfe9e4] px-2 py-1 hover:bg-[#c9dccf]">Ya está 🟢</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          {visible.length === 0 && (
            <p className="text-stone-700">
              {q ? `Nada coincide con "${query}".` : "Aún no hay plantas. Añade la primera 🌱"}
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
          userId={userId}
          driftDays={driftDays}
          onDriftDays={setDriftDays}
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

      {showPw && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xs rounded-xl bg-[#faf7f0] p-5 shadow-xl dark:bg-stone-800">
            <h2 className="mb-3 text-lg font-semibold text-stone-800 dark:text-stone-100">🔑 Cambiar contraseña</h2>
            <input type="password" value={pwCurrent} onChange={e => setPwCurrent(e.target.value)} placeholder="Contraseña actual"
              className="mb-2 w-full rounded border border-stone-300 px-3 py-2 dark:border-stone-600 dark:bg-stone-700" />
            <input type="password" value={pwNew} onChange={e => setPwNew(e.target.value)} placeholder="Nueva contraseña (mín. 6)"
              className="mb-3 w-full rounded border border-stone-300 px-3 py-2 dark:border-stone-600 dark:bg-stone-700" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowPw(false)} className="rounded px-3 py-2 text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-700">Cancelar</button>
              <button onClick={submitPw} className="rounded bg-[#5a7d4a] px-4 py-2 text-white hover:bg-[#4a6a3a]">Guardar</button>
            </div>
          </div>
        </div>
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