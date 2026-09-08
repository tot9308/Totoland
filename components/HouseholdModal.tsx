"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function HouseholdModal({ userId, onClose, onJoined }: {
  userId: string
  onClose: () => void
  onJoined: () => void
}) {
  const [household, setHousehold] = useState<{ id: string; name: string; invite_code: string | null } | null>(null)
  const [nameDraft, setNameDraft] = useState("")
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState("")

  useEffect(() => {
    (async () => {
      const { data: mem } = await supabase
        .from("household_members").select("household_id")
        .eq("user_id", userId).limit(1).single()
      if (!mem) return
      const { data: hh } = await supabase
        .from("households").select("id, name, invite_code")
        .eq("id", mem.household_id).single()
      setHousehold(hh)
      if (hh) setNameDraft(hh.name)
    })()
  }, [userId])

  async function copy() {
    if (!household?.invite_code) return
    await navigator.clipboard.writeText(household.invite_code)
    setMsg("Código copiado ✅")
  }

  async function saveName() {
    if (!household) return
    const name = nameDraft.trim()
    if (!name) return setMsg("El nombre no puede quedar vacío.")
    const { error } = await supabase.from("households").update({ name }).eq("id", household.id)
    if (error) return setMsg("Error: " + error.message)
    setHousehold({ ...household, name })
    setMsg("Nombre actualizado ✅")
  }

  async function join(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg("")
    const { data: hid, error } = await supabase.rpc("find_household_by_code", { code })
    if (error || !hid) {
      setBusy(false)
      return setMsg("Código no válido o casa no encontrada.")
    }
    await supabase.from("household_members").delete().eq("user_id", userId)
    const { error: e2 } = await supabase.from("household_members").insert({
      household_id: hid, user_id: userId, role: "member",
    })
    setBusy(false)
    if (e2) return setMsg("Error al unirme: " + e2.message)
    onJoined()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
        <h2 className="mb-3 text-lg font-semibold text-emerald-900">🏠 Mi casa</h2>

        {household && (
          <div className="mb-4 rounded bg-emerald-50 p-3 text-sm text-emerald-900">
            <label className="mb-1 block text-xs text-emerald-700">Nombre de la casa</label>
            <div className="flex items-center gap-2">
              <input
                value={nameDraft}
                onChange={e => setNameDraft(e.target.value)}
                className="flex-1 rounded border border-emerald-300 px-2 py-1 text-sm"
              />
              <button onClick={saveName}
                className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700">
                Guardar
              </button>
            </div>
            <p className="mt-2">
              Código de invitación: <b className="tracking-widest">{household.invite_code ?? "—"}</b>{" "}
              <button onClick={copy}
                className="ml-1 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] text-white">
                copiar
              </button>
            </p>
            <p className="mt-2 text-xs text-emerald-600">
              Compártelo para que otras personas se unan a esta casa.
            </p>
          </div>
        )}

        {msg && <p className="mb-2 text-sm text-emerald-700">{msg}</p>}

        <form onSubmit={join} className="space-y-2">
          <label className="block text-sm text-emerald-900">
            Unirme a otra casa con código
            <input value={code} onChange={e => setCode(e.target.value)} placeholder="Ej: A1B2C3"
              className="mt-1 w-full rounded border border-emerald-300 px-3 py-2 uppercase" />
          </label>
          <p className="text-xs text-emerald-600">
            Al unirte, dejarás tu casa actual y verás las plantas de la nueva.
          </p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose}
              className="rounded px-3 py-2 text-emerald-800 hover:bg-emerald-50">
              Cerrar
            </button>
            <button disabled={busy || !code.trim()}
              className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-40">
              Unirme
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
