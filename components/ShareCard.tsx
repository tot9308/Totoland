"use client"

import { useEffect, useRef, useState } from "react"
import type { Plant } from "@/lib/plants"
import { LIGHT_LABELS, WATER_LABELS, MIST_LABELS, type SpeciesCard } from "@/lib/species"

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const i = new Image()
    i.crossOrigin = "anonymous"
    i.onload = () => res(i)
    i.onerror = rej
    i.src = src
  })
}

function cover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const ir = img.width / img.height
  const r = w / h
  let sw = img.width, sh = img.height, sx = 0, sy = 0
  if (ir > r) { sw = img.height * r; sx = (img.width - sw) / 2 }
  else { sh = img.width / r; sy = (img.height - sh) / 2 }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxW: number, startPx: number, family: string) {
  let px = startPx
  ctx.font = `bold ${px}px ${family}`
  while (ctx.measureText(text).width > maxW && px > 30) {
    px -= 4
    ctx.font = `bold ${px}px ${family}`
  }
}

export default function ShareCard({ plant, speciesCard, photoUrl, onClose }: {
  plant: Plant
  speciesCard?: SpeciesCard
  photoUrl?: string
  onClose: () => void
}) {
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState("")
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  function careLines(): string[] {
    if (!speciesCard) return []
    return [
      LIGHT_LABELS[speciesCard.light],
      WATER_LABELS[speciesCard.water].label,
      MIST_LABELS[speciesCard.mist],
      `Riego orientativo: cada ${speciesCard.ws} d en verano`,
    ]
  }

  async function build(): Promise<HTMLCanvasElement> {
    const W = 1080, H = 1350
    const c = document.createElement("canvas")
    c.width = W; c.height = H
    const ctx = c.getContext("2d")!
    ctx.fillStyle = "#faf7f0"; ctx.fillRect(0, 0, W, H)
    if (photoUrl) {
      try { cover(ctx, await loadImg(photoUrl), 0, 0, W, 820) } catch {}
    }
    ctx.fillStyle = "#5a7d4a"; ctx.fillRect(0, 820, W, H - 820)
    ctx.fillStyle = "#ffffff"
    fitText(ctx, plant.name, W - 120, 72, "serif")
    ctx.fillText(plant.name, 60, 940)
    ctx.font = "italic 36px serif"; ctx.fillStyle = "#dcead6"
    ctx.fillText(plant.species ?? "", 60, 995)
    ctx.font = "34px sans-serif"; ctx.fillStyle = "#ffffff"
    let y = 1070
    for (const ln of careLines().slice(0, 4)) { ctx.fillText(ln, 60, y); y += 50 }
    ctx.font = "28px sans-serif"; ctx.fillStyle = "#cfe0c8"
    ctx.fillText("🌿 Totoland", 60, H - 45)
    return c
  }

  useEffect(() => {
    (async () => {
      const c = await build()
      canvasRef.current = c
      setPreview(c.toDataURL("image/png"))
    })()
  }, [])

  function download(blob: Blob) {
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `${plant.name}.png`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async function share() {
    setBusy(true); setMsg("")
    try {
      const c = canvasRef.current ?? await build()
      const blob = await new Promise<Blob | null>(r => c.toBlob(r, "image/png"))
      if (!blob) throw new Error("no se pudo generar la imagen")
      const file = new File([blob], `${plant.name}.png`, { type: "image/png" })
      const nav = navigator as any
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title: plant.name, text: `Cuidados de ${plant.name} 🌿` })
      } else if (nav.share) {
        await nav.share({ title: plant.name, text: `Cuidados de ${plant.name} 🌿` })
      } else {
        download(blob)
        setMsg("Tu navegador no comparte imágenes: se ha descargado.")
      }
    } catch (e) {
      setMsg("No se pudo compartir: " + e)
    }
    setBusy(false)
  }

  async function save() {
    setBusy(true)
    try {
      const c = canvasRef.current ?? await build()
      const blob = await new Promise<Blob | null>(r => c.toBlob(r, "image/png"))
      if (blob) download(blob)
    } catch (e) { setMsg("No se pudo descargar: " + e) }
    setBusy(false)
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[88vh] w-full max-w-sm overflow-y-auto rounded-xl bg-[#faf7f0] p-5 shadow-xl">
        <h2 className="mb-3 text-lg font-semibold text-stone-800">📤 Tarjeta de {plant.name}</h2>
        {preview && <img src={preview} alt="Vista previa" className="mb-3 w-full rounded-lg shadow" />}
        <div className="flex gap-2">
          <button onClick={share} disabled={busy}
            className="flex-1 rounded bg-[#5a7d4a] px-3 py-2 text-sm text-white hover:bg-[#4a6a3a] disabled:opacity-40">
            📤 Compartir
          </button>
          <button onClick={save} disabled={busy}
            className="flex-1 rounded border border-stone-300 px-3 py-2 text-sm text-stone-700 hover:bg-stone-100 disabled:opacity-40">
            ⬇️ Descargar
          </button>
        </div>
        {msg && <p className="mt-2 text-xs text-stone-600">{msg}</p>}
        <p className="mt-2 text-xs text-stone-500">
          En el móvil, "Compartir" abre el menú del sistema (WhatsApp, etc.) con la imagen lista.
        </p>
        <div className="mt-3 flex justify-end">
          <button onClick={onClose} className="rounded px-3 py-2 text-sm text-stone-700 hover:bg-stone-100">Cerrar</button>
        </div>
      </div>
    </div>
  )
}