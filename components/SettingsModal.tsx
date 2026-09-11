"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

export default function SettingsModal({ householdId, summerStart, summerEnd, onSeasonSaved, sortBy, onSortBy, showPhotos, onShowPhotos, size, onSize, reminderTime, onReminderTime, onClose }: {
  householdId: string
  summerStart: number
  summerEnd: number
  onSeasonSaved: (s: number, e: number) => void
  sortBy: "due" | "name" | "location"
  onSortBy: (v: "due" | "name" | "location") => void
  showPhotos: boolean
  onShowPhotos: (v: boolean) => void
  size: "grande" | "medio" | "pequeno"
  onSize: (v: "grande" | "medio" | "pequeno") => void
  reminderTime: string
  onReminderTime: (v: string) => void
  onClose: () => void
}) {
  const [s, setS] = useState(summerStart)
  const [e, setE] = useState(summerEnd)
  const [busy, setBusy] = useState(false)

  async function saveSeason() {
    setBusy(true)
    const { error } = await supabase
      .from("households")
      .update({ summer_start_month: s, summer_end_month: e })
      .eq("id", householdId)
    setBusy(false)
    if (error) return alert("Error: " + error.message)
    onSeasonSaved(s, e)
  }

  async function saveReminderTime(v: string) {
    const { error } = await supabase
      .from("households").update({ reminder_time: v }).eq("id", householdId)
    if (error) return alert("Error: " + error.message)
    onReminderTime(v)
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
    if (!("serviceWorker" in navigator) || !("PushManager" in window))
      return alert("Este navegador no soporta avisos")
    const perm = await Notification.requestPermission()
    if (perm !== "granted") return alert("Permiso de avisos denegado")
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
    })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from("push_subscriptions").delete().eq("user_id", user.id)
    const { error } = await supabase.from("push_subscriptions").insert({
      user_id: user.id,
      endpoint: sub.endpoint,
      subscription: sub.toJSON(),
    })
    if (error) return alert("Error al guardar el aviso: " + error.message)
    alert("Avisos activados en este dispositivo ✅")
  }

  async function testPush() {
    if (!("serviceWorker" in navigator)) return alert("Este navegador no soporta avisos")
    const reg = await navigator.serviceWorker.ready
    reg.showNotification("🌿 Totoland", { body: "Aviso de prueba: todo funciona ✅", icon: "/icon-192.png", badge: "/badge.png" })
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

        <h3 className="mb-2 text-sm font-semibold text-stone-700">🔔 Notificaciones</h3>
        <div className="mb-4 flex flex-wrap gap-2">
          <button onClick={enablePush}
            className="rounded bg-[#5a7d4a] px-3 py-1.5 text-sm text-white hover:bg-[#4a6a3a]">
            Activar avisos en este dispositivo
          </button>
          <button onClick={testPush}
            className="rounded border border-stone-300 px-3 py-1.5 text-sm text-stone-700">
            🧪 Probar aviso
          </button>
        </div>

        <h3 className="mb-2 mt-4 text-sm font-semibold text-stone-700">🎨 Aspecto</h3>
        <label className="mb-2 block text-sm text-stone-800">
          Orden por defecto
          <select value={sortBy} onChange={ev => onSortBy(ev.target.value as "due" | "name" | "location")}
            className="mt-1 w-full rounded border border-stone-300 px-3 py-2">
            <option value="due">Próximo riego</option>
            <option value="name">Nombre</option>
            <option value="location">Ubicación</option>
          </select>
        </label>
        <label className="mb-2 flex items-center gap-2 text-sm text-stone-800">
          <input type="checkbox" checked={showPhotos} onChange={ev => onShowPhotos(ev.target.checked)} />
          Mostrar fotos en las tarjetas
        </label>
        <label className="mb-4 block text-sm text-stone-800">
          Tamaño de las tarjetas
          <select value={size} onChange={ev => onSize(ev.target.value as "grande" | "medio" | "pequeno")}
            className="mt-1 w-full rounded border border-stone-300 px-3 py-2">
            <option value="grande">Grandes (1 columna en el móvil)</option>
            <option value="medio">Medias (1 en móvil, 3 en PC)</option>
            <option value="pequeno">Pequeñas (2 columnas en el móvil)</option>
          </select>
        </label>

        <h3 className="mb-2 mt-4 text-sm font-semibold text-stone-700">🔔 Hora del aviso diario</h3>
        <label className="mb-4 block text-sm text-stone-800">
          ¿A qué hora quieres recibir el recordatorio?
          <select value={reminderTime} onChange={ev => saveReminderTime(ev.target.value)}
            className="mt-1 w-full rounded border border-stone-300 px-3 py-2">
            {Array.from({ length: 17 }, (_, i) => i + 6).map(h => (
              <option key={h} value={`${String(h).padStart(2, "0")}:00`}>
                {String(h).padStart(2, "0")}:00
              </option>
            ))}
          </select>
        </label>

        <div className="flex justify-end">
          <button onClick={onClose}
            className="rounded px-3 py-2 text-stone-700 hover:bg-stone-100">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}