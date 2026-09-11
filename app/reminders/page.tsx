"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { type Plant } from "@/lib/plants"

type Reminder = {
  id: string
  plant_id: string | null
  title: string
  recurrence: string
  next_run_at: string
  active: boolean
}

const REC_LABEL: Record<string, string> = {
  once: "Una vez",
  daily: "Diario",
  weekly: "Semanal",
  biweekly: "Quincenal",
  monthly: "Mensual",
}

export default function RemindersPage() {
  const router = useRouter()
  const [householdId, setHouseholdId] = useState<string | null>(null)
  const [plants, setPlants] = useState<Plant[]>([])
  const [items, setItems] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Reminder | null>(null)
  const [fTitle, setFTitle] = useState("")
  const [fPlant, setFPlant] = useState("")
  const [fRec, setFRec] = useState("weekly")
  const [fDate, setFDate] = useState(new Date().toISOString().slice(0, 10))

  const reload = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace("/"); return }
    const { data: mem } = await supabase.from("household_members")
      .select("household_id").eq("user_id", user.id).limit(1).single()
    if (!mem) { router.replace("/"); return }
    setHouseholdId(mem.household_id)
    const { data: pl } = await supabase.from("plants").select("*")
      .eq("household_id", mem.household_id).neq("status", "dead").order("name")
    setPlants((pl as Plant[]) ?? [])
    const { data: rm } = await supabase.from("custom_reminders").select("*")
      .eq("household_id", mem.household_id).order("next_run_at")
    setItems((rm as Reminder[]) ?? [])
    setLoading(false)
  }, [router])

  useEffect(() => { reload() }, [reload])

  function openAdd() {
    setEditing(null); setFTitle(""); setFPlant(""); setFRec("weekly")
    setFDate(new Date().toISOString().slice(0, 10)); setShowForm(true)
  }
  function openEdit(r: Reminder) {
    setEditing(r); setFTitle(r.title); setFPlant(r.plant_id ?? "")
    setFRec(r.recurrence); setFDate(r.next_run_at.slice(0, 10)); setShowForm(true)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!householdId || !fTitle.trim()) return
    const payload = {
      household_id: householdId,
      plant_id: fPlant || null,
      title: fTitle.trim(),
      recurrence: fRec,
      next_run_at: new Date(fDate + "T09:00:00").toISOString(),
      active: true,
    }
    if (editing) await supabase.from("custom_reminders").update(payload).eq("id", editing.id)
    else await supabase.from("custom_reminders").insert(payload)
    setShowForm(false)
    reload()
  }

  async function toggle(r: Reminder) {
    await supabase.from("custom_reminders").update({ active: !r.active }).eq("id", r.id)
    reload()
  }

  async function remove(r: Reminder) {
    if (!confirm("¿Borrar este recordatorio?")) return
    await supabase.from("custom_reminders").delete().eq("id", r.id)
    reload()
  }

  return (
    <main className="min-h-screen bg-emerald-50 p-4 md:p-8">
      <header className="mb-6 flex flex-wrap items-center gap-3">
        <Link href="/" className="text-sm text-emerald-700 hover:underline">← Volver</Link>
        <h1 className="text-2xl font-bold text-emerald-900">🔔 Recordatorios</h1>
        <button onClick={openAdd}
          className="ml-auto rounded bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700">
          + Nuevo recordatorio
        </button>
      </header>

      {showForm && (
        <form onSubmit={save} className="mb-6 rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-2 font-semibold text-emerald-900">
            {editing ? "Editar recordatorio" : "Nuevo recordatorio"}
          </h2>
          <div className="grid gap-2 md:grid-cols-2">
            <input value={fTitle} onChange={e => setFTitle(e.target.value)} required
              placeholder="Ej: Girar la maceta, limpiar hojas…"
              className="rounded border border-emerald-300 px-3 py-2 text-sm md:col-span-2" />
            <select value={fPlant} onChange={e => setFPlant(e.target.value)}
              className="rounded border border-emerald-300 px-3 py-2 text-sm">
              <option value="">Sin planta concreta</option>
              {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={fRec} onChange={e => setFRec(e.target.value)}
              className="rounded border border-emerald-300 px-3 py-2 text-sm">
              {Object.entries(REC_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <label className="block text-sm text-emerald-900 md:col-span-2">
              Primera fecha
              <input type="date" value={fDate} onChange={e => setFDate(e.target.value)}
                className="mt-1 w-full rounded border border-emerald-300 px-3 py-2" />
            </label>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)}
              className="rounded px-3 py-2 text-sm text-emerald-800 hover:bg-emerald-50">Cancelar</button>
            <button className="rounded bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700">Guardar</button>
          </div>
        </form>
      )}

      {loading ? <p className="text-emerald-800">Cargando…</p> : (
        <ul className="space-y-2">
          {items.map(r => (
            <li key={r.id}
              className={`rounded-xl p-3 shadow-sm ${r.active ? "bg-white" : "bg-slate-100 opacity-60"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-emerald-900">
                    🔔 {r.title}
                    {r.plant_id && (
                      <span className="ml-2 rounded bg-emerald-100 px-1.5 text-[10px] text-emerald-700">
                        {plants.find(p => p.id === r.plant_id)?.name ?? "planta"}
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-emerald-700">
                    {REC_LABEL[r.recurrence]} · próxima: {new Date(r.next_run_at).toLocaleDateString("es-ES")}
                    {!r.active && " · en pausa"}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => toggle(r)}
                    className="rounded bg-white px-2 py-1 text-xs text-emerald-700">
                    {r.active ? "⏸ Pausar" : "▶ Activar"}
                  </button>
                  <button onClick={() => openEdit(r)}
                    className="rounded bg-white px-2 py-1 text-xs text-emerald-700">✏️ Editar</button>
                  <button onClick={() => remove(r)}
                    className="rounded bg-red-600 px-2 py-1 text-xs text-white">🗑 Borrar</button>
                </div>
              </div>
            </li>
          ))}
          {items.length === 0 && (
            <p className="rounded-xl bg-white p-4 text-sm text-emerald-700 shadow-sm">
              Aún no hay recordatorios. Crea uno con "+ Nuevo recordatorio"
              (p. ej. "Girar la maceta" quincenal, "Limpiar hojas" mensual).
            </p>
          )}
        </ul>
      )}
    </main>
  )
}