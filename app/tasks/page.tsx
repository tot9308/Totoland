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
  const [fPlants, setFPlants] = useState<string[]>([])

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
    setEditing(null); setFTitle(""); setFDesc(""); setFMonth(month); setFPlants([]); setShowForm(true)
  }
  function openEdit(t: Task) {
    setEditing(t); setFTitle(t.title); setFDesc(t.description ?? ""); setFMonth(t.month)
    setFPlants(t.plant_id ? [t.plant_id] : [])
    setShowForm(true)
  }

  async function saveForm(e: React.FormEvent) {
    e.preventDefault()
    if (!householdId || !fTitle.trim()) return
    const baseTitle = fTitle.trim()
    const baseDesc = fDesc.trim() || null

    if (editing) {
      // Editar: solo cambia título/descripción/mes de esa tarea concreta
      await supabase.from("tasks").update({
        title: baseTitle,
        description: baseDesc,
        month: fMonth,
        plant_id: fPlants[0] || null,
      }).eq("id", editing.id)
    } else {
      // Crear: si se eligen plantas, una tarea por planta con título "Nombre: título"
      if (fPlants.length === 0) {
        await supabase.from("tasks").insert({
          household_id: householdId, plant_id: null, type: "custom",
          title: baseTitle, description: baseDesc, month: fMonth, year,
        })
      } else {
        const rows = fPlants.map(pid => {
          const p = plants.find(pl => pl.id === pid)
          return {
            household_id: householdId,
            plant_id: pid,
            type: "custom",
            title: p ? `${p.name}: ${baseTitle}` : baseTitle,
            description: baseDesc,
            month: fMonth,
            year,
          }
        })
        await supabase.from("tasks").insert(rows)
      }
    }
    setShowForm(false)
    reload()
  }
  return (
    <main className="min-h-screen bg-stone-50 p-4 md:p-8">
      <header className="mb-6 flex flex-wrap items-center gap-3">
        <Link href="/" className="text-sm text-stone-600 hover:underline">← Volver</Link>
        <h1 className="text-2xl font-bold text-stone-800">📋 Tareas</h1>
        <select value={month} onChange={e => setMonth(Number(e.target.value))}
          className="rounded border border-stone-300 px-2 py-1 text-sm">
          {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <button onClick={openAdd}
          className="ml-auto rounded bg-[#5a7d4a] px-3 py-1.5 text-sm text-white hover:bg-[#4a6a3a]">
          + Añadir tarea
        </button>
      </header>

      {showForm && (
        <form onSubmit={saveForm} className="mb-6 rounded-xl bg-[#faf7f0] p-4 shadow-sm">
          <h2 className="mb-2 font-semibold text-stone-800">{editing ? "Editar tarea" : "Nueva tarea"}</h2>
          <div className="grid gap-2 md:grid-cols-2">
            <input value={fTitle} onChange={e => setFTitle(e.target.value)} placeholder="Título *" required
              className="rounded border border-stone-300 px-3 py-2 text-sm" />
            <select value={fMonth} onChange={e => setFMonth(Number(e.target.value))}
              className="rounded border border-stone-300 px-3 py-2 text-sm">
              {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <input value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="Descripción (opcional)"
              className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2" />
            <div className="md:col-span-2">
              <p className="mb-1 text-xs text-stone-600">
                {editing
                  ? "Planta asociada (solo una al editar):"
                  : "Plantas asociadas (se creará una tarea por cada una):"}
              </p>
              <div className="max-h-40 overflow-y-auto rounded border border-stone-300 p-2">
                {plants.filter(p => p.status !== "dead").length === 0 ? (
                  <p className="text-xs text-stone-500">No hay plantas vivas en esta casa.</p>
                ) : (
                  plants.filter(p => p.status !== "dead").map(p => (
                    <label key={p.id} className="flex items-center gap-2 py-0.5 text-sm text-stone-800">
                      <input
                        type={editing ? "radio" : "checkbox"}
                        name="task-plants"
                        checked={fPlants.includes(p.id)}
                        onChange={() => {
                          if (editing) setFPlants([p.id])
                          else setFPlants(
                            fPlants.includes(p.id)
                              ? fPlants.filter(x => x !== p.id)
                              : [...fPlants, p.id]
                          )
                        }}
                      />
                      {p.name}
                    </label>
                  ))
                )}
              </div>
              <button type="button" onClick={() => setFPlants([])}
                className="mt-1 text-xs text-stone-600 hover:underline">
                {fPlants.length > 0 ? `Quitar selección (${fPlants.length})` : "Sin planta asociada"}
              </button>
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)}
              className="rounded px-3 py-2 text-sm text-stone-700 hover:bg-stone-100">Cancelar</button>
            <button className="rounded bg-[#5a7d4a] px-4 py-2 text-sm text-white hover:bg-[#4a6a3a]">Guardar</button>
          </div>
        </form>
      )}

      {loading ? <p className="text-stone-700">Cargando…</p> : (
        <ul className="space-y-2">
          {tasks.map(t => (
            <li key={t.id}
              className={`rounded-xl p-3 shadow-sm ${t.status === "done" ? "bg-stone-50 opacity-70" : t.status === "dismissed" ? "bg-slate-100 opacity-60" : "bg-[#faf7f0]"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-stone-800">
                    <span className="mr-1">{TASK_ICONS[t.type] ?? "📋"}</span>{t.title}
                    {t.type === "custom" && <span className="ml-2 rounded bg-[#dfe9e4] px-1.5 text-[10px] text-stone-600">propia</span>}
                  </p>
                  {t.description && <p className="mt-1 text-xs text-stone-600">{t.description}</p>}
                  <p className="mt-1 text-[11px] text-emerald-500">
                    {t.status === "done" ? "✓ hecha" : t.status === "dismissed" ? "✗ saltada" : "pendiente"}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  {t.status === "pending" ? (
                    <>
                      <button onClick={() => setStatus(t, "done")} className="rounded bg-[#5a7d4a] px-2 py-1 text-xs text-white">✓ Hecho</button>
                      <button onClick={() => setStatus(t, "dismissed")} className="rounded bg-[#faf7f0] px-2 py-1 text-xs text-stone-600">✗ Saltar</button>
                    </>
                  ) : (
                    <button onClick={() => setStatus(t, "pending")} className="rounded bg-[#faf7f0] px-2 py-1 text-xs text-stone-600">Reabrir</button>
                  )}
                  {t.type === "custom" && (
                    <>
                      <button onClick={() => openEdit(t)} className="rounded bg-[#faf7f0] px-2 py-1 text-xs text-stone-600">✏️ Editar</button>
                      <button onClick={() => remove(t)} className="rounded bg-[#b5603d] px-2 py-1 text-xs text-white">🗑 Borrar</button>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
          {tasks.length === 0 && <p className="text-stone-700">No hay tareas en {MESES[month - 1]}.</p>}
        </ul>
      )}
    </main>
  )
}