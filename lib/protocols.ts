import type { Plant } from "./plants"

export type ProtocolKind =
  | "drought" | "overwater" | "pest" | "disease"
  | "physical" | "light" | "thermal"

export type Severity = "mild" | "moderate" | "severe"

export type Culprit =
  | "caterpillar" | "aphid" | "mealybug" | "spider_mite"
  | "whitefly" | "thrips" | "fungus_gnat" | "snail"
  | "powdery_mildew" | "downy_mildew" | "root_rot" | "leaf_spot" | "botrytis"
  | null

export const KIND_LABEL: Record<ProtocolKind, string> = {
  drought: "💧 Sequía",
  overwater: "🌊 Exceso de riego",
  pest: "🐛 Plaga",
  disease: "🦠 Enfermedad",
  physical: "💥 Daño físico",
  light: "☀️ Estrés de luz",
  thermal: "🌡️ Golpe térmico",
}

export const SEVERITY_LABEL: Record<Severity, string> = {
  mild: "Leve",
  moderate: "Moderado",
  severe: "Grave",
}

export const CULPRIT_LABEL: Record<string, string> = {
  caterpillar: "Oruga",
  aphid: "Pulgón",
  mealybug: "Cochinilla",
  spider_mite: "Araña roja",
  whitefly: "Mosca blanca",
  thrips: "Trips",
  fungus_gnat: "Mosca del sustrato",
  snail: "Caracol / babosa",
  powdery_mildew: "Oídio (polvo blanco)",
  downy_mildew: "Mildiu",
  root_rot: "Podredumbre de raíz",
  leaf_spot: "Manchas foliares",
  botrytis: "Botrytis (pelusilla gris)",
}

// Para problemas que NO tienen culpable
export const CULPRIT_BY_KIND: Record<ProtocolKind, string[]> = {
  drought: [],
  overwater: [],
  pest: ["caterpillar", "aphid", "mealybug", "spider_mite", "whitefly", "thrips", "fungus_gnat", "snail"],
  disease: ["powdery_mildew", "downy_mildew", "root_rot", "leaf_spot", "botrytis"],
  physical: [],
  light: [],
  thermal: [],
}

export type Step = {
  day: number
  title: string
  description: string
  type: "action" | "check"
}

export type Plan = {
  title: string
  summary: string
  donot: string
  steps: Step[]
}

