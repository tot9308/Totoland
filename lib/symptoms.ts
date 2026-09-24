import type { ProtocolKind, Culprit, Severity } from "./protocols"
import { findSpecies } from "./species"
import { plantType } from "./recovery"
import type { Plant } from "./plants"

export type Cause = {
  id: string
  c: string
  fix: string
  tag: string
  kind: ProtocolKind | null
  culprit: Culprit | null
}

export type Option = { label: string; points: Record<string, number> }
export type Question = { q: string; options: Option[] }
export type Symptom = {
  id: string
  label: string
  causes: Cause[]
  questions: Question[]
}

const C = (
  id: string, c: string, fix: string, tag: string,
  kind: ProtocolKind | null, culprit: Culprit | null = null
): Cause => ({ id, c, fix, tag, kind, culprit })

export const SYMPTOMS: Symptom[] = [
  {
    id: "yellow", label: "🟡 Hojas amarillas",
    causes: [
      C("overwater", "Exceso de riego (raíz asfixiada)", "Deja secar más entre riegos; comprueba drenaje y vacía el plato.", "Exceso de riego", "overwater"),
      C("underwater", "Riego escaso o irregular", "Riega a fondo y mantén una pauta constante según la ficha.", "Sequía", "drought"),
      C("light", "Falta de luz", "Acerca a la ventana y gira la maceta cada semana.", "Luz", "light"),
      C("fert", "Falta de nutrientes", "Abona a dosis suaves en primavera-verano.", "Abono", null),
      C("mites", "Ácaros (punteado fino, telarañas)", "Sube la humedad y aplica jabón potásico, sobre todo en el envés.", "Plaga", "pest", "spider_mite"),
      C("natural", "Renovación natural de hojas viejas", "Si son 1-2 hojas bajas al mes, es normal: retíralas.", "Natural", null),
      C("new_leaves", "Hojas nuevas más claras (normal)", "Las hojas nuevas salen más claras y se oscurecen en pocos días.", "Natural", null),
    ],
    questions: [
      { q: "Toca el sustrato ahora: ¿cómo está?", options: [
        { label: "Húmedo o empapado", points: { overwater: 2 } },
        { label: "Seco del todo", points: { underwater: 2 } },
        { label: "Seco solo por arriba", points: { underwater: 1, light: 1 } },
        { label: "Normal, ni seco ni encharcado", points: { fert: 1, light: 1 } },
      ]},
      { q: "¿Qué hojas amarillean primero?", options: [
        { label: "Las de abajo (las viejas)", points: { natural: 2, overwater: 1 } },
        { label: "Las de arriba o brotes nuevos", points: { fert: 2, light: 1, new_leaves: 1 } },
        { label: "Un poco por todas partes", points: { overwater: 1, underwater: 1 } },
        { label: "Con punteado fino o telarañas en el envés", points: { mites: 3 } },
      ]},
      { q: "¿Cómo va el riego últimamente?", options: [
        { label: "Riego de más o el plato queda con agua", points: { overwater: 2 } },
        { label: "Se me olvida o alargo mucho", points: { underwater: 2 } },
        { label: "Sigo la pauta de la ficha", points: { fert: 1, natural: 1 } },
      ]},
      { q: "¿Cuánta luz recibe donde está?", options: [
        { label: "Poca: lejos de ventana o pasillo", points: { light: 2 } },
        { label: "Media: ventana sin sol directo", points: { light: 1, fert: 1 } },
        { label: "Buena: cerca de ventana luminosa", points: { natural: 1, fert: 1 } },
      ]},
    ],
  },
  {
    id: "tips", label: "🟤 Puntas o bordes secos",
    causes: [
      C("dry_air", "Ambiente seco (calefacción o aire)", "Sube la humedad: pulveriza, plato con guijarros o humidificador.", "Ambiente", null),
      C("salts", "Sales del agua del grifo", "Usa agua reposada 24 h, filtrada o de lluvia.", "Agua", null),
      C("irregular", "Riego irregular (sed puntual)", "Mantén el intervalo constante; no dejes secar de más.", "Riego", "drought"),
      C("fert_excess", "Exceso de abono", "Enjuaga el sustrato con abundante agua y baja la dosis.", "Abono", null),
    ],
    questions: [
      { q: "¿Dónde seca exactamente?", options: [
        { label: "Solo las puntas", points: { dry_air: 2, salts: 1 } },
        { label: "Bordes enteros de la hoja", points: { irregular: 2, fert_excess: 1 } },
        { label: "Punta y borde a la vez, crujiente", points: { salts: 1, irregular: 1, dry_air: 1 } },
      ]},
      { q: "¿Hay calefacción o aire seco cerca?", options: [
        { label: "Sí, radiador o estufa cerca", points: { dry_air: 2 } },
        { label: "Aire acondicionado o corriente", points: { dry_air: 2 } },
        { label: "No, ambiente normal", points: { salts: 1, irregular: 1 } },
      ]},
      { q: "¿Con qué agua riegas?", options: [
        { label: "Del grifo, directa", points: { salts: 2 } },
        { label: "Reposada, filtrada o de lluvia", points: { irregular: 1, fert_excess: 1 } },
      ]},
      { q: "¿Abonas con frecuencia o dosis altas?", options: [
        { label: "Sí, cada poco o dosis plena", points: { fert_excess: 2 } },
        { label: "Lo justo o nada", points: { irregular: 1, dry_air: 1 } },
      ]},
    ],
  },
  {
    id: "droop", label: "🥀 Mustia o caída",
    causes: [
      C("thirsty", "Sed aguda", "Riego profundo o inmersión 10-15 min si está seco del todo.", "Sequía", "drought"),
      C("root_rot", "Raíz podrida por encharcamiento", "Saca del tiesto, corta raíces negras y trasplanta a sustrato seco.", "Exceso de riego", "overwater"),
      C("cold", "Golpe de frío o corriente", "Aleja del frío; no riegues de más mientras se recupera.", "Ambiente", "thermal"),
      C("heat", "Golpe de calor o sol fuerte", "Mueve a sombra y refresca el ambiente sin encharcar.", "Ambiente", "thermal"),
    ],
    questions: [
      { q: "Toca el sustrato: ¿cómo está?", options: [
        { label: "Seco del todo, maceta ligera", points: { thirsty: 3 } },
        { label: "Húmedo o empapado", points: { root_rot: 3 } },
        { label: "Normal", points: { cold: 1, heat: 1 } },
      ]},
      { q: "¿Pasó de golpe o poco a poco?", options: [
        { label: "De un día para otro", points: { cold: 2, heat: 2, thirsty: 1 } },
        { label: "Poco a poco en varios días", points: { root_rot: 2, thirsty: 1 } },
      ]},
      { q: "¿Cambió de sitio o clima recientemente?", options: [
        { label: "Sí: frío, ventana abierta o corriente", points: { cold: 2 } },
        { label: "Sí: sol directo u ola de calor", points: { heat: 2 } },
        { label: "No, mismo sitio", points: { thirsty: 1, root_rot: 1 } },
      ]},
    ],
  },
  {
    id: "pests", label: "🍯 Pegajoso, bichos o bolitas",
    causes: [
      C("cochinilla", "Cochinilla (bolitas algodonosas o escudos)", "Retira con bastoncillo con alcohol; jabón potásico al atardecer, repite en 5 días.", "Plaga", "pest", "mealybug"),
      C("pulgon", "Pulgón (bichitos verdes o negros)", "Chorro de agua y jabón potásico cada 3 días hasta limpiar.", "Plaga", "pest", "aphid"),
      C("moscablanca", "Mosca blanca (vuela al tocar)", "Trampas amarillas y jabón potásico en el envés.", "Plaga", "pest", "whitefly"),
      C("arana", "Araña roja (telarañas finas y punteado)", "Sube la humedad y aplica acaricida; revisa el envés.", "Plaga", "pest", "spider_mite"),
      C("sustrato_mosca", "Mosca del sustrato (mosquitas de la tierra)", "Deja secar la capa superior; trampas amarillas pegajosas.", "Plaga", "pest", "fungus_gnat"),
    ],
    questions: [
      { q: "¿Qué ves exactamente?", options: [
        { label: "Bolitas blancas algodonosas o escudos marrones", points: { cochinilla: 3 } },
        { label: "Bichitos verdes o negros en brotes y envés", points: { pulgon: 3 } },
        { label: "Mosquitas que vuelan al tocar la planta", points: { moscablanca: 2, sustrato_mosca: 1 } },
        { label: "Mosquitas que salen de la tierra al regar", points: { sustrato_mosca: 3 } },
        { label: "Telarañas finas y punteado amarillo", points: { arana: 3 } },
      ]},
      { q: "¿Dónde se concentran?", options: [
        { label: "Tallo y uniones de hojas", points: { cochinilla: 2 } },
        { label: "Brotes tiernos y envés", points: { pulgon: 2, arana: 1 } },
        { label: "Solo la superficie de la tierra", points: { sustrato_mosca: 2 } },
        { label: "Por toda la planta", points: { moscablanca: 1, arana: 1 } },
      ]},
      { q: "¿Hay melaza pegajosa en las hojas?", options: [
        { label: "Sí, brillo pegajoso", points: { cochinilla: 1, pulgon: 1, moscablanca: 1 } },
        { label: "No", points: { arana: 1, sustrato_mosca: 1 } },
      ]},
    ],
  },
  {
    id: "spots", label: "🕳️ Manchas en las hojas",
    causes: [
      C("fungal", "Hongo (mancha marrón con halo amarillo)", "Retira hojas afectadas, no mojes la hoja y aplica fungicida.", "Enfermedad", "disease", "leaf_spot"),
      C("sunburn", "Quemadura de sol (mancha seca marrón clara)", "Filtra el sol del mediodía; acostumbra al sol poco a poco.", "Luz", "light"),
      C("edema", "Edema por encharcamiento (bultos corchosos)", "Riega menos y mejora la ventilación.", "Exceso de riego", "overwater"),
      C("cold_spot", "Daño por frío (manchas oscuras blandas)", "Aleja del frío y retira lo muy dañado.", "Ambiente", "thermal"),
      C("variegation", "Variegación (no es enfermedad)", "Si el patrón es regular y simétrico, es parte de la planta.", "Natural", null),
    ],
    questions: [
      { q: "¿Cómo son las manchas?", options: [
        { label: "Marrones con borde amarillo", points: { fungal: 3 } },
        { label: "Secas, marrón claro, en zona soleada", points: { sunburn: 3 } },
        { label: "Bultos o zonas corchosas por el envés", points: { edema: 2 } },
        { label: "Oscuras, blandas o acuosas", points: { cold_spot: 2, fungal: 1 } },
        { label: "Patrón regular y simétrico, igual que otras hojas", points: { variegation: 3 } },
      ]},
      { q: "¿Mojas las hojas al regar o pulverizar?", options: [
        { label: "Sí, quedan mojadas", points: { fungal: 2 } },
        { label: "No, solo el sustrato", points: { sunburn: 1, edema: 1 } },
      ]},
      { q: "¿Le da sol directo o ha pasado frío?", options: [
        { label: "Sol directo del mediodía", points: { sunburn: 2 } },
        { label: "Frío o corriente reciente", points: { cold_spot: 2 } },
        { label: "Ninguno de los dos", points: { fungal: 1, edema: 1 } },
      ]},
    ],
  },
  {
    id: "powder", label: "⚪ Polvo blanco en hojas",
    causes: [
      C("mildew", "Oídio (hongo, polvo blanco)", "Aísla, mejora la ventilación, retira hojas muy afectadas y aplica azufre o fungicida.", "Enfermedad", "disease", "powdery_mildew"),
      C("salts_white", "Costra de sales (agua dura)", "Frota con agua con unas gotas de vinagre; riega con agua blanda.", "Agua", null),
      C("dust", "Polvo ambiental", "Limpia con paño húmedo; revisa si se acumula por la zona.", "Natural", null),
    ],
    questions: [
      { q: "¿Se quita al frotar con el dedo?", options: [
        { label: "Sí, sale como polvo", points: { dust: 3, salts_white: 1 } },
        { label: "No, está adherido o mancha la hoja", points: { mildew: 2, salts_white: 2 } },
      ]},
      { q: "¿Dónde aparece primero?", options: [
        { label: "Hojas nuevas y brotes", points: { mildew: 3 } },
        { label: "Bordes de hojas viejas, con relieve", points: { salts_white: 3 } },
        { label: "Por toda la hoja, aspecto seco", points: { dust: 2 } },
      ]},
      { q: "¿Cómo es la ventilación?", options: [
        { label: "Poca, planta apretada con otras", points: { mildew: 2 } },
        { label: "Buena, sitio aireado", points: { salts_white: 1, dust: 1 } },
      ]},
    ],
  },
  {
    id: "deformed", label: "🌱 Brotes deformes o arrugados",
    causes: [
      C("thrips_d", "Trips (marcas plateadas, brotes deformes)", "Trampas azules y jabón potásico + neem cada 5-7 días.", "Plaga", "pest", "thrips"),
      C("aphid_d", "Pulgón en brotes (deformación típica)", "Chorro de agua y jabón potásico cada 3 días.", "Plaga", "pest", "aphid"),
      C("humidity", "Falta de humedad ambiental", "Sube humedad con bandeja de guijarros o humidificador.", "Ambiente", null),
      C("hard_water", "Agua dura / pH inadecuado", "Usa agua filtrada o de lluvia; revisa el sustrato.", "Agua", null),
      C("fert_excess_d", "Exceso de abono (sales)", "Enjuaga el sustrato con abundante agua y baja la dosis.", "Abono", null),
    ],
    questions: [
      { q: "¿Ves bichos o marcas?", options: [
        { label: "Puntitos alargados o marcas plateadas", points: { thrips_d: 3 } },
        { label: "Bichitos en brotes tiernos", points: { aphid_d: 3 } },
        { label: "No veo nada", points: { humidity: 1, hard_water: 1, fert_excess_d: 1 } },
      ]},
      { q: "¿Cómo son las hojas nuevas?", options: [
        { label: "Deformadas, rizadas y pequeñas", points: { thrips_d: 2, aphid_d: 2 } },
        { label: "Arrugadas y con bordes marrones", points: { humidity: 2, hard_water: 1 } },
        { label: "Con punta quemada y color extraño", points: { fert_excess_d: 2 } },
      ]},
      { q: "¿Qué humedad y agua usas?", options: [
        { label: "Ambiente seco, con calefacción", points: { humidity: 2 } },
        { label: "Agua del grifo, con mucha cal", points: { hard_water: 2 } },
        { label: "Abono reciente o dosis altas", points: { fert_excess_d: 2 } },
        { label: "Todo normal", points: { thrips_d: 1, aphid_d: 1 } },
      ]},
    ],
  },
  {
    id: "softstem", label: "🪵 Tallo blando u oscuro",
    causes: [
      C("rot_stem", "Podredumbre (hongo por encharcamiento)", "Corta el tallo hasta zona sana, deja secar la herida y trasplanta a sustrato seco.", "Enfermedad", "disease", "root_rot"),
      C("overwater_s", "Exceso de riego", "Deja secar y revisa drenaje; vacía el plato.", "Exceso de riego", "overwater"),
      C("cold_s", "Daño por frío", "Aleja del frío; corta lo negro.", "Ambiente", "thermal"),
    ],
    questions: [
      { q: "¿Desde dónde está blando?", options: [
        { label: "Base del tallo, junto al sustrato", points: { rot_stem: 3 } },
        { label: "A media altura, tras un golpe o poda", points: { rot_stem: 1, cold_s: 1 } },
        { label: "Toda la planta, sin zona concreta", points: { overwater_s: 2 } },
      ]},
      { q: "¿Cómo está el sustrato?", options: [
        { label: "Encharcado o huele mal", points: { rot_stem: 3 } },
        { label: "Normal", points: { cold_s: 2 } },
      ]},
      { q: "¿Hubo frío o corriente?", options: [
        { label: "Sí, reciente", points: { cold_s: 2 } },
        { label: "No", points: { rot_stem: 1, overwater_s: 1 } },
      ]},
    ],
  },
  {
    id: "noflower", label: "🌸 No florece o caen flores",
    causes: [
      C("light_f", "Falta de luz (la mayoría necesitan mucha)", "Mueve a zona más luminosa o añade luz artificial.", "Luz", "light"),
      C("fert_f", "Exceso de nitrógeno o falta de fósforo", "Cambia a abono rico en fósforo (floración).", "Abono", null),
      C("pot_f", "Maceta mal dimensionada (raíz apretada o suelta)", "Muchas florecen mejor con raíz justa; otras al contrario.", "Sustrato", null),
      C("rest_f", "Reposo estacional", "Muchas plantas necesitan un invierno fresco para florecer.", "Natural", null),
    ],
    questions: [
      { q: "¿Ha florecido antes?", options: [
        { label: "Sí, y este año no", points: { rest_f: 1, fert_f: 1 } },
        { label: "Nunca, es joven", points: { light_f: 1, pot_f: 1 } },
        { label: "Florece pero caen rápido", points: { fert_f: 2, light_f: 1 } },
      ]},
      { q: "¿Qué luz recibe?", options: [
        { label: "Poca, semisombra o interior", points: { light_f: 3 } },
        { label: "Bastante, cerca de ventana", points: { fert_f: 1, rest_f: 1 } },
        { label: "Sol directo muchas horas", points: { fert_f: 2 } },
      ]},
      { q: "¿Qué abono usas?", options: [
        { label: "Equilibrado o rico en nitrógeno", points: { fert_f: 3 } },
        { label: "Rico en fósforo / floración", points: { light_f: 1, rest_f: 1 } },
        { label: "No abono", points: { fert_f: 2 } },
      ]},
    ],
  },
  {
    id: "drop", label: "🍂 Caída de hojas",
    causes: [
      C("shock", "Estrés por cambio de ubicación o trasplante", "Paciencia 2-3 semanas; no la muevas más ni abones ahora.", "Estrés", null),
      C("overwater", "Exceso de riego", "Deja secar y revisa el drenaje; huele el sustrato por si huele a podrido.", "Exceso de riego", "overwater"),
      C("light_low", "Falta de luz", "Acerca a la ventana más luminosa disponible.", "Luz", "light"),
      C("draft", "Corrientes de aire", "Aleja de puertas, ventanas y salidas de aire.", "Ambiente", "thermal"),
    ],
    questions: [
      { q: "¿Cuándo empezó la caída?", options: [
        { label: "Al traerla, moverla o trasplantarla", points: { shock: 3 } },
        { label: "Sin cambio de sitio", points: { overwater: 1, light_low: 1, draft: 1 } },
      ]},
      { q: "¿Cómo caen las hojas?", options: [
        { label: "Amarillean y caen", points: { overwater: 2, light_low: 1 } },
        { label: "Verdes y crujientes", points: { draft: 2, shock: 1 } },
        { label: "Verdes y blandas", points: { overwater: 1, shock: 1 } },
      ]},
      { q: "¿Cómo están el sustrato y la luz?", options: [
        { label: "Sustrato húmedo casi siempre", points: { overwater: 2 } },
        { label: "Sitio oscuro o lejos de ventana", points: { light_low: 2 } },
        { label: "Corriente o puerta cerca", points: { draft: 2 } },
        { label: "Todo normal", points: { shock: 1 } },
      ]},
    ],
  },
  {
    id: "nogrow", label: "🐌 No crece o crece rara",
    causes: [
      C("rest", "Reposo invernal (normal)", "De noviembre a febrero es normal: no abones ni fuerces.", "Natural", null),
      C("light_low", "Falta de luz", "Más luz: acerca a ventana o añade luz artificial.", "Luz", "light"),
      C("pot", "Maceta inadecuada (grande o agotada)", "Trasplanta en primavera a maceta justa con sustrato fresco.", "Sustrato", null),
      C("fert_low", "Falta de abono", "Abona a dosis suaves cada 15 días en temporada.", "Abono", null),
    ],
    questions: [
      { q: "¿En qué estación estamos?", options: [
        { label: "Otoño-invierno (nov-feb)", points: { rest: 3 } },
        { label: "Primavera-verano", points: { light_low: 1, fert_low: 1, pot: 1 } },
      ]},
      { q: "¿Cómo crece cuando lo hace?", options: [
        { label: "Estirada, pálida y con hojas pequeñas", points: { light_low: 3 } },
        { label: "Hojas normales pero muy pocas", points: { fert_low: 2, pot: 1 } },
        { label: "Nada en absoluto", points: { pot: 2, rest: 1 } },
      ]},
      { q: "¿Cuánto lleva sin trasplantar?", options: [
        { label: "Más de 2 años o raíces por el drenaje", points: { pot: 3 } },
        { label: "Menos de 2 años", points: { fert_low: 1, light_low: 1 } },
      ]},
    ],
  },
]

