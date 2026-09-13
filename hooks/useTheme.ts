"use client"

import { useEffect, useState } from "react"

export type Theme = "light" | "dark" | "system"

const KEY = "totoland-theme"

function apply(theme: Theme) {
  const sysDark = window.matchMedia("(prefers-color-scheme: dark)").matches
  const dark = theme === "dark" || (theme === "system" && sysDark)
  document.documentElement.classList.toggle("dark", dark)
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("system")

  useEffect(() => {
    const saved = (localStorage.getItem(KEY) as Theme | null) ?? "system"
    setThemeState(saved)
    apply(saved)
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => apply(saved)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  function setTheme(t: Theme) {
    localStorage.setItem(KEY, t)
    setThemeState(t)
    apply(t)
  }

  return { theme, setTheme }
}