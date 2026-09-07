"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

export default function SignupPage() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function signup(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres")
    setBusy(true)
    setError("")

    const { data: auth, error: authError } = await supabase.auth.signUp({ email, password })
    if (authError) { setBusy(false); return setError(authError.message) }

    if (auth.user) {
      const name = displayName.trim() || email.split("@")[0]
      const { data: hh } = await supabase
        .from("households")
        .insert({ name: `Casa de ${name}` })
        .select("id")
        .single()
      if (hh) {
        await supabase.from("household_members").insert({
          household_id: hh.id,
          user_id: auth.user.id,
          role: "owner",
        })
        await supabase.from("profiles").upsert({ id: auth.user.id, display_name: name })
      }
    }

    setBusy(false)
    alert("Cuenta creada ✅ Revisa tu email para confirmarla y luego entra.")
    router.push("/")
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-emerald-50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h1 className="mb-4 text-center text-2xl font-bold text-emerald-900">🌿 Crear cuenta</h1>
        <form onSubmit={signup} className="space-y-3">
          <label className="block text-sm text-emerald-900">
            Tu nombre (como te verán en casa)
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
              placeholder="Ej: María"
              className="mt-1 w-full rounded border border-emerald-300 px-3 py-2" />
          </label>
          <label className="block text-sm text-emerald-900">
            Email
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="mt-1 w-full rounded border border-emerald-300 px-3 py-2" />
          </label>
          <label className="block text-sm text-emerald-900">
            Contraseña (mínimo 6 caracteres)
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="mt-1 w-full rounded border border-emerald-300 px-3 py-2" />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button disabled={busy}
            className="w-full rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-40">
            {busy ? "Creando…" : "Registrarme"}
          </button>
        </form>
        <p className="mt-3 text-center text-xs text-emerald-600">
          Se creará una casa nueva solo para ti. Podrás invitar a otras personas más adelante.
        </p>
        <div className="mt-2 text-center text-sm">
          <Link href="/" className="text-emerald-700 hover:underline">¿Ya tienes cuenta? Entra</Link>
        </div>
      </div>
    </main>
  )
}