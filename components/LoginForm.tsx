"use client"

import { useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError("")
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) setError(error.message)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-emerald-50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h1 className="mb-1 text-center text-2xl font-bold text-emerald-900">🌿 Totoland</h1>
        <p className="mb-4 text-center text-xs text-emerald-600">
          El cuidado de tus plantas, en casa y en el bolsillo
        </p>
        <form onSubmit={login} className="space-y-3">
          <label className="block text-sm text-emerald-900">
            Email
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="mt-1 w-full rounded border border-emerald-300 px-3 py-2" />
          </label>
          <label className="block text-sm text-emerald-900">
            Contraseña
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="mt-1 w-full rounded border border-emerald-300 px-3 py-2" />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button disabled={busy}
            className="w-full rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-40">
            {busy ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <div className="mt-4 flex flex-col gap-1 text-center text-sm">
          <Link href="/forgot-password" className="text-emerald-700 hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
          <Link href="/signup" className="text-emerald-700 hover:underline">
            Crear una cuenta nueva
          </Link>
        </div>
      </div>
    </main>
  )
}