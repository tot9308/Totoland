export type ProtocolKind =
  | "drought" | "overwater" | "pest" | "disease"
  | "physical" | "light" | "thermal" | "fertilizer_burn"

export type Severity = "mild" | "moderate" | "severe"

export type Culprit =
  | "caterpillar" | "aphid" | "mealybug" | "mealybug_root" | "scale_insect"
  | "spider_mite" | "whitefly" | "thrips" | "fungus_gnat" | "snail" | "leaf_miner"
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
  fertilizer_burn: "🧂 Exceso de abono / sales",
}

export const SEVERITY_LABEL: Record<Severity, string> = {
  mild: "Leve",
  moderate: "Moderado",
  severe: "Grave",
}

export const CULPRIT_LABEL: Record<string, string> = {
  caterpillar: "Oruga",
  aphid: "Pulgón",
  mealybug: "Cochinilla de hojas",
  mealybug_root: "Cochinilla de raíz",
  scale_insect: "Escama (cochinilla acorazada)",
  spider_mite: "Araña roja",
  whitefly: "Mosca blanca",
  thrips: "Trips",
  fungus_gnat: "Mosca del sustrato",
  snail: "Caracol / babosa",
  leaf_miner: "Minador de hojas (galerías)",
  powdery_mildew: "Oídio (polvo blanco)",
  downy_mildew: "Mildiu",
  root_rot: "Podredumbre de raíz",
  leaf_spot: "Manchas foliares",
  botrytis: "Botrytis (pelusilla gris)",
}

export const CULPRIT_BY_KIND: Record<ProtocolKind, string[]> = {
  drought: [],
  overwater: [],
  pest: [
    "caterpillar", "aphid", "mealybug", "mealybug_root", "scale_insect",
    "spider_mite", "whitefly", "thrips", "fungus_gnat", "snail", "leaf_miner",
  ],
  disease: ["powdery_mildew", "downy_mildew", "root_rot", "leaf_spot", "botrytis"],
  physical: [],
  light: [],
  thermal: [],
  fertilizer_burn: [],
}

