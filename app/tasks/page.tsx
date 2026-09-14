"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { getActiveHouseholdId } from "@/lib/household"
import { useConfirm } from "@/components/UiProvider"

type Task = { id: string; title: string; type: string; done: boolean; due_date: string | null }
type Reminder = { id: string; title: string; recurrence: string; active: boolean; next_run_at: string }

const RECU = { once: "una vez", daily: "diario", weekly: "semanal", biweekly: "quincenal", monthly: "mensual" }

export default function TasksPage() {
  const router = useRouter()
  const { confirm: confirmAsync } = useConfirm()
  const [householdId, setHouseholdId] = useState<string | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [showAdd, setShowAdd] = useState<"task" | "reminder" | null>(null)
  const [newTitle, setNewTitle] = useState("")
  const [newRec, setNewRec] = useState("weekly")

  const reload = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace("/"); return }
    const household_id = await getActiveHouseholdId(user.id)
    if (!household_id) { router.replace("/"); return }
    setHouseholdId(household_id)
    const { data: t } = await supabase.from("tasks").select("*").eq("household_id", household_id).order("due_date")
    setTasks((t as Task[]) ?? [])
    const { data: r } = await supabase.from("custom_reminders").select("*").eq("household_id", household_id).order("next_run_at")
    setReminders((r as Reminder[]) ?? [])
  }

  useEffect(() => { reload() }, [])

  async function toggleDone(t: Task) {
    await supabase.from("tasks").update({ done: !t.done }).eq("id", t.id)
    reload()
  }

  async function skip(t: Task) {
    await supabase.from("tasks").update({ due_date: new Date().toISOString() }).eq("id", t.id)
    reload()
  }

  async function removeTask(t: Task) {
    if (!await confirmAsync("¿Borrar esta tarea?")) return
    await supabase.from("tasks").delete().eq("id", t.id)
    reload()
  }

  async function addTask() {
    if (!householdId || !newTitle.trim()) return
    await supabase.from("tasks").insert({
      household_id: householdId, title: newTitle.trim(), type: "custom", due_date: new Date().toISOString(),
    })
    setNewTitle(""); setShowAdd(null); reload()
  }

  async function addReminder() {
    if (!householdId || !newTitle.trim()) return
    const days = newRec === "daily" ? 1 : newRec === "weekly" ? 7 : newRec === "biweekly" ? 14 : newRec === "monthly" ? 30 : 0
    const next = new Date(Date.now() + days * 86400000).toISOString()
    await supabase.from("custom_reminders").insert({
      household_id: householdId, title: newTitle.trim(), recurrence: newRec, next_run_at: next,
    })
    setNewTitle(""); setShowAdd(null); reload()
  }

  async function toggleReminder(r: Reminder) {
    await supabase.from("custom_reminders").update({ active: !r.active }).eq("id", r.id)
    reload()
  }

  async function removeReminder(r: Reminder) {
    if (!await confirmAsync("¿Borrar este recordatorio?")) return
    await supabase.from("custom_reminders").delete().eq("id", r.id)
    reload()
  }

  const pending = tasks.filter(t => !t.done)
  const done = tasks.filter(t => t.done)

  return (
    <main className="min-h-screen bg-stone-50 p-4 md:p-8 dark:bg-stone-900">
      <header className="mb-6 flex items-center gap-3">
        <Link href="/" className="text-sm text-stone-600 hover:underline dark:text-stone-300">← Volver</Link>
        <h1 className="font-serif text-2xl font-bold text-stone-800 dark:text-stone-100">📋 Tareas y recordatorios</h1>
      </header>

      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">Tareas del mes</h2>
          <button onClick={() => setShowAdd("task")} className="rounded bg-[#5a7d4a] px-3 py-1.5 text-sm text-white hover:bg-[#4a6a3a]">+ Tarea</button>
        </div>
        {pending.length === 0 && done.length === 0 && <p className="text-sm text-stone-600 dark:text-stone-300">Sin tareas.</p>}
        <ul className="space-y-2">
          {pending.map(t => (
            <li key={t.id} className="flex items-center gap-2 rounded-lg bg-[#faf7f0] p-3 shadow-sm dark:bg-stone-800">
              <input type="checkbox" checked={false} onChange={() => toggleDone(t)} />
              <span className="flex-1 text-sm text-stone-800 dark:text-stone-100">{t.title}</span>
              <button onClick={() => skip(t)} className="text-xs text-stone-500 hover:underline">Saltar</button>
              <button onClick={() => removeTask(t)} className="text-xs text-[#8a3a1a] hover:underline">Borrar</button>
            </li>
          ))}
          {done.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-stone-600 hover:underline dark:text-stone-300">Hechas ({done.length})</summary>
              <ul className="mt-2 space-y-1">
                {done.map(t => (
                  <li key={t.id} className="flex items-center gap-2 rounded bg-stone-100 p-2 text-sm text-stone-600 line-through dark:bg-stone-700">
                    <input type="checkbox" checked onChange={() => toggleDone(t)} />
                    <span className="flex-1">{t.title}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </ul>
      </section>

      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">Recordatorios recurrentes</h2>
          <button onClick={() => setShowAdd("reminder")} className="rounded bg-[#5a8ca6] px-3 py-1.5 text-sm text-white hover:bg-[#497691]">+ Recordatorio</button>
        </div>
        {reminders.length === 0 && <p className="text-sm text-stone-600 dark:text-stone-300">Sin recordatorios.</p>}
        <ul className="space-y-2">
          {reminders.map(r => (
            <li key={r.id} className="flex items-center gap-2 rounded-lg bg-[#eaf1ee] p-3 shadow-sm dark:bg-stone-800">
              <input type="checkbox" checked={r.active} onChange={() => toggleReminder(r)} />
              <div className="flex-1">
                <p className="text-sm font-medium text-stone-800 dark:text-stone-100">{r.title}</p>
                <p className="text-xs text-stone-600 dark:text-stone-300">{RECU[r.recurrence as keyof typeof RECU]} · próximo: {new Date(r.next_run_at).toLocaleDateString("es-ES")}</p>
              </div>
              <button onClick={() => removeReminder(r)} className="text-xs text-[#8a3a1a] hover:underline">Borrar</button>
            </li>
          ))}
        </ul>
      </section>

      {showAdd && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xs rounded-xl bg-[#faf7f0] p-5 shadow-xl dark:bg-stone-800">
            <h2 className="mb-3 text-lg font-semibold text-stone-800 dark:text-stone-100">
              {showAdd === "task" ? "Nueva tarea" : "Nuevo recordatorio"}
            </h2>
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Título"
              className="mb-2 w-full rounded border border-stone-300 px-3 py-2 dark:border-stone-600 dark:bg-stone-700" />
            {showAdd === "reminder" && (
              <select value={newRec} onChange={e => setNewRec(e.target.value)}
                className="mb-3 w-full rounded border border-stone-300 px-3 py-2 dark:border-stone-600 dark:bg-stone-700">
                <option value="daily">Diario</option>
                <option value="weekly">Semanal</option>
                <option value="biweekly">Quincenal</option>
                <option value="monthly">Mensual</option>
                <option value="once">Una vez</option>
              </select>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAdd(null)} className="rounded px-3 py-2 text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-700">Cancelar</button>
              <button onClick={showAdd === "task" ? addTask : addReminder} className="rounded bg-[#5a7d4a] px-4 py-2 text-white hover:bg-[#4a6a3a]">Añadir</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}