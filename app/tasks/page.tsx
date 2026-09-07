"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { ensureMonthlyTasks, TASK_ICONS, type Task } from "@/lib/tasks"
import { type Plant } from "@/lib/plants"

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

export default function TasksPage() {
  const router = useRouter()
  const [householdId, setHouseholdId] = useState<string | null>(null)
  const [plants, setPlants] = useState<Plant[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Task | null>(null)
  const [showForm, setShowForm] = useState(false)
  const year = new Date().getFullYear()

  const [fTitle, setFTitle] = useState("")
  const [fDesc, setFDesc] = useState("")
  const [fMonth, setFMonth] = useState(month)
  const [fPlant, setFPlant] = useState("")

  const reload = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace("/"); return }
    const { data: mem } = await supabase.from("household_members")
      .select("household_id").eq("user_id", user.id).limit(1).single()
    if (!mem) { router.replace("/"); return }
    setHouseholdId(mem.household_id)
    const { data: pl } = await supabase.from("plants").select("*").eq("household_id", mem.household_id)
    setPlants((pl as Plant[]) ?? [])
    await ensureMonthlyTasks(mem.household_id, (pl as Plant[]) ?? [], month, year)
    const { data } = await supabase.from("tasks").select("*")
      .eq("household_id", mem.household_id).eq("month", month).eq("year", year)
      .order("created_at")
    setTasks((data as Task[]) ?? [])
    setLoading(false)
  }, [month, router])

  useEffect(() => { setLoading(true); reload() }, [reload])

  async function setStatus(t: Task, status: "pending" | "done" | "dismissed") {
    await supabase.from("tasks").update({
      status,
      completed_at: status === "done" ? new Date().toISOString() : null,
    }).eq("id", t.id)
    reload()
  }

  async function remove(t: Task) {
    if (!confirm("¿Borrar esta tarea?")) return
    await supabase.from("tasks").delete().eq("id", t.id)
    reload()
  }

  function openAdd() {
    setEditing(null); setFTitle(""); setFDesc(""); setFMonth(month); setFPlant(""); setShowForm(true)
  }
  function openEdit(t: Task) {
    setEditing(t); setFTitle(t.title); setFDesc(t.description ?? ""); setFMonth(t.month); setFPlant(t.plant_id ?? ""); setShowForm(true)
  }

  async function saveForm(e: React.FormEvent) {
    e.preventDefault()
    if (!householdId || !fTitle.trim()) return
    const payload = {
      household_id: householdId,
      plant_id: fPlant || null,
      type: "custom",
      title: fTitle.trim(),
      description: fDesc.trim() || null,
      month: fMonth,
      year,
    }
    if (editing) await supabase.from("tasks").update(payload).eq("id", editing.id)
    else await supabase.from("tasks").insert(payload)
    setShowForm(false)
    reload()
  }

  return (
    <main className="min-h-screen bg-emerald-50 p-4 md:p-8">
      <header className="mb-6 flex flex-wrap items-center gap-3">
        <Link href="/" className="text-sm text-emerald-700 hover:underline">← Volver</Link>
        <h1 className="text-2xl font-bold text-emerald-900">📋 Tareas</h1>
        <select value={month} onChange={e => setMonth(Number(e.target.value))}
          className="rounded border border-emerald-300 px-2 py-1 text-sm">
          {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <button onClick={openAdd}
          className="ml-auto rounded bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700">
          + Añadir tarea
        </button>
      </header>

      {showForm && (
        <form onSubmit={saveForm} className="mb-6 rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-2 font-semibold text-emerald-900">{editing ? "Editar tarea" : "Nueva tarea"}</h2>
          <div className="grid gap-2 md:grid-cols-2">
            <input value={fTitle} onChange={e => setFTitle(e.target.value)} placeholder="Título *" required
              className="rounded border border-emerald-300 px-3 py-2 text-sm" />
            <select value={fMonth} onChange={e => setFMonth(Number(e.target.value))}
              className="rounded border border-emerald-300 px-3 py-2 text-sm">
              {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <input value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="Descripción (opcional)"
              className="rounded border border-emerald-300 px-3 py-2 text-sm md:col-span-2" />
            <select value={fPlant} onChange={e => setFPlant(e.target.value)}
              className="rounded border border-emerald-300 px-3 py-2 text-sm md:col-span-2">
              <option value="">Sin planta asociada</option>
              {plants.filter(p => p.status !== "dead").map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
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
          {tasks.map(t => (
            <li key={t.id}
              className={`rounded-xl p-3 shadow-sm ${t.status === "done" ? "bg-emerald-50 opacity-70" : t.status === "dismissed" ? "bg-slate-100 opacity-60" : "bg-white"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-emerald-900">
                    <span className="mr-1">{TASK_ICONS[t.type] ?? "📋"}</span>{t.title}
                    {t.type === "custom" && <span className="ml-2 rounded bg-sky-100 px-1.5 text-[10px] text-sky-700">propia</span>}
                  </p>
                  {t.description && <p className="mt-1 text-xs text-emerald-700">{t.description}</p>}
                  <p className="mt-1 text-[11px] text-emerald-500">
                    {t.status === "done" ? "✓ hecha" : t.status === "dismissed" ? "✗ saltada" : "pendiente"}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  {t.status === "pending" ? (
                    <>
                      <button onClick={() => setStatus(t, "done")} className="rounded bg-emerald-600 px-2 py-1 text-xs text-white">✓ Hecho</button>
                      <button onClick={() => setStatus(t, "dismissed")} className="rounded bg-white px-2 py-1 text-xs text-emerald-700">✗ Saltar</button>
                    </>
                  ) : (
                    <button onClick={() => setStatus(t, "pending")} className="rounded bg-white px-2 py-1 text-xs text-emerald-700">Reabrir</button>
                  )}
                  {t.type === "custom" && (
                    <>
                      <button onClick={() => openEdit(t)} className="rounded bg-white px-2 py-1 text-xs text-emerald-700">✏️ Editar</button>
                      <button onClick={() => remove(t)} className="rounded bg-red-600 px-2 py-1 text-xs text-white">🗑 Borrar</button>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
          {tasks.length === 0 && <p className="text-emerald-800">No hay tareas en {MESES[month - 1]}.</p>}
        </ul>
      )}
    </main>
  )
}