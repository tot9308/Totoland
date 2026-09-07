export type Task = {
  id: string
  household_id: string
  plant_id: string | null
  type: string
  title: string
  description: string | null
  month: number
  year: number
  status: "pending" | "done" | "dismissed"
  created_at: string
  completed_at: string | null
}

export const TASK_ICONS: Record<string, string> = {
  repot: "🪴",
  fertilize: "🌾",
  prune: "✂️",
  clean: "🧽",
  move_in: "🏠",
  move_out: "🌳",
  reduce_water: "💧",
  pest_watch: "🐛",
  light: "☀️",
  no_fertilize: "🚫",
}

// Catálogo general (se sugiere una vez al mes a la casa entera)
export const MONTHLY_TASKS = [
  { month: 3, type: "repot", title: "Primavera: revisar trasplantes", description: "Comprueba si alguna planta necesita maceta nueva (raíces por el drenaje, sustrato que no absorbe)." },
  { month: 3, type: "fertilize", title: "Empezar abono de primavera", description: "Reanuda el abono a mitad de dosis para las plantas activas." },
  { month: 4, type: "clean", title: "Limpiar hojas", description: "Pasa un paño húmedo a las plantas de hoja grande para que capten mejor la luz." },
  { month: 5, type: "move_out", title: "Sacar plantas al exterior", description: "Las que aguanten el balcón: aclimata progresivamente (1-2 h de sol suave el primer día)." },
  { month: 6, type: "pest_watch", title: "Vigilar plagas de verano", description: "Araña roja, cochinilla y mosca blanca: revisa el envés de las hojas." },
  { month: 7, type: "reduce_water", title: "Riego en horas frescas", description: "Riega a primera o última hora; nunca a pleno sol." },
  { month: 9, type: "move_in", title: "Meter plantas sensibles", description: "Antes de las primeras noches frías, recoge tropicales y suculentas delicadas." },
  { month: 10, type: "reduce_water", title: "Reducir riego progresivamente", description: "Las plantas empiezan a entrar en reposo: alarga los intervalos." },
  { month: 11, type: "no_fertilize", title: "Parar el abono", description: "La mayoría descansa en invierno: deja de abonar hasta febrero-marzo." },
  { month: 11, type: "light", title: "Acercar a las ventanas", description: "Con menos horas de luz, maximiza la que reciben." },
  { month: 1, type: "no_fertilize", title: "Sigue sin abonar", description: "Enero y febrero: descanso invernal." },
  { month: 1, type: "clean", title: "Limpieza de invierno", description: "Quita hojas secas y revisa que no haya plagas ocultas." },
  { month: 2, type: "prune", title: "Poda ligera pre-primavera", description: "Recorta ramas secas o estiradas antes del brote primaveral." },
  { month: 12, type: "light", title: "Proteger del frío y corrientes", description: "Aleja plantas de ventanas mal aisladas y radiadores." },
]

// Tareas por especie y mes (se generan para cada planta viva de esa especie)
export const SPECIES_MONTHLY_TASKS: Record<string, { month: number; type: string; title: string; description: string }[]> = {
  "Spathiphyllum wallisii": [
    { month: 5, type: "fertilize", title: "Abono quincenal", description: "Empieza a abonar cada 15 días con fertilizante equilibrado." },
  ],
  "Phalaenopsis hybrida": [
    { month: 10, type: "reduce_water", title: "Reposo de orquídea", description: "Reduce riego y ponla en sitio fresco (15-18 °C de noche) para estimular floración." },
  ],
  "Cyclamen persicum": [
    { month: 6, type: "reduce_water", title: "Reposo estival del ciclamen", description: "Deja de regar cuando pierda las hojas: el bulbo descansa hasta otoño." },
  ],
  "Hydrangea macrophylla": [
    { month: 3, type: "prune", title: "Poda de hortensia", description: "Recorta solo las flores secas del año anterior, sin bajar más de 2 nudos." },
    { month: 3, type: "fertilize", title: "Abono ácido", description: "Abono específico para hortensias; sulfato de hierro si quieres azules." },
  ],
  "Lavandula angustifolia": [
    { month: 3, type: "prune", title: "Poda de lavanda", description: "Recorta un tercio para que mantenga forma y no se vuelva leñosa." },
  ],
  "Pelargonium hortorum": [
    { month: 3, type: "prune", title: "Poda de geranios", description: "Recorta tallos largos y pinza puntas para que ramifique." },
  ],
}
import { supabase } from "./supabase"
import { type Plant } from "./plants"

export async function ensureMonthlyTasks(householdId: string, plants: Plant[], month: number, year: number) {
  const { data: existing } = await supabase
    .from("tasks").select("id")
    .eq("household_id", householdId).eq("month", month).eq("year", year).limit(1)
  if (existing && existing.length > 0) return
  const toInsert: object[] = []
  for (const t of MONTHLY_TASKS.filter(m => m.month === month))
    toInsert.push({ household_id: householdId, plant_id: null, type: t.type, title: t.title, description: t.description, month, year })
  for (const p of plants) {
    if (p.status === "dead" || !p.species) continue
    for (const t of (SPECIES_MONTHLY_TASKS[p.species] ?? []).filter(s => s.month === month))
      toInsert.push({ household_id: householdId, plant_id: p.id, type: t.type, title: `${p.name}: ${t.title}`, description: t.description, month, year })
  }
  if (toInsert.length) await supabase.from("tasks").insert(toInsert)
}