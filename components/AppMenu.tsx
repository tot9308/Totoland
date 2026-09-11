"use client"

import { useState } from "react"
import Link from "next/link"
import Logo from "./Logo"

export default function AppMenu({ email, cemeteryCount, onOpenSettings, onOpenSync, onOpenAchievements, onOpenHousehold, onChangePassword, onLogout }: {
  email: string
  cemeteryCount: number
  onOpenSettings: () => void
  onOpenSync: () => void
  onOpenAchievements: () => void
  onOpenHousehold: () => void
  onChangePassword: () => void
  onLogout: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Menú"
        className="rounded border border-stone-300 px-2.5 py-1 text-lg leading-none text-stone-700 hover:bg-stone-100"
      >
        ☰
      </button>
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute left-0 top-0 h-full w-72 bg-[#faf7f0] p-4 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <Logo size={28} textClass="text-lg font-bold text-stone-800" />
            <p className="mb-4 truncate text-xs text-stone-500">{email}</p>
            <div className="flex flex-col gap-1 text-sm text-stone-800">
              <button onClick={() => { setOpen(false); onOpenSettings() }}
                className="rounded px-3 py-2 text-left hover:bg-stone-100">
                ⚙️ Ajustes
              </button>
              <button onClick={() => { setOpen(false); onOpenSync() }}
                className="rounded px-3 py-2 text-left hover:bg-stone-100">
                🔄 Sincronizar riegos
              </button>
              <button onClick={() => { setOpen(false); onOpenAchievements() }}
                className="rounded px-3 py-2 text-left hover:bg-stone-100">
                🏆 Logros
              </button>
              <button onClick={() => { setOpen(false); onOpenHousehold() }}
                className="rounded px-3 py-2 text-left hover:bg-stone-100">
                🏠 Mi casa
              </button>
              <Link href="/year" onClick={() => setOpen(false)}
                className="rounded px-3 py-2 text-left hover:bg-stone-100">
                📊 Tu año verde
              </Link>
              <Link href="/tasks" onClick={() => setOpen(false)}
                className="rounded px-3 py-2 text-left hover:bg-stone-100">
                📋 Tareas
              </Link>
              <Link href="/reminders" onClick={() => setOpen(false)}
                className="rounded px-3 py-2 text-left hover:bg-stone-100">
                🔔 Recordatorios
              </Link>
              <Link href="/recovery" onClick={() => setOpen(false)}
                className="rounded px-3 py-2 text-left hover:bg-stone-100">
                🩺 Seguimiento
              </Link>
              <Link href="/calendar" onClick={() => setOpen(false)}
                className="rounded px-3 py-2 text-left hover:bg-stone-100">
                📅 Calendario
              </Link>
              <Link href="/about" onClick={() => setOpen(false)}
                className="rounded px-3 py-2 text-left hover:bg-stone-100">
                💚 Acerca de
              </Link>
              <Link href="/guide" onClick={() => setOpen(false)}
                className="rounded px-3 py-2 text-left hover:bg-stone-100">
                📚 Guía
              </Link>
              <Link href="/cemetery" onClick={() => setOpen(false)}
                className="rounded px-3 py-2 text-left hover:bg-stone-100">
                🪦 Cementerio{cemeteryCount > 0 ? ` (${cemeteryCount})` : ""}
              </Link>
              <button onClick={() => { setOpen(false); onChangePassword() }}
                className="rounded px-3 py-2 text-left hover:bg-stone-100">
                🔑 Cambiar contraseña
              </button>
              <button onClick={onLogout}
                className="rounded px-3 py-2 text-left text-[#8a3a1a] hover:bg-red-50">
                🚪 Salir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}