// ---------- Contexto de la planta ----------
// Devuelve puntos iniciales por causa según la especie, el último riego, el plato, etc.
export function contextScores(plant: Plant | undefined): Record<string, number> {
  if (!plant) return {}
  const s: Record<string, number> = {}

  // Por tipo de planta (reutiliza la clasificación del protocolo)
  const card = findSpecies(plant.species ?? "")
  const type = plantType(card, plant.plant_type)
  if (type === "succulent" || type === "mediterranean") {
    s.overwater = (s.overwater ?? 0) + 2
    s.root_rot = (s.root_rot ?? 0) + 2
    s.underwater = (s.underwater ?? 0) - 1
  }
  if (type === "tropical") {
    s.dry_air = (s.dry_air ?? 0) + 1
    s.humidity = (s.humidity ?? 0) + 1
    s.underwater = (s.underwater ?? 0) + 1
  }
  if (type === "epiphyte") {
    s.overwater = (s.overwater ?? 0) + 1
    s.root_rot = (s.root_rot ?? 0) + 1
  }

  // Por último riego
  if (plant.last_watered_at) {
    const days = Math.floor((Date.now() - new Date(plant.last_watered_at).getTime()) / 86400000)
    if (days <= 1) {
      s.underwater = (s.underwater ?? 0) - 2
      s.thirsty = (s.thirsty ?? 0) - 2
      s.overwater = (s.overwater ?? 0) + 1
    }
    if (days >= 15) {
      s.underwater = (s.underwater ?? 0) + 2
      s.thirsty = (s.thirsty ?? 0) + 2
    }
    if (days >= 5 && days <= 12) {
      s.irregular = (s.irregular ?? 0) + 1
    }
  }

  // Por maceta con plato
  if (plant.has_saucer) {
    s.overwater = (s.overwater ?? 0) + 1
    s.root_rot = (s.root_rot ?? 0) + 1
    s.edema = (s.edema ?? 0) + 1
  }

  return s
}

// ---------- Gravedad ----------
export const SEVERITY_QUESTION = {
  q: "¿Cuánto le afecta ahora mismo?",
  options: [
    { label: "A 1-2 hojas, no parece avanzar", sev: "mild" as Severity },
    { label: "A varias ramas o brotes, avanza despacio", sev: "moderate" as Severity },
    { label: "A toda la planta o avanza rápido", sev: "severe" as Severity },
  ],
}