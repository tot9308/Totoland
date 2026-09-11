"use client"

import { useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  async function send(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError("")
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setBusy(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-[#faf7f0] p-6 shadow-xl">
        <h1 className="mb-4 text-center text-2xl font-bold text-stone-800">🔑 Recuperar contraseña</h1>
        {sent ? (
          <div className="text-center">
            <p className="mb-4 text-sm text-stone-700">
              Te hemos enviado un email con un enlace para crear una contraseña nueva.
              Revisa también la carpeta de spam.
            </p>
            <Link href="/" className="text-sm text-stone-600 hover:underline">Volver al inicio</Link>
          </div>
        ) : (
          <form onSubmit={send} className="space-y-3">
            <label className="block text-sm text-stone-800">
              Tu email
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="mt-1 w-full rounded border border-stone-300 px-3 py-2" />
            </label>
            {error && <p className="text-sm text-[#8a3a1a]">{error}</p>}
            <button disabled={busy}
              className="w-full rounded bg-[#5a7d4a] px-4 py-2 text-white hover:bg-[#4a6a3a] disabled:opacity-40">
              {busy ? "Enviando…" : "Enviar enlace"}
            </button>
            <div className="text-center text-sm">
              <Link href="/" className="text-stone-600 hover:underline">Volver al inicio</Link>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}