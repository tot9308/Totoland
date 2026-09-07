export type Achievement = {
  code: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  unlocked_at: string | null
}

export const ALL_ACHIEVEMENTS = [
  { code: "first_plant", title: "Primera planta", description: "Añadiste tu primera planta a Totoland.", icon: "🌱" },
  { code: "collector_10", title: "Coleccionista", description: "10 plantas vivas en casa.", icon: "🌿" },
  { code: "collector_25", title: "Jardín en casa", description: "25 plantas vivas en casa.", icon: "🌳" },
  { code: "species_master", title: "Catálogo vivo", description: "10 especies diferentes en casa.", icon: "🏛️" },
  { code: "waterer_10", title: "Primeros riegos", description: "10 riegos totales registrados.", icon: "💧" },
  { code: "waterer_100", title: "Regador experto", description: "100 riegos totales.", icon: "💦" },
  { code: "chronicler", title: "Cronista", description: "100 eventos registrados en el historial.", icon: "📖" },
  { code: "photographer", title: "Fotógrafo de plantas", description: "50 fotos subidas.", icon: "📸" },
  { code: "punctual_14", title: "Quincena puntual", description: "14 riegos seguidos a tiempo (sin retraso).", icon: "⏰" },
  { code: "punctual_30", title: "Mes puntual", description: "30 riegos seguidos a tiempo.", icon: "📅" },
  { code: "punctual_90", title: "Trimestre impecable", description: "90 riegos seguidos a tiempo. Leyenda.", icon: "🏅" },
  { code: "resurrection", title: "Resurrección", description: "Has revivido una planta del cementerio.", icon: "✨" },
]