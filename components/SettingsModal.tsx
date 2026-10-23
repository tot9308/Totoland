"use client"

import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import ThemeToggle from "./ThemeToggle"
import { dueDatesInRange, type Plant } from "@/lib/plants"

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

export default function SettingsModal({ householdId, userId, summerStart, summerEnd, onSeasonSaved, onClose }: {
  householdId: string
  userId: string
  summerStart: number
  summerEnd: number
  onSeasonSaved: (s: number, e: number) => void
  onClose: () => void
}) {
  const [s, setS] = useState(summerStart)
  const [e, setE] = useState(summerEnd)
  const [busy, setBusy] = useState(false)
  const [muteUntil, setMuteUntil] = useState<string | null>(null)
  const [muteSel, setMuteSel] = useState("")
  const [myTime, setMyTime] = useState("08:00")
  const [vacStart, setVacStart] = useState("")
  const [vacEnd, setVacEnd] = useState("")
  const [subsCount, setSubsCount] = useState(0)
  const [vacConfirm, setVacConfirm] = useState(false)
  const [vacAffected, setVacAffected] = useState<Plant[]>([])
  const [vacPending, setVacPending] = useState<{ start: string; end: string } | null>(null)

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("profiles").select("reminder_time").eq("id", userId).single()
      setMyTime(data?.reminder_time ?? "08:00")
      // Cargar número de suscripciones push activas
      const { data: subs } = await supabase
        .from("push_subscriptions")
        .select("id")
        .eq("user_id", userId)
      setSubsCount(subs?.length ?? 0)
    })()
  }, [userId])

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("households")
        .select("vacation_start, vacation_end").eq("id", householdId).single()
      if (data) { setVacStart(data.vacation_start ?? ""); setVacEnd(data.vacation_end ?? "") }
    })()
  }, [householdId])

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("profiles").select("mute_until").eq("id", userId).single()
      setMuteUntil(data?.mute_until ?? null)
    })()
  }, [userId])

  async function saveVac() {
    if (!vacStart || !vacEnd) return alert("Selecciona fechas de inicio y fin.")
    const start = new Date(vacStart)
    const end = new Date(vacEnd)
    if (end < start) return alert("La fecha de fin debe ser posterior a la de inicio.")

    // Cargar plantas activas de la casa para calcular riegos pendientes durante vacaciones
    const { data: pl } = await supabase
      .from("plants")
      .select("*")
      .eq("household_id", householdId)
      .neq("status", "dead")
    const plants = (pl as Plant[]) ?? []

    // Cargar meses verano/invierno de la casa
    const { data: hh } = await supabase
      .from("households")
      .select("summer_start_month, summer_end_month")
      .eq("id", householdId)
      .single()
    const ss = hh?.summer_start_month ?? 5
    const se = hh?.summer_end_month ?? 9

    // Qué plantas están "due" en algún día del rango vacacional
    const affected: Plant[] = []
    for (const p of plants) {
      const dueDates = dueDatesInRange(p, start, end, ss, se)
      if (dueDates.length > 0) affected.push(p)
    }

    if (affected.length === 0) {
      // No hay riegos pendientes durante vacaciones: guardar directamente
      await doSaveVac(vacStart, vacEnd)
      return
    }

    // Hay plantas afectadas: guardar pending y mostrar confirmación
    setVacPending({ start: vacStart, end: vacEnd })
    setVacAffected(affected)
    setVacConfirm(true)
  }

  async function doSaveVac(start: string, end: string) {
    const { error } = await supabase.from("households")
      .update({ vacation_start: start || null, vacation_end: end || null })
      .eq("id", householdId)
    if (error) return alert("Error: " + error.message)
    setVacStart(start)
    setVacEnd(end)
    alert("Vacaciones guardadas ✅")
  }

  async function vacAdvanceWatering() {
    if (!vacPending) return
    const start = new Date(vacPending.start)
    const dayBefore = new Date(start)
    dayBefore.setDate(dayBefore.getDate() - 1)
    const iso = dayBefore.toISOString().slice(0, 10)

    const { error } = await supabase.from("plants")
      .update({ last_watered_at: iso })
      .in("id", vacAffected.map(p => p.id))
    if (error) return alert("Error: " + error.message)

    await doSaveVac(vacPending.start, vacPending.end)
    setVacConfirm(false)
    setVacAffected([])
    setVacPending(null)
    alert(`Riegos adelantados al ${dayBefore.toLocaleDateString("es-ES")} para ${vacAffected.length} planta(s). ✅`)
  }

  async function vacJustHide() {
    if (!vacPending) return
    await doSaveVac(vacPending.start, vacPending.end)
    setVacConfirm(false)
    setVacAffected([])
    setVacPending(null)
    alert("Vacaciones guardadas. Los avisos de riego estarán ocultos durante esas fechas. ✅")
  }

  async function clearVacations() {
    const { error } = await supabase.from("households")
      .update({ vacation_start: null, vacation_end: null })
      .eq("id", householdId)
    if (error) return alert("Error: " + error.message)
    setVacStart("")
    setVacEnd("")
    alert("Vacaciones borradas ✅")
  }

  async function saveSeason() {
    setBusy(true)
    const { error } = await supabase.from("households")
      .update({ summer_start_month: s, summer_end_month: e }).eq("id", householdId)
    setBusy(false)
    if (error) return alert("Error: " + error.message)
    onSeasonSaved(s, e)
  }

  async function saveReminderTime(v: string) {
    const { error } = await supabase.from("profiles").update({ reminder_time: v }).eq("id", userId)
    if (error) return alert("Error: " + error.message)
    setMyTime(v)
    await supabase.from("scheduled_notifications")
      .delete().eq("user_id", userId).eq("status", "pending")
    try {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready
        const shown = await reg.getNotifications()
        for (const n of shown) {
          const t = n.tag || ""
          if (t.startsWith("daily-") || t.startsWith("sched-")) n.close()
        }
      }
    } catch {}
  }

  async function setMute(v: string) {
    setMuteSel(v)
    if (v === "") {
      await supabase.from("profiles").update({ mute_until: null }).eq("id", userId)
      setMuteUntil(null)
    } else {
      const until = new Date(Date.now() + Number(v) * 86400000).toISOString()
      await supabase.from("profiles").update({ mute_until: until }).eq("id", userId)
      setMuteUntil(until)
    }
  }

  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
    const rawData = window.atob(base64)
    const out = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) out[i] = rawData.charCodeAt(i)
    return out
  }

  async function enablePush() {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window))
        return alert("Este navegador no soporta avisos")
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!key) return alert("Falta NEXT_PUBLIC_VAPID_PUBLIC_KEY en Vercel. Añádela y rehaz el deploy.")
      const perm = await Notification.requestPermission()
      if (perm !== "granted") return alert("Permiso de avisos denegado: " + perm)
      if (!navigator.serviceWorker.controller) {
        await navigator.serviceWorker.register("/sw.js")
      }
      const reg = await navigator.serviceWorker.ready

      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key),
        })
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return alert("No hay sesión iniciada.")

      await supabase.from("push_subscriptions").delete().eq("user_id", user.id)

      const { error } = await supabase.from("push_subscriptions").insert({
        user_id: user.id, endpoint: sub.endpoint, subscription: sub.toJSON(),
      })
      if (error) return alert("Error al guardar el aviso: " + error.message)
      alert("Avisos activados en este dispositivo ✅")
      
      // Recargar el contador de suscripciones
      const { data: subs } = await supabase
        .from("push_subscriptions")
        .select("id")
        .eq("user_id", userId)
      setSubsCount(subs?.length ?? 0)
    } catch (e) {
      alert("No se pudo activar: " + e)
    }
  }
  
  async function testPush() {
    if (!("serviceWorker" in navigator)) return alert("Este navegador no soporta service workers.")
    if (!("PushManager" in window)) return alert("Este navegador no soporta push.")
    const perm = Notification.permission
    if (perm !== "granted") {
      if (perm === "default") return alert("Concédelo en: Configuración del navegador → Permisos → Notificaciones")
      if (perm === "denied") return alert("Permiso denegado. Ve a Configuración del navegador → Notificaciones y activa el permiso.")
      return alert("Permiso no reconocido: " + perm + ". ¿Olvidaste concederlo?")
    }
    const reg = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<ServiceWorkerRegistration | null>(res => setTimeout(() => res(null), 3000)),
    ])
    if (!reg) return alert("No hay service worker activo. Recarga la página (o reinstala la app) y vuelve a probar.")
    const { data: { user } } = await supabase.auth.getUser()
    let subInfo = "SIN suscripción push guardada"
    if (user) {
      const { data } = await supabase.from("push_subscriptions").select("id").eq("user_id", user.id).limit(1)
      if (data && data.length) subInfo = "con suscripción push guardada"
    }
    try {
      await reg.showNotification("🌿 Totoland", {
        body: "Aviso de prueba ✅ (" + subInfo + ")",
        icon: "/icon-192.png", badge: "/badge.png",
      })
      alert("Notificación local mostrada. " + subInfo + ". Clave VAPID: " +
        (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? "presente" : "FALTA") + ".")
    } catch (e) {
      alert("Error al mostrar la notificación: " + e)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-xl bg-[#faf7f0] p-5 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-stone-800">⚙️ Ajustes</h2>

        <h3 className="mb-2 text-sm font-semibold text-stone-700">🗓️ Temporada de riego</h3>
        <div className="mb-2 grid grid-cols-2 gap-3">
          <label className="block text-sm text-stone-800">
            Empieza el verano
            <select value={s} onChange={ev => setS(Number(ev.target.value))}
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2">
              {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </label>
          <label className="block text-sm text-stone-800">
            Termina el verano
            <select value={e} onChange={ev => setE(Number(ev.target.value))}
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2">
              {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </label>
        </div>
        <button onClick={saveSeason} disabled={busy}
          className="mb-4 rounded bg-[#5a7d4a] px-3 py-1.5 text-sm text-white hover:bg-[#4a6a3a]">
          Guardar temporada
        </button>

        <h3 className="mb-2 text-sm font-semibold text-stone-700">🏖️ Vacaciones</h3>
        <p className="mb-2 text-xs text-stone-600">
          Mientras estés de vacaciones no se envían avisos diarios de riego.
        </p>
        <div className="mb-2 grid grid-cols-2 gap-3">
          <label className="block text-sm text-stone-800">
            Desde
            <input type="date" value={vacStart} onChange={ev => setVacStart(ev.target.value)}
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2" />
          </label>
          <label className="block text-sm text-stone-800">
            Hasta
            <input type="date" value={vacEnd} onChange={ev => setVacEnd(ev.target.value)}
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2" />
          </label>
        </div>
        <button onClick={saveVac} className="mb-4 rounded bg-[#5a8ca6] px-3 py-1.5 text-sm text-white hover:bg-[#497691]">
          Guardar vacaciones
        </button>
        {(vacStart || vacEnd) && (
          <button onClick={clearVacations} className="mb-4 rounded border border-stone-300 px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-100">
            Borrar vacaciones
          </button>
        )}

        {vacConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-[#faf7f0] p-5 shadow-xl dark:bg-stone-700">
              <h3 className="mb-3 text-lg font-semibold text-stone-800 dark:text-white">🏖️ Riegos durante vacaciones</h3>
              <p className="mb-3 text-sm text-stone-600 dark:text-stone-300">
                Estas plantas necesitan riego durante tus vacaciones ({vacAffected.length}):
              </p>
              <ul className="mb-4 space-y-1 text-sm text-stone-700 dark:text-stone-200">
                {vacAffected.map(p => (
                  <li key={p.id} className="flex justify-between">
                    <span>💧 {p.name}</span>
                    <span className="text-xs text-[#c97b5e]">due en vacaciones</span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <button onClick={vacAdvanceWatering} className="flex-1 rounded bg-[#5a7d4a] px-3 py-1.5 text-sm text-white hover:bg-[#4a6a3a]">
                  Adelantar riegos al día antes
                </button>
                <button onClick={vacJustHide} className="flex-1 rounded border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-100">
                  Solo ocultar avisos
                </button>
                <button onClick={() => setVacConfirm(false)} className="rounded px-3 py-1.5 text-sm text-stone-500 hover:bg-stone-100">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-stone-700">🔔 Notificaciones</h3>
            {subsCount > 0 ? (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                🟢 Avisos activos ({subsCount})
              </span>
            ) : (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                🔴 Sin avisos
              </span>
            )}
          </div>
          <div className="mb-2 flex flex-wrap gap-2">
            <button onClick={enablePush}
              className="rounded bg-[#5a7d4a] px-3 py-1.5 text-sm text-white hover:bg-[#4a6a3a]">
              Activar avisos en este dispositivo
            </button>
            <button onClick={testPush}
              className="rounded border border-stone-300 px-3 py-1.5 text-sm text-stone-700">
              🧪 Probar aviso
            </button>
          </div>
          {subsCount === 0 && (
            <div className="mb-2 rounded bg-amber-50 p-3 text-xs text-amber-800">
              ⚠️ Activa los avisos para recibir notificaciones en este dispositivo
            </div>
          )}
          <label className="mb-2 block text-sm text-stone-800">
            ¿A qué hora quieres recibir el recordatorio?
            <input type="time" step={300} value={myTime} onChange={ev => saveReminderTime(ev.target.value)}
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2" />
          </label>
          <label className="block text-sm text-stone-800">
            🔕 Silenciar avisos un tiempo
            <select value={muteSel} onChange={ev => setMute(ev.target.value)}
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2">
              <option value="">No silenciado</option>
              <option value="1">Silenciar 1 día</option>
              <option value="3">Silenciar 3 días</option>
              <option value="7">Silenciar 7 días</option>
              <option value="14">Silenciar 14 días</option>
              <option value="30">Silenciar 30 días</option>
            </select>
          </label>
          {muteUntil && (
            <p className="mt-2 text-xs text-[#8a3a1a]">
              Silenciado hasta el {new Date(muteUntil).toLocaleDateString("es-ES")}.
            </p>
          )}
        </div>

        <h3 className="mb-2 text-sm font-semibold text-stone-700">🎨 Aspecto</h3>
        <div className="mb-4"><ThemeToggle /></div>

        <div className="flex justify-end">
          <button onClick={onClose} className="rounded px-3 py-2 text-stone-700 hover:bg-stone-100">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}