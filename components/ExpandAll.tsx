"use client"

export default function ExpandAll() {
  function setAll(open: boolean) {
    document.querySelectorAll("details").forEach(d => {
      (d as HTMLDetailsElement).open = open
    })
  }
  return (
    <div className="mb-4 flex gap-2 text-xs">
      <button onClick={() => setAll(true)}
        className="rounded border border-stone-300 px-2 py-1 text-stone-700 hover:bg-stone-100">
        ⬇ Expandir todo
      </button>
      <button onClick={() => setAll(false)}
        className="rounded border border-stone-300 px-2 py-1 text-stone-700 hover:bg-stone-100">
        ⬆ Contraer todo
      </button>
    </div>
  )
}