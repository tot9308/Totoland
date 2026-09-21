"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { listHouseholds, setActiveHouseholdId } from "@/lib/household"

export default function HouseSwitcher() {
  const [houses, setHouses] = useState<{ id: string; name: string }[]>([])
  const [current, setCurrent] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState("")
  const [code, setCode] = useState("")
  const [userId, setUserId] = useState<string | null>(null)

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    const { data: prof } = await supabase.from("profiles")
      .select("active_household_id").eq("id", user.id).single()
    setCurrent(prof?.active_household_id ?? null)
    setHouses(await listHouseholds(user.id))
  }
  useEffect(() => { load() }, [])

  async function switchTo(id: string) {
    if (!userId) return
    await setActiveHouseholdId(userId, id)
    window.location.reload()
  }

  async function create() {
    if (!userId || !newName.trim()) return
    const invite = Math.random().toString(36).slice(2, 8).toUpperCase()
    const id = crypto.randomUUID()
    const { error } = await supabase.from("households")
      .insert({ id, name: newName.trim(), invite_code: invite })
    if (error) return alert("Error: " + error.message)
    const { error: e2 } = await supabase.from("household_members")
      .insert({ household_id: id, user_id: userId, role: "owner" })
    if (e2) return alert("Error al añadirte como dueño: " + e2.message)
    await setActiveHouseholdId(userId, id)
    window.location.reload()
  }

  async function join() {
    if (!userId || !code.trim()) return
    const { data: h } = await supabase.from("households")
      .select("id").eq("invite_code", code.trim().toUpperCase()).limit(1).single()
    if (!h) return alert("Código no encontrado")
    const { error } = await supabase.from("household_members")
      .insert({ household_id: h.id, user_id: userId, role: "member" })
    if (error) return alert("Error: " + error.message)
    await setActiveHouseholdId(userId, h.id)
    window.location.reload()
  }

  return (
    <div className="mb-3 rounded-lg bg-stone-100 p-3 dark:bg-stone-700">
      <p className="mb-1 text-xs font-semibold uppercase text-stone-500 dark:text-stone-300">Casa activa</p>
      <select value={current ?? ""} onChange={e => switchTo(e.target.value)}
        className="w-full rounded border border-stone-300 bg-white px-2 py-1.5 text-sm dark:border-stone-600 dark:bg-stone-800">
        {houses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
      </select>
      <button onClick={() => setShowNew(s => !s)}
        className="mt-2 w-full rounded bg-[#5a7d4a] px-2 py-1.5 text-xs text-white hover:bg-[#4a6a3a]">
        + Nueva casa / unirme
      </button>
      {showNew && (
        <div className="mt-2 space-y-2">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nombre de la nueva casa"
            className="w-full rounded border border-stone-300 px-2 py-1.5 text-sm dark:border-stone-600 dark:bg-stone-800" />
          <button onClick={create}
            className="w-full rounded bg-[#5a8ca6] px-2 py-1.5 text-xs text-white hover:bg-[#497691]">
            Crear casa
          </button>
          <input value={code} onChange={e => setCode(e.target.value)} placeholder="Código de invitación"
            className="w-full rounded border border-stone-300 px-2 py-1.5 text-sm dark:border-stone-600 dark:bg-stone-800" />
          <button onClick={join}
            className="w-full rounded bg-[#c9a45a] px-2 py-1.5 text-xs text-white hover:bg-[#b08f47]">
            Unirme con código
          </button>
        </div>
      )}
    </div>
  )
}