export function buildPlan(kind: ProtocolKind, culprit: Culprit | null, severity: Severity): Plan {
  const base: Plan = {
    title: "", summary: "", donot: "",
    steps: [
      { day: 0, title: "Aislar la planta si es contagioso", description: "Sepárala del resto para evitar contagio.", type: "action" },
      { day: 0, title: "Inspeccionar", description: "Mira bien toda la planta (incluido el envés).", type: "action" },
    ],
  }

  if (kind === "drought") {
    base.title = "Recuperación por sequía"
    base.summary = "La planta se ha deshidratado. Vamos a rehidratarla con cuidado."
    base.donot = "No ahogues: el riego de rescate es puntual. No abones hasta que se recupere."
    base.steps = [
      { day: 0, title: "Riego de rescate", description: "Sumerge la maceta 20-30 min en agua templada. Deja escurrir 10-15 min.", type: "action" },
      { day: 1, title: "Pulverizar hojas", description: "Si no es suculenta, nebuliza agua sobre las hojas 1-2 veces al día.", type: "action" },
      { day: 2, title: "Sombra parcial", description: "Aleja del sol directo hasta que se recupere.", type: "action" },
      { day: 3, title: "Chequeo 1", description: "¿Las hojas recuperan turgencia? ¿Alguna caída nueva?", type: "check" },
      { day: 7, title: "Chequeo 2", description: "¿Brotes nuevos o mejoría visible?", type: "check" },
      { day: 14, title: "Cierre", description: "Sin síntomas nuevos durante una semana → recuperada.", type: "check" },
    ]
  } else if (kind === "overwater") {
    base.title = "Recuperación por exceso de riego"
    base.summary = "Las raíces se están asfixiando. Hay que secar el sustrato con cuidado."
    base.donot = "No riegues aunque las hojas se vean caídas (son síntomas del exceso, no de la sed)."
    base.steps = [
      { day: 0, title: "Retirar agua del plato", description: "Vacía cualquier agua acumulada bajo la maceta.", type: "action" },
      { day: 0, title: "Trasplantar de urgencia si es grave", description: "Si el sustrato está encharcado, saca la planta, quita sustrato mojado y ponla en sustrato seco unos días.", type: "action" },
      { day: 2, title: "Ventilación y calor", description: "Pon la planta en lugar cálido y ventilado para que el sustrato seque.", type: "action" },
      { day: 4, title: "Chequeo 1", description: "¿El sustrato ya está seco en profundidad?", type: "check" },
      { day: 7, title: "Chequeo 2", description: "¿Alguna hoja amarilla nueva? ¿El tallo está firme?", type: "check" },
      { day: 14, title: "Cierre", description: "Sin hojas nuevas amarillas ni mal olor → recuperada.", type: "check" },
    ]
  } else if (kind === "pest") {
    base.title = "Tratamiento contra plaga"
    base.donot = "En plantas comestibles NO uses insecticidas sistémicos. Lava bien antes de consumir."

    if (culprit === "caterpillar") {
      base.summary = "Orugas comiendo hojas. Son nocturnas y muy voraces."
      base.steps = [
        { day: 0, title: "Inspección nocturna", description: "Revisa envés y tallos al anochecer con linterna. Retira a mano (guantes).", type: "action" },
        { day: 0, title: "Poda de hojas dañadas", description: "Quita hojas con más del 50% dañado (máx. 1/3 del follaje).", type: "action" },
        { day: 1, title: "Tratamiento", description: "Aplica Bacillus thuringiensis (Bt) o jabón potásico según etiqueta.", type: "action" },
        { day: 3, title: "Chequeo 1", description: "¿Mordiscos nuevos o cacas negras? Sí → repetir tratamiento.", type: "check" },
        { day: 7, title: "Chequeo 2", description: "¿4 días sin daño nuevo?", type: "check" },
        { day: 14, title: "Cierre", description: "Sin daño durante una semana → recuperada.", type: "check" },
      ]
    } else if (culprit === "aphid") {
      base.summary = "Pulgón: puntitos verdes/negros en brotes tiernos."
      base.steps = [
        { day: 0, title: "Chorro de agua", description: "Pulveriza con agua a presión para tirar la mayoría.", type: "action" },
        { day: 1, title: "Jabón potásico", description: "Aplica en envés y brotes. Repite cada 3-4 días si persiste.", type: "action" },
        { day: 4, title: "Chequeo 1", description: "¿Sigue habiendo pulgón vivo en los brotes nuevos?", type: "check" },
        { day: 10, title: "Chequeo 2", description: "¿Brotes nuevos limpios?", type: "check" },
        { day: 14, title: "Cierre", description: "Sin pulgón en 7 días → recuperada.", type: "check" },
      ]
    } else if (culprit === "mealybug") {
      base.summary = "Cochinilla: bolitas algodonosas en axilas y envés."
      base.steps = [
        { day: 0, title: "Retirar con algodón y alcohol", description: "Humedece algodón en alcohol de 70° y limpia cada foco visible.", type: "action" },
        { day: 1, title: "Jabón potásico", description: "Aplica por toda la planta, insistiendo en axilas.", type: "action" },
        { day: 4, title: "Chequeo 1", description: "¿Aparecen nuevas bolitas algodonosas?", type: "check" },
        { day: 10, title: "Chequeo 2", description: "¿Sin cochinilla visible?", type: "check" },
        { day: 14, title: "Cierre", description: "Limpia una semana → recuperada.", type: "check" },
      ]
    } else if (culprit === "spider_mite") {
      base.summary = "Araña roja: puntitos amarillos en hojas y finas telarañas en el envés."
      base.steps = [
        { day: 0, title: "Aumentar humedad", description: "La araña roja odia la humedad. Pulveriza el follaje a diario.", type: "action" },
        { day: 1, title: "Jabón potásico", description: "Aplica cada 3-4 días, sobre todo en el envés.", type: "action" },
        { day: 4, title: "Chequeo 1", description: "¿Sigue habiendo telarañas o puntos amarillos nuevos?", type: "check" },
        { day: 10, title: "Chequeo 2", description: "¿Hojas nuevas limpias?", type: "check" },
        { day: 14, title: "Cierre", description: "Sin síntomas en 7 días → recuperada.", type: "check" },
      ]
    } else if (culprit === "whitefly") {
      base.summary = "Mosca blanca: al agitar la planta salen volando pequeños insectos blancos."
      base.steps = [
        { day: 0, title: "Trampas amarillas", description: "Coloca tiras adhesivas amarillas cerca de la planta.", type: "action" },
        { day: 1, title: "Jabón potásico", description: "Aplica cada 3-4 días, cubriendo envés.", type: "action" },
        { day: 4, title: "Chequeo 1", description: "¿Siguen volando al agitar?", type: "check" },
        { day: 10, title: "Chequeo 2", description: "¿Sin moscas en varios días?", type: "check" },
        { day: 14, title: "Cierre", description: "Sin presencia → recuperada.", type: "check" },
      ]
    } else if (culprit === "thrips") {
      base.summary = "Trips: marcas plateadas en hojas y deformación de brotes."
      base.steps = [
        { day: 0, title: "Trampas azules", description: "Los trips se pegan a tiras adhesivas azules.", type: "action" },
        { day: 1, title: "Jabón potásico + aceite de neem", description: "Mezcla y aplica cada 5-7 días.", type: "action" },
        { day: 5, title: "Chequeo 1", description: "¿Aparecen nuevas marcas plateadas?", type: "check" },
        { day: 12, title: "Chequeo 2", description: "¿Brotes nuevos sanos?", type: "check" },
        { day: 21, title: "Cierre", description: "Sin daños nuevos 7 días → recuperada.", type: "check" },
      ]
    } else if (culprit === "fungus_gnat") {
      base.summary = "Mosca del sustrato: mosquitas negras que vuelan del sustrato."
      base.steps = [
        { day: 0, title: "Dejar secar el sustrato", description: "Los huevos mueren en superficie seca.", type: "action" },
        { day: 0, title: "Trampas amarillas", description: "Para atrapar adultos.", type: "action" },
        { day: 1, title: "Arena o grava en superficie", description: "Capa de 1 cm para impedir que pongan huevos.", type: "action" },
        { day: 5, title: "Chequeo 1", description: "¿Siguen apareciendo mosquitas?", type: "check" },
        { day: 14, title: "Cierre", description: "Sin mosquitas 7 días → recuperada.", type: "check" },
      ]
    } else if (culprit === "snail") {
      base.summary = "Caracoles / babosas: agujeros grandes y rastros brillantes de baba."
      base.steps = [
        { day: 0, title: "Caza nocturna", description: "Linterna al anochecer y recoger a mano.", type: "action" },
        { day: 0, title: "Barreras", description: "Cáscara de huevo triturada o cerveza en plato al pie de la maceta.", type: "action" },
        { day: 3, title: "Chequeo 1", description: "¿Agujeros nuevos?", type: "check" },
        { day: 10, title: "Cierre", description: "Sin daños nuevos → recuperada.", type: "check" },
      ]
    } else {
      base.summary = "Plaga no identificada. Procedemos con tratamiento genérico seguro."
      base.steps = [
        { day: 0, title: "Inspección completa", description: "Mira envés, axilas y tallos con lupa si tienes.", type: "action" },
        { day: 1, title: "Jabón potásico genérico", description: "Aplica cada 3-4 días en envés y brotes.", type: "action" },
        { day: 4, title: "Chequeo 1", description: "¿Los síntomas avanzan o se frenan?", type: "check" },
        { day: 10, title: "Chequeo 2", description: "¿Identificas ahora al culpable? Si es así, pasa a protocolo específico.", type: "check" },
        { day: 14, title: "Cierre", description: "Sin síntomas en 7 días → recuperada.", type: "check" },
      ]
    }
  } else if (kind === "disease") {
    base.title = "Tratamiento de enfermedad"
    base.donot = "No uses fungicidas preventivos como cura. Mejor ventilación y poda."

    if (culprit === "powdery_mildew") {
      base.summary = "Oídio: polvo blanco sobre las hojas."
      base.steps = [
        { day: 0, title: "Poda de hojas afectadas", description: "Quita las hojas más blancas (máx. 1/3 del follaje).", type: "action" },
        { day: 0, title: "Mejorar ventilación", description: "Separa de otras plantas y mejora circulación de aire.", type: "action" },
        { day: 1, title: "Bicarbonato o azufre", description: "Pulveriza con agua + 1% bicarbonato sódico o fungicida de azufre.", type: "action" },
        { day: 4, title: "Chequeo 1", description: "¿Aparecen nuevos puntos blancos?", type: "check" },
        { day: 10, title: "Chequeo 2", description: "¿Hojas nuevas limpias?", type: "check" },
        { day: 14, title: "Cierre", description: "Sin oídio 7 días → recuperada.", type: "check" },
      ]
    } else if (culprit === "root_rot") {
      base.summary = "Podredumbre de raíz: la planta decae aunque el sustrato esté húmedo."
      base.steps = [
        { day: 0, title: "Sacar y revisar raíces", description: "Corta raíces negras/blandas. Deja solo raíces firmes.", type: "action" },
        { day: 0, title: "Trasplantar a sustrato nuevo", description: "Con buen drenaje. No riegues los primeros 2-3 días.", type: "action" },
        { day: 5, title: "Chequeo 1", description: "¿Hojas siguen cayendo o se estabilizan?", type: "check" },
        { day: 14, title: "Cierre", description: "Nuevo crecimiento → recuperada.", type: "check" },
      ]
    } else if (culprit === "leaf_spot") {
      base.summary = "Manchas foliares: manchas marrones/negras con borde amarillo."
      base.steps = [
        { day: 0, title: "Poda de hojas afectadas", description: "Quita las hojas con manchas.", type: "action" },
        { day: 0, title: "No mojar las hojas al regar", description: "Riega siempre al pie, por la mañana.", type: "action" },
        { day: 3, title: "Fungicida si progresa", description: "Aplica fungicida de cobre si siguen apareciendo manchas.", type: "action" },
        { day: 7, title: "Chequeo 1", description: "¿Manchas nuevas?", type: "check" },
        { day: 14, title: "Cierre", description: "Sin manchas nuevas 7 días → recuperada.", type: "check" },
      ]
    } else {
      base.summary = "Enfermedad no identificada. Procedemos con medidas generales."
      base.steps = [
        { day: 0, title: "Poda de partes afectadas", description: "Quita hojas/tallos enfermos (desinfecta las tijeras).", type: "action" },
        { day: 0, title: "Mejorar condiciones", description: "Ventilación, luz adecuada y riego al pie.", type: "action" },
        { day: 5, title: "Chequeo 1", description: "¿Progresan los síntomas?", type: "check" },
        { day: 14, title: "Cierre", description: "Estable una semana → recuperada.", type: "check" },
      ]
    }
  } else if (kind === "physical") {
    base.title = "Recuperación de daño físico"
    base.summary = "La planta ha sufrido un golpe, rotura o daño mecánico."
    base.donot = "No tires de los tejidos dañados."
    base.steps = [
      { day: 0, title: "Evaluar el daño", description: "Decide qué se puede conservar y qué hay que podar.", type: "action" },
      { day: 0, title: "Poda de partes irrecuperables", description: "Corte limpio con tijera desinfectada.", type: "action" },
      { day: 0, title: "Entutorar si es necesario", description: "Sujeta tallos rotos con una caña y cinta.", type: "action" },
      { day: 3, title: "Chequeo 1", description: "¿Los cortes cicatrizan? ¿Se pudre algo?", type: "check" },
      { day: 10, title: "Cierre", description: "Heridas selladas y sin pudrición → recuperada.", type: "check" },
    ]
  } else if (kind === "light") {
    base.title = "Ajuste de luz"
    base.summary = "La planta está mal ubicada respecto a la luz."
    base.donot = "No cambies bruscamente de sombra a sol directo."
    base.steps = [
      { day: 0, title: "Identificar el problema", description: "Quemaduras (manchas secas en hojas expuestas) o falta de luz (tallos largos, poco crecimiento).", type: "action" },
      { day: 1, title: "Mover gradualmente", description: "Cambia la ubicación paso a paso durante una semana.", type: "action" },
      { day: 7, title: "Chequeo 1", description: "¿Mejoran los síntomas?", type: "check" },
      { day: 21, title: "Cierre", description: "Crecimiento nuevo normal → recuperada.", type: "check" },
    ]
  } else if (kind === "thermal") {
    base.title = "Recuperación de golpe térmico"
    base.summary = "La planta ha sufrido helada u ola de calor."
    base.donot = "No podes hasta ver el alcance real del daño (puede tardar días)."
    base.steps = [
      { day: 0, title: "Alejar de la fuente de estrés", description: "Quitar del sol abrasador o del frío extremo.", type: "action" },
      { day: 0, title: "No regar en exceso", description: "La planta estresada no absorbe bien el agua.", type: "action" },
      { day: 3, title: "Esperar y observar", description: "No podes todavía: espera a ver qué tejido muere de verdad.", type: "action" },
      { day: 7, title: "Chequeo 1", description: "¿Qué partes están definitivamente muertas?", type: "check" },
      { day: 10, title: "Poda final", description: "Corta por encima del tejido vivo.", type: "action" },
      { day: 21, title: "Cierre", description: "Nuevo crecimiento → recuperada.", type: "check" },
    ]
  }

  // Ajuste por severidad: los graves añaden un chequeo temprano extra
  if (severity === "severe") {
    base.steps.unshift({ day: 0, title: "⚠ Aislamiento estricto", description: "Lejos de otras plantas. Material desinfectado.", type: "action" })
  }
  if (severity === "mild") {
    // Quita el paso 0 de aislamiento genérico para los leves
    base.steps = base.steps.filter((s, i) => !(i === 0 && s.title === "Aislar la planta si es contagioso"))
  }

  return base
}
export function currentRecoveryStep(plant: Plant): { plan: Plan; step: Step; day0: number; isDueToday: boolean } | null {
  if (!plant.recovery_started_at || !plant.recovery_kind) return null
  const plan = buildPlan(plant.recovery_kind as ProtocolKind, plant.recovery_culprit as Culprit, plant.recovery_severity as Severity)
  const idx = plant.recovery_step ?? 0
  const step = plan.steps[idx]
  if (!step) return null
  const day0 = Math.floor((Date.now() - new Date(plant.recovery_started_at).getTime()) / 86400000)
  return { plan, step, day0, isDueToday: step.type === "check" && day0 >= step.day }
}