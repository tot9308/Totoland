import { supabase } from "./supabase"
import { type Plant } from "./plants"
import { findSpecies, type SpeciesCard } from "./species"

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
  rotate: "🔄",
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

// Tareas por especie (catálogo manual, solo para casos muy específicos)
export const SPECIES_MONTHLY_TASKS: Record<string, { month: number; type: string; title: string; description: string }[]> = {
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

// Meses de reposo invernal (no abonar en ellos salvo excepciones manuales)
const NO_FERT_MONTHS = new Set([1, 2, 11, 12])

// Deriva tareas automáticas desde la ficha de especie
function speciesDerivedTasks(s: SpeciesCard, p: Plant, month: number): { type: string; title: string; description: string }[] {
  const out: { type: string; title: string; description: string }[] = []

  // 1) Abono mensual o quincenal (según fert) solo en meses de crecimiento
  if (!NO_FERT_MONTHS.has(month) && s.fert && s.fert !== "-") {
    const [freq, tipo] = s.fert.split("-")
    const tipoTxt = tipo === "Eq" ? "equilibrado" : "rico en fósforo"
    if (freq === "F") {
      out.push({
        type: "fertilize",
        title: "Abono quincenal",
        description: `Aplica fertilizante ${tipoTxt} a mitad de dosis.`,
      })
    } else {
      // M: una vez al mes
      out.push({
        type: "fertilize",
        title: "Abono mensual",
        description: `Aplica fertilizante ${tipoTxt} a dosis reducida.`,
      })
    }
  }

  // 2) Limpieza de hojas mensual para plantas de hoja (no cactus/suculentas/tillandsias)
  // Detectamos "no limpiar" cuando sustrato es poroso (2) o sin sustrato (4 con flags de inmersión)
  const isSucculent = s.substrate === 2 || s.flags.includes("inmersion")
  if (!isSucculent) {
    out.push({
      type: "clean",
      title: "Limpiar hojas",
      description: "Pasa un paño húmedo (o una ducha tibia) para que capten mejor la luz.",
    })
  }

  // 3) Rotación mensual para plantas de luz indirecta (crecen torcidas hacia la luz)
  if (s.light === 2 || s.light === 3) {
    out.push({
      type: "rotate",
      title: "Girar la maceta",
      description: "Rota 90° la maceta para que crezca recta y equilibrada.",
    })
  }

  return out
}

export async function ensureMonthlyTasks(householdId: string, plants: Plant[], month: number, year: number) {
  const { data: existing } = await supabase
    .from("tasks").select("id, plant_id, type, title")
    .eq("household_id", householdId).eq("month", month).eq("year", year)
  if (existing && existing.length > 0) return

  const toInsert: object[] = []

  // Tareas generales de la casa
  for (const t of MONTHLY_TASKS.filter(m => m.month === month))
    toInsert.push({ household_id: householdId, plant_id: null, type: t.type, title: t.title, description: t.description, month, year })

  // Tareas por planta
  for (const p of plants) {
    if (p.status === "dead" || !p.species) continue
    const species = findSpecies(p.species)

    // Catálogo manual (si existe, tiene prioridad y evita duplicar)
    const manualTasks = (SPECIES_MONTHLY_TASKS[p.species] ?? []).filter(s => s.month === month)
    const manualKeys = new Set(manualTasks.map(t => `${t.type}|${t.title}`))

    for (const t of manualTasks)
      toInsert.push({ household_id: householdId, plant_id: p.id, type: t.type, title: `${p.name}: ${t.title}`, description: t.description, month, year })

    // Tareas derivadas de la ficha (evitando duplicados con el manual)
    if (species) {
      for (const t of speciesDerivedTasks(species, p, month)) {
        const key = `${t.type}|${t.title}`
        if (manualKeys.has(key)) continue
        toInsert.push({ household_id: householdId, plant_id: p.id, type: t.type, title: `${p.name}: ${t.title}`, description: t.description, month, year })
      }
    }
  }

  if (toInsert.length) await supabase.from("tasks").insert(toInsert)
}