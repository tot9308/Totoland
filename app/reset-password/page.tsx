"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session))
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) return setError("Mínimo 6 caracteres")
    setBusy(true)
    setError("")
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) setError(error.message)
    else {
      alert("Contraseña actualizada ✅")
      router.push("/")
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-[#faf7f0] p-6 shadow-xl">
        <h1 className="mb-4 text-center text-2xl font-bold text-stone-800">🔑 Nueva contraseña</h1>
        {!ready ? (
          <p className="text-center text-sm text-stone-700">
            Este enlace no es válido o ha caducado.{" "}
            <a href="/forgot-password" className="text-stone-600 underline">Pide otro enlace</a>.
          </p>
        ) : (
          <form onSubmit={save} className="space-y-3">
            <label className="block text-sm text-stone-800">
              Nueva contraseña (mínimo 6 caracteres)
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="mt-1 w-full rounded border border-stone-300 px-3 py-2" />
            </label>
            {error && <p className="text-sm text-[#8a3a1a]">{error}</p>}
            <button disabled={busy}
              className="w-full rounded bg-[#5a7d4a] px-4 py-2 text-white hover:bg-[#4a6a3a] disabled:opacity-40">
              {busy ? "Guardando…" : "Guardar contraseña"}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}