// Advertencias que aplican a CUALQUIER protocolo (fitotoxicidad, incompatibilidades)
export const TRANSVERSAL_WARNINGS: string[] = [
  "Jabón potásico: aplicar al atardecer. En helechos, calatheas, carnívoras y suculentas puede quemar la hoja o quitar la pruina — prueba primero en una hoja.",
  "Azufre y aceite (neem): NUNCA en las mismas 2 semanas. Azufre nunca por encima de 30 °C.",
  "No apliques tratamientos con sol directo: riesgo de quemadura.",
  "En plantas comestibles: nada de insecticidas sistémicos. Lava antes de consumir.",
  "Tras aplicar un tratamiento, no abones hasta que la planta esté recuperada.",
]

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
  } else if (kind === "fertilizer_burn") {
    base.title = "Recuperación por exceso de abono / sales"
    base.summary = "Las puntas quemadas y la costra blanca en el sustrato indican exceso de sales."
    base.donot = "No abones en varias semanas. Nada de 'abono de rescate': empeoraría."
    base.steps = [
      { day: 0, title: "Riego de lavado", description: "Riega con 3-4 veces el volumen de la maceta y deja drenar del todo. Repite 2 veces en el día.", type: "action" },
      { day: 0, title: "Retirar costra de sales", description: "Si hay costra blanca en superficie, retírala y pon sustrato fresco encima.", type: "action" },
      { day: 0, title: "Pausa total de abonado", description: "Nada de abono hasta el día 21 como mínimo.", type: "action" },
      { day: 7, title: "Chequeo 1", description: "¿Puntas nuevas sin quemar? ¿La planta firme?", type: "check" },
      { day: 14, title: "Chequeo 2", description: "¿Brotación nueva sana sin puntas necrosadas?", type: "check" },
      { day: 21, title: "Cierre", description: "Hojas nuevas sin puntas quemadas 7 días → recuperada. Reanuda abono a media dosis más adelante.", type: "check" },
    ]
  } else if (kind === "pest") {
    base.title = "Tratamiento contra plaga"
    base.donot = "En plantas comestibles NO uses insecticidas sistémicos. Lava bien antes de consumir. Si ves hormigas, contrólalas también: 'cultivan' pulgón y cochinilla."

    if (culprit === "caterpillar") {
      base.summary = "Orugas comiendo hojas. Son nocturnas y muy voraces."
      base.steps = [
        { day: 0, title: "Inspección nocturna", description: "Revisa envés y tallos al anochecer con linterna. Retira a mano (guantes). Mira también huevos: puntitos en el envés.", type: "action" },
        { day: 0, title: "Poda de hojas dañadas", description: "Quita hojas con más del 50% dañado (máx. 1/3 del follaje).", type: "action" },
        { day: 1, title: "Tratamiento", description: "Aplica Bacillus thuringiensis (Bt kurstaki) al atardecer o jabón potásico según etiqueta. Bt solo actúa por ingestión.", type: "action" },
        { day: 3, title: "Chequeo 1", description: "¿Mordiscos nuevos o cacas negras? Sí → repetir tratamiento.", type: "check" },
        { day: 4, title: "Reaplicar Bt si hay mordiscos nuevos", description: "Repite el tratamiento completo (las orugas nuevas necesitan ingerirlo).", type: "action" },
        { day: 7, title: "Chequeo 2", description: "¿4 días sin daño nuevo?", type: "check" },
        { day: 10, title: "Reaplicar Bt si persiste", description: "Última reaplicación si aún hay señal.", type: "action" },
        { day: 14, title: "Cierre", description: "Sin daño durante una semana → recuperada.", type: "check" },
      ]
    } else if (culprit === "aphid") {
      base.summary = "Pulgón: puntitos verdes/negros en brotes tiernos. Suele ir acompañado de hormigas."
      base.steps = [
        { day: 0, title: "Chorro de agua + revisar hormigas", description: "Pulveriza con agua a presión para tirar la mayoría. Si ves hormigas, pon cebo o trampa.", type: "action" },
        { day: 1, title: "Jabón potásico", description: "Aplica en envés y brotes al atardecer.", type: "action" },
        { day: 4, title: "Chequeo 1 + reaplicar", description: "¿Sigue habiendo pulgón vivo? Reaplica jabón potásico.", type: "check" },
        { day: 7, title: "Reaplicar jabón", description: "Reaplicación programada para romper el ciclo.", type: "action" },
        { day: 10, title: "Chequeo 2", description: "¿Brotes nuevos limpios?", type: "check" },
        { day: 14, title: "Cierre", description: "Sin pulgón en 7 días → recuperada.", type: "check" },
      ]
    } else if (culprit === "mealybug") {
      base.summary = "Cochinilla de hojas: bolitas algodonosas en axilas y envés. A veces asociada a hormigas."
      base.donot = "El alcohol puede quemar hojas sensibles: prueba primero en UNA hoja y espera 24 h."
      base.steps = [
        { day: 0, title: "Prueba de alcohol en una hoja", description: "Mójala con algodón y alcohol de 70°. Espera 24 h antes de hacer toda la planta.", type: "action" },
        { day: 0, title: "Controlar hormigas si las hay", description: "Sin quitar las hormigas, la cochinilla vuelve. Cebo o barrera.", type: "action" },
        { day: 1, title: "Retirar focos con algodón y alcohol", description: "Limpia cada bolita visible en axilas y envés.", type: "action" },
        { day: 1, title: "Jabón potásico (al atardecer)", description: "Aplica toda la planta, insistiendo en axilas.", type: "action" },
        { day: 4, title: "Chequeo 1", description: "¿Aparecen nuevas bolitas algodonosas?", type: "check" },
        { day: 7, title: "Reaplicar jabón potásico", description: "Reaplicación programada (los crawlers siguen eclosionando).", type: "action" },
        { day: 14, title: "Chequeo 2", description: "¿Sin cochinilla visible?", type: "check" },
        { day: 21, title: "Reaplicar si reaparece", description: "Última reaplicación si hay señal.", type: "action" },
        { day: 28, title: "Cierre", description: "Cuatro semanas sin nuevas bolitas → recuperada.", type: "check" },
      ]
    } else if (culprit === "mealybug_root") {
      base.summary = "Cochinilla de raíz: algodón blanco en las raíces. Se ve al sacar la planta o por parón de crecimiento."
      base.donot = "Aísla estrictamente: se pasa a las macetas vecinas por el agua de drenaje. Limpia la zona donde estaba."
      base.steps = [
        { day: 0, title: "Sacar y lavar raíces", description: "Retira todo el sustrato con agua templada. Deja las raíces al descubierto.", type: "action" },
        { day: 0, title: "Retirar todo el algodón", description: "Con pinzas o algodón con alcohol, quita cada foco visible.", type: "action" },
        { day: 0, title: "Trasplantar a sustrato nuevo", description: "Maceta limpia, sustrato nuevo, sin agua los primeros días.", type: "action" },
        { day: 3, title: "Reanudar riego muy moderado", description: "Primer riego desde el trasplante. Poco.", type: "action" },
        { day: 7, title: "Chequeo 1", description: "¿Brotes nuevos? ¿Sin algodón visible en superficie?", type: "check" },
        { day: 14, title: "Chequeo 2", description: "¿La planta sigue parada o ya crece?", type: "check" },
        { day: 21, title: "Cierre", description: "Sin nuevas señales y con brote nuevo → recuperada.", type: "check" },
      ]
    } else if (culprit === "scale_insect") {
      base.summary = "Escama: escudos marrones/duros pegados a tallos y hojas. Los 'crawlers' eclosionan de forma escalonada: hay que insistir varias semanas."
      base.donot = "No la des por resuelta en 2 semanas: los huevos que quedan van eclosionando. Cierra solo tras 4-6 semanas sin nuevos escudos."
      base.steps = [
        { day: 0, title: "Raspar cada escudo", description: "Con un palillo o cepillo suave, retira cada escudo visible. En hojas muy afectadas, corta y tira.", type: "action" },
        { day: 0, title: "Jabón potásico o neem", description: "Aplica al atardecer, cubriendo tallos y envés.", type: "action" },
        { day: 7, title: "Inspección semanal + reaplicar", description: "Busca escudos nuevos (crawlers). Reaplica jabón o neem.", type: "action" },
        { day: 14, title: "Inspección semanal + reaplicar", description: "Igual: raspar si hay nuevos, reaplicar tratamiento.", type: "action" },
        { day: 21, title: "Inspección semanal", description: "¿Escudos nuevos esta semana?", type: "check" },
        { day: 28, title: "Inspección semanal", description: "¿Sin nuevos desde la última vez?", type: "check" },
        { day: 35, title: "Inspección semanal", description: "Última inspección de rutina.", type: "check" },
        { day: 42, title: "Cierre", description: "Seis semanas sin nuevos escudos → recuperada.", type: "check" },
      ]
    } else if (culprit === "spider_mite") {
      base.summary = "Araña roja: puntitos amarillos y finas telarañas en el envés. Odia la humedad, pero no mojes la planta a diario o tendrás hongos."
      base.donot = "No pulverices la planta a diario: sube la humedad del ENTORNO (bandeja con guijarros), no empapes el follaje o vendrán oídio y botrytis."
      base.steps = [
        { day: 0, title: "Humedad del entorno", description: "Bandeja con guijarros y agua, o grupo con otras plantas. NO pulverizar la planta directamente a diario.", type: "action" },
        { day: 0, title: "Aislar la planta", description: "Se pasa con facilidad a vecinas.", type: "action" },
        { day: 1, title: "Jabón potásico (al atardecer)", description: "Aplica en el envés. Prueba antes si la planta es sensible.", type: "action" },
        { day: 3, title: "Chequeo corto", description: "¿Telarañas nuevas? (Los huevos eclosionan en ~3 días.)", type: "check" },
        { day: 4, title: "Reaplicar jabón", description: "Obligatorio para romper el ciclo, no opcional.", type: "action" },
        { day: 7, title: "Reaplicar jabón", description: "Tercera aplicación.", type: "action" },
        { day: 10, title: "Reaplicar jabón", description: "Cuarta aplicación. Ya cubres todo el ciclo de huevos.", type: "action" },
        { day: 14, title: "Chequeo final", description: "¿Hojas nuevas limpias 7 días?", type: "check" },
        { day: 21, title: "Cierre", description: "Sin síntomas 10 días → recuperada.", type: "check" },
      ]
    } else if (culprit === "whitefly") {
      base.summary = "Mosca blanca: al agitar la planta salen volando pequeños insectos blancos."
      base.steps = [
        { day: 0, title: "Trampas amarillas", description: "Coloca tiras adhesivas amarillas cerca de la planta.", type: "action" },
        { day: 1, title: "Jabón potásico (al atardecer)", description: "Cubre envés y brotes.", type: "action" },
        { day: 4, title: "Chequeo 1 + reaplicar", description: "¿Siguen volando al agitar? Reaplica.", type: "check" },
        { day: 7, title: "Reaplicar jabón", description: "Reaplicación programada.", type: "action" },
        { day: 10, title: "Chequeo 2", description: "¿Sin moscas en varios días?", type: "check" },
        { day: 14, title: "Cierre", description: "Sin presencia → recuperada.", type: "check" },
      ]
    } else if (culprit === "thrips") {
      base.summary = "Trips: marcas plateadas en hojas y deformación de brotes. Ciclo largo: 3 semanas mínimo."
      base.steps = [
        { day: 0, title: "Trampas azules", description: "Los trips se pegan a tiras adhesivas azules.", type: "action" },
        { day: 1, title: "Jabón potásico + aceite de neem", description: "Mezcla y aplica al atardecer.", type: "action" },
        { day: 5, title: "Chequeo 1 + reaplicar", description: "¿Nuevas marcas plateadas? Reaplica cada 5-7 días.", type: "check" },
        { day: 7, title: "Reaplicar neem", description: "Reaplicación programada.", type: "action" },
        { day: 12, title: "Reaplicar", description: "Sigue el ciclo de 5-7 días.", type: "action" },
        { day: 14, title: "Chequeo 2", description: "¿Brotes nuevos sanos?", type: "check" },
        { day: 21, title: "Cierre", description: "Sin daños nuevos 7 días → recuperada.", type: "check" },
      ]
    } else if (culprit === "fungus_gnat") {
      base.summary = "Mosca del sustrato: mosquitas negras que vuelan del sustrato. Se rompe el ciclo por sequedad."
      base.steps = [
        { day: 0, title: "Dejar secar el sustrato", description: "Los huevos mueren en superficie seca.", type: "action" },
        { day: 0, title: "Trampas amarillas", description: "Para atrapar adultos.", type: "action" },
        { day: 1, title: "Arena o grava en superficie", description: "Capa de 1 cm para impedir que pongan huevos.", type: "action" },
        { day: 5, title: "Chequeo 1", description: "¿Siguen apareciendo mosquitas?", type: "check" },
        { day: 7, title: "Si persiste → BTI (bits)", description: "Bacillus thuringiensis israelensis en el agua de riego. Rompe el ciclo de las larvas que la arena no alcanza.", type: "action" },
        { day: 14, title: "Chequeo 2", description: "¿Sin mosquitas 7 días?", type: "check" },
        { day: 21, title: "Cierre", description: "Sin mosquitas 2 semanas → recuperada.", type: "check" },
      ]
    } else if (culprit === "snail") {
      base.summary = "Caracoles / babosas: agujeros grandes y rastros brillantes de baba."
      base.steps = [
        { day: 0, title: "Caza nocturna", description: "Linterna al anochecer y recoger a mano.", type: "action" },
        { day: 0, title: "Barreras", description: "Cáscara de huevo triturada o cerveza en plato al pie de la maceta.", type: "action" },
        { day: 3, title: "Chequeo 1", description: "¿Agujeros nuevos?", type: "check" },
        { day: 10, title: "Cierre", description: "Sin daños nuevos → recuperada.", type: "check" },
      ]
    } else if (culprit === "leaf_miner") {
      base.summary = "Minador: galerías serpenteantes claras dentro de la hoja. El insecticida no llega a la larva."
      base.donot = "No pulverices insecticida: la larva está DENTRO de la hoja. La única solución es podar."
      base.steps = [
        { day: 0, title: "Podar hojas con galerías", description: "Corta todas las hojas con minas visibles. Tíralas a la basura (no compostar).", type: "action" },
        { day: 3, title: "Chequeo", description: "¿Galerías nuevas en hojas que dejaste?", type: "check" },
        { day: 7, title: "Cierre", description: "Sin galerías nuevas en una semana → recuperada.", type: "check" },
      ]
    } else {
      base.summary = "Plaga no identificada. Procedemos con tratamiento genérico seguro."
      base.steps = [
        { day: 0, title: "Inspección completa", description: "Mira envés, axilas y tallos con lupa si tienes.", type: "action" },
        { day: 1, title: "Jabón potásico genérico (atardecer)", description: "Aplica en envés y brotes.", type: "action" },
        { day: 4, title: "Chequeo 1 + reaplicar", description: "¿Los síntomas avanzan o se frenan? Reaplica.", type: "check" },
        { day: 7, title: "Reaplicar jabón", description: "Reaplicación programada.", type: "action" },
        { day: 10, title: "Chequeo 2", description: "¿Identificas ahora al culpable? Si es así, pasa a protocolo específico.", type: "check" },
        { day: 14, title: "Cierre", description: "Sin síntomas en 7 días → recuperada.", type: "check" },
      ]
    }
  } else if (kind === "disease") {
    base.title = "Tratamiento de enfermedad"
    base.donot = "No uses fungicidas preventivos como cura. Mejor ventilación y poda."

    if (culprit === "powdery_mildew") {
      base.summary = "Oídio: polvo blanco sobre las hojas, como harina."
      base.steps = [
        { day: 0, title: "Retirar hojas muy afectadas", description: "No las compostes; tíralas a la basura.", type: "action" },
        { day: 0, title: "Ventilación", description: "Aumenta la circulación de aire, sin corrientes fuertes.", type: "action" },
        { day: 1, title: "Bicarbonato + jabón (al atardecer)", description: "1 cucharadita de bicarbonato + gota de jabón en 1L de agua.", type: "action" },
        { day: 5, title: "Chequeo 1 + reaplicar", description: "¿El polvo blanco avanza o se frena? Reaplica cada 5-7 días.", type: "check" },
        { day: 7, title: "Reaplicar bicarbonato", description: "Reaplicación programada.", type: "action" },
        { day: 14, title: "Chequeo 2", description: "¿Tejido NUEVO sin manchas? (Las manchas viejas ya hechas quedan; lo que cuenta es el tejido nuevo.)", type: "check" },
        { day: 21, title: "Cierre", description: "Sin manchas NUEVAS 10 días → recuperada. Las manchas antiguas permanecen, es normal.", type: "check" },
      ]
    } else if (culprit === "downy_mildew") {
      base.summary = "Mildiu: manchas amarillas por arriba y pelusilla gris-violácea por debajo."
      base.steps = [
        { day: 0, title: "Retirar hojas afectadas", description: "Corta y tira. No mojes el follaje.", type: "action" },
        { day: 0, title: "Reducir humedad ambiental", description: "Ventila y separa de otras plantas.", type: "action" },
        { day: 2, title: "Cobre o caldo bordelés", description: "Aplica solo si empeora. No apto para consumo inmediato.", type: "action" },
        { day: 5, title: "Chequeo 1", description: "¿Manchas nuevas?", type: "check" },
        { day: 14, title: "Cierre", description: "Sin manchas nuevas 7 días → recuperada.", type: "check" },
      ]
    } else if (culprit === "root_rot") {
      base.summary = "Podredumbre de raíz: tallos blandos, mal olor en el sustrato."
      base.donot = "No riegues hasta que cicatrice. Un transplante mal hecho aquí es lo último que quieres."
      base.steps = [
        { day: 0, title: "Sacar la planta con cuidado", description: "Retira todo el sustrato mojado de las raíces.", type: "action" },
        { day: 0, title: "Cortar raíces podridas", description: "Tijera limpia; quita lo blando y marrón. Deja solo raíces firmes y claras.", type: "action" },
        { day: 0, title: "Sustrato nuevo y seco", description: "Trasplanta a sustrato nuevo bien drenante. No riegues en 3-4 días.", type: "action" },
        { day: 3, title: "Reanudar riego muy moderado", description: "Primer riego desde el trasplante: poca agua. Si el caso era grave, considera fungicida de base (o peróxido diluido) en este primer riego.", type: "action" },
        { day: 4, title: "Chequeo 1", description: "¿El sustrato está seco? ¿La planta firme?", type: "check" },
        { day: 10, title: "Chequeo 2", description: "¿Brotes nuevos? ¿Hojas sin marchitarse?", type: "check" },
        { day: 21, title: "Cierre", description: "Sin pudrición 15 días → recuperada.", type: "check" },
      ]
    } else if (culprit === "leaf_spot") {
      base.summary = "Manchas foliares: puntos oscuros con borde amarillo."
      base.steps = [
        { day: 0, title: "Retirar hojas con manchas", description: "Sin mojar el resto del follaje.", type: "action" },
        { day: 0, title: "Ventilación y separación", description: "Que el aire circule y no salpique a las vecinas.", type: "action" },
        { day: 3, title: "Chequeo 1", description: "¿Manchas nuevas?", type: "check" },
        { day: 10, title: "Chequeo 2", description: "¿Tejido nuevo sin manchas?", type: "check" },
        { day: 14, title: "Cierre", description: "Sin manchas nuevas 7 días → recuperada. Las manchas viejas no desaparecen, es normal.", type: "check" },
      ]
    } else if (culprit === "botrytis") {
      base.summary = "Botrytis: pelusilla gris sobre flores, tallos o frutos. Típico en tejido senescente con humedad."
      base.donot = "No mojes flores ni tejido dañado. Sin ventilación, vuelve."
      base.steps = [
        { day: 0, title: "Retirar partes afectadas", description: "Corta por debajo de la parte gris (con margen). Tira a la basura, no compostar.", type: "action" },
        { day: 0, title: "Bajar humedad + ventilar", description: "Ventila y evita mojar flores y hojas. Sin corrientes frías directas.", type: "action" },
        { day: 3, title: "Chequeo 1", description: "¿Aparece pelusilla nueva?", type: "check" },
        { day: 7, title: "Chequeo 2", description: "¿Sigue avanzando o se ha frenado?", type: "check" },
        { day: 14, title: "Cierre", description: "Sin pelusilla nueva 7 días → recuperada.", type: "check" },
      ]
    } else {
      base.summary = "Enfermedad no identificada. Procedemos con medidas genéricas seguras."
      base.steps = [
        { day: 0, title: "Retirar hojas afectadas", description: "Corta y tira a la basura.", type: "action" },
        { day: 0, title: "Ventilación", description: "Aumenta circulación de aire.", type: "action" },
        { day: 3, title: "Chequeo 1", description: "¿Avanza o se frena?", type: "check" },
        { day: 10, title: "Chequeo 2", description: "¿Intentas identificar la causa con más detalle?", type: "check" },
        { day: 14, title: "Cierre", description: "Sin síntomas nuevos 7 días → recuperada.", type: "check" },
      ]
    }
  } else if (kind === "physical") {
    base.title = "Recuperación por daño físico"
    base.summary = "Un golpe, mascota, caída o rotura. Hay que ayudar a cicatrizar."
    base.donot = "No muevas la planta mucho estos días. La herida necesita estabilidad."
    base.steps = [
      { day: 0, title: "Poda limpia", description: "Corta lo roto con tijera afilada y limpia, en diagonal.", type: "action" },
      { day: 0, title: "Vigilar la herida", description: "Vigila que no se ennegrezca ni huela mal.", type: "action" },
      { day: 4, title: "Chequeo 1", description: "¿La herida cicatriza o empeora?", type: "check" },
      { day: 12, title: "Cierre", description: "Herida seca y algún brote nuevo → recuperada.", type: "check" },
    ]
  } else if (kind === "light") {
    base.title = "Recuperación por estrés de luz"
    base.summary = "Quemadura de sol o falta de luz. Vamos a reubicarla."
    base.donot = "No cambies la planta de sitio de golpe; aclimátala progresivamente. Las hojas QUEMADAS no se recuperan: se caerán y saldrán nuevas."
    base.steps = [
      { day: 0, title: "Reubicar", description: "Sombra luminosa si es quemadura; más cerca de ventana si es falta de luz.", type: "action" },
      { day: 2, title: "Retirar hojas quemadas", description: "Las que están totalmente marrones o crujientes. No esperes que 'se arreglen': no lo harán.", type: "action" },
      { day: 7, title: "Chequeo 1", description: "¿Hojas NUEVAS sin quemar? (Las viejas no cuentan.)", type: "check" },
      { day: 14, title: "Chequeo 2", description: "¿La brotación nueva sigue sana?", type: "check" },
      { day: 21, title: "Cierre", description: "Brotación nueva sana y sin nuevas quemaduras → recuperada.", type: "check" },
    ]
  } else {
    // thermal
    base.title = "Recuperación por golpe térmico"
    base.summary = "Frío o calor extremo. Vamos a estabilizar."
    base.donot = "No abones ni trasplantes hasta que esté estable. No podes las zonas 'sospechosas' aún: la necrosis aparece a los días y no sabrás qué rama está muerta."
    base.steps = [
      { day: 0, title: "Reubicar a temperatura estable", description: "Sin corrientes ni radiadores directos.", type: "action" },
      { day: 0, title: "Riego mínimo", description: "No añadas estrés hídrico. Solo lo justo.", type: "action" },
      { day: 4, title: "Chequeo 1", description: "¿Nuevas zonas negras o marrones?", type: "check" },
      { day: 10, title: "Chequeo 2", description: "¿Brotación nueva?", type: "check" },
      { day: 21, title: "Cierre", description: "Sin nuevas zonas dañadas y brotes nuevos → recuperada.", type: "check" },
    ]
  }

  return base
}

export function stepForDay(plan: Plan, day: number): Step[] {
  return plan.steps.filter(s => s.day === day)
}