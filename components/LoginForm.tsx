"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setBusy(false)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-emerald-50 p-4">
      <form onSubmit={login} className="w-full max-w-sm rounded-xl bg-white p-6 shadow">
        <h1 className="mb-4 text-center text-2xl font-bold text-emerald-900">🌿 Totoland</h1>
        <label className="mb-3 block text-sm text-emerald-900">
          Email
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)} required
            className="mt-1 w-full rounded border border-emerald-300 px-3 py-2"
          />
        </label>
        <label className="mb-4 block text-sm text-emerald-900">
          Contraseña
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)} required
            className="mt-1 w-full rounded border border-emerald-300 px-3 py-2"
          />
        </label>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <button disabled={busy} className="w-full rounded bg-emerald-600 py-2 text-white hover:bg-emerald-700">
          Entrar
        </button>
      </form>
    </main>
  )
}