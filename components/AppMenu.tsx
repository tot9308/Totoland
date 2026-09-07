"use client"

import { useState } from "react"

export default function AppMenu({ email, cemeteryCount, onOpenSettings, onOpenCemetery, onChangePassword, onLogout }: {
  email: string
  cemeteryCount: number
  onOpenSettings: () => void
  onOpenCemetery: () => void
  onChangePassword: () => void
  onLogout: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Menú"
        className="rounded border border-emerald-300 px-2.5 py-1 text-lg leading-none text-emerald-800 hover:bg-emerald-50"
      >
        ☰
      </button>
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute left-0 top-0 h-full w-72 bg-white p-4 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="mb-1 text-lg font-bold text-emerald-900">🌿 Totoland</h2>
            <p className="mb-4 truncate text-xs text-emerald-600">{email}</p>
            <div className="flex flex-col gap-1 text-sm text-emerald-900">
              <button onClick={() => { setOpen(false); onOpenSettings() }}
                className="rounded px-3 py-2 text-left hover:bg-emerald-50">
                ⚙️ Ajustes
              </button>
              <button onClick={() => { setOpen(false); onOpenCemetery() }}
                className="rounded px-3 py-2 text-left hover:bg-emerald-50">
                🪦 Cementerio{cemeteryCount > 0 ? ` (${cemeteryCount})` : ""}
              </button>
              <button onClick={() => { setOpen(false); onChangePassword() }}
                className="rounded px-3 py-2 text-left hover:bg-emerald-50">
                🔑 Cambiar contraseña
              </button>
              <button onClick={onLogout}
                className="rounded px-3 py-2 text-left text-red-600 hover:bg-red-50">
                🚪 Salir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}