"use client"

import { useTheme, type Theme } from "@/hooks/useTheme"

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <label className="block text-sm text-stone-800">
      Tema
      <select
        value={theme}
        onChange={e => setTheme(e.target.value as Theme)}
        className="mt-1 w-full rounded border border-stone-300 bg-[#faf7f0] px-3 py-2"
      >
        <option value="system">🖥️ Automático (según el sistema)</option>
        <option value="light">☀️ Claro</option>
        <option value="dark">🌙 Oscuro</option>
      </select>
    </label>
  )
}