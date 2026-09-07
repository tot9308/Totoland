"use client"

import type { Plant } from "@/lib/plants"

export default function CemeteryModal({ plants, onRevive, onDelete, onClose }: {
  plants: Plant[]
  onRevive: (id: string) => void
  onDelete: (id: string) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
        <h2 className="mb-1 text-lg font-semibold text-emerald-900">🪦 Cementerio</h2>
        <p className="mb-3 text-xs text-emerald-600">
          Plantas que ya no están. Puedes revivirlas (traspaso, error…) o borrarlas definitivamente.
        </p>
        {plants.length === 0 && (
          <p className="text-sm text-emerald-700">Cementerio vacío. Que siga así 🌿</p>
        )}
        <ul className="space-y-2">
          {plants.map(p => (
            <li key={p.id} className="rounded-lg bg-emerald-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-emerald-900">{p.name}</p>
                  <p className="text-xs text-emerald-700">
                    {p.acquired_at ? `Llegó: ${p.acquired_at}` : "Llegada sin fecha"}
                    {p.died_at ? ` · Se fue: ${p.died_at}` : ""}
                  </p>
                  {p.notes && <p className="mt-1 text-xs italic text-emerald-600">“{p.notes}”</p>}
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => onRevive(p.id)}
                    className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700">
                    🌱 Revivir
                  </button>
                  <button onClick={() => onDelete(p.id)}
                    className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700">
                    🗑 Borrar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-end">
          <button onClick={onClose}
            className="rounded px-3 py-2 text-emerald-800 hover:bg-emerald-50">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}