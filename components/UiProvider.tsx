"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"

type Toast = { id: number; msg: string; type: "info" | "ok" | "err" }
type ConfirmState = { msg: string; resolve: (v: boolean) => void } | null

const Ctx = createContext<{ confirm: (msg: string) => Promise<boolean> }>({ confirm: async () => true })

export function useConfirm() {
  return useContext(Ctx)
}

export default function UiProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [conf, setConf] = useState<ConfirmState>(null)
  const idRef = useRef(0)

  const push = useCallback((msg: string, type: Toast["type"] = "info") => {
    const id = ++idRef.current
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])

  // Todos los alert() de la app pasan a ser toasts, sin tocar cada componente
  useEffect(() => {
    const orig = window.alert
    window.alert = (m?: any) => {
      const s = String(m ?? "")
      const low = s.toLowerCase()
      const type: Toast["type"] = low.startsWith("error") || low.includes("❌") ? "err"
        : s.includes("✅") || s.includes("") ? "ok" : "info"
      push(s, type)
    }
    return () => { window.alert = orig }
  }, [push])

  const confirm = useCallback(
    (msg: string) => new Promise<boolean>(res => setConf({ msg, resolve: res })),
    []
  )

  function answer(v: boolean) {
    conf?.resolve(v)
    setConf(null)
  }

  return (
    <Ctx.Provider value={{ confirm }}>
      {children}

      <div className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`toast-in pointer-events-auto rounded-lg px-4 py-2.5 text-sm text-white shadow-lg ${
              t.type === "ok" ? "bg-[#5a7d4a]" : t.type === "err" ? "bg-[#b5603d]" : "bg-stone-800 dark:bg-stone-600"
            }`}
          >
            {t.msg}
          </div>
        ))}
      </div>

      {conf && (
        <div className="fade-in fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="pop-in w-full max-w-xs rounded-xl bg-[#faf7f0] p-5 shadow-xl dark:bg-stone-800">
            <p className="mb-4 text-sm text-stone-800 dark:text-stone-100">{conf.msg}</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => answer(false)}
                className="rounded px-3 py-2 text-sm text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-700">
                Cancelar
              </button>
              <button onClick={() => answer(true)}
                className="rounded bg-[#b5603d] px-4 py-2 text-sm text-white hover:bg-[#9c4f31]">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  )
}