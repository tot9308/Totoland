import type { Plant } from "./plants"

export type ProtocolKind =
  | "drought" | "overwater" | "pest" | "disease"
  | "physical" | "light" | "thermal" | "fertilizer"

export type Severity = "mild" | "moderate" | "severe"

export type Culprit =
  | "caterpillar" | "aphid" | "mealybug" | "root_mealybug" | "scale"
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
  fertilizer: "🧂 Quemadura por fertilizante / sales",
}

export const SEVERITY_LABEL: Record<Severity, string> = {
  mild: "Leve", moderate: "Moderado", severe: "Grave",
}

export const CULPRIT_LABEL: Record<string, string> = {
  caterpillar: "Oruga",
  aphid: "Pulgón",
  mealybug: "Cochinilla (hojas)",
  root_mealybug: "Cochinilla de raíz",
  scale: "Escama / cochinilla acorazada",
  spider_mite: "Araña roja",
  whitefly: "Mosca blanca",
  thrips: "Trips",
  fungus_gnat: "Mosca del sustrato",
  snail: "Caracol / babosa",
  leaf_miner: "Minador de hojas",
  powdery_mildew: "Oídio (polvo blanco)",
  downy_mildew: "Mildiu",
  root_rot: "Podredumbre de raíz",
  leaf_spot: "Manchas foliares",
  botrytis: "Botrytis (pelusilla gris)",
}

export const CULPRIT_BY_KIND: Record<ProtocolKind, string[]> = {
  drought: [], overwater: [], physical: [], light: [], thermal: [], fertilizer: [],
  pest: ["caterpillar", "aphid", "mealybug", "root_mealybug", "scale", "spider_mite", "whitefly", "thrips", "fungus_gnat", "snail", "leaf_miner"],
  disease: ["powdery_mildew", "downy_mildew", "root_rot", "leaf_spot", "botrytis"],
}

export type Step = { day: number; title: string; description: string; type: "action" | "check" }

export type Plan = {
  title: string
  summary: string
  donot: string
  warnings: string[]
  escalation: string
  steps: Step[]
}

export const GLOBAL_WARNINGS = [
  "Jabón potásico: aplica al atardecer y prueba antes en una hoja en helechos, calatheas, carnívoras y suculentas con pruina.",
  "Azufre y aceites (neem): nunca en las mismas 2 semanas; el azufre jamás por encima de 30 °C.",
  "En comestibles: nada de sistémicos; lava bien antes de consumir.",
  "Si hay hormigas: controla también el hormiguero; 'cultivan' pulgón y cochinilla y reinfestarán.",
]

export function buildPlan(kind: ProtocolKind, culprit: Culprit | null, severity: Severity): Plan {
  const P: Plan = { title: "", summary: "", donot: "", warnings: [...GLOBAL_WARNINGS], escalation: "", steps: [] }

  if (kind === "drought") {
    P.title = "Recuperación por sequía"
    P.summary = "La planta se ha deshidratado. Rehidratamos con cuidado."
    P.donot = "No ahogues: el riego de rescate es puntual. No abones hasta que se recupere."
    P.escalation = "Si no mejora en 7 días: revisa raíces (puede haber podredumbre previa) y trasplanta a sustrato nuevo."
    P.steps = [
      { day: 0, title: "Riego de rescate", description: "Sumerge la maceta 20-30 min en agua templada. Escurre 10-15 min.", type: "action" },
      { day: 1, title: "Pulverizar hojas", description: "Si no es suculenta, nebuliza 1-2 veces al día.", type: "action" },
      { day: 2, title: "Sombra parcial", description: "Aleja del sol directo hasta que se recupere.", type: "action" },
      { day: 3, title: "Chequeo 1", description: "¿Recuperan turgencia? ¿Caída nueva?", type: "check" },
      { day: 7, title: "Chequeo 2", description: "¿Brotes nuevos o mejoría visible?", type: "check" },
      { day: 14, title: "Cierre", description: "Tejido nuevo sano una semana → recuperada. Las hojas viejas secas no reviven.", type: "check" },
    ]
  } else if (kind === "overwater") {
    P.title = "Recuperación por exceso de riego"
    P.summary = "Las raíces se asfixian. Hay que secar el sustrato con cuidado."
    P.donot = "No riegues aunque las hojas caigan: es síntoma de exceso, no de sed."
    P.escalation = "Si el tallo se vuelve blando/negro: podridumbre avanzada → corta por encima del tejido sano y esqueja."
    P.steps = [
      { day: 0, title: "Vaciar plato", description: "Retira toda el agua acumulada bajo la maceta.", type: "action" },
      { day: 0, title: "Trasplante de urgencia si es grave", description: "Sustrato encharcado → saca, quita sustrato mojado y pon en sustrato seco.", type: "action" },
      { day: 2, title: "Calor y ventilación", description: "Lugar cálido y ventilado para que seque.", type: "action" },
      { day: 4, title: "Chequeo 1", description: "¿Sustrato seco en profundidad?", type: "check" },
      { day: 7, title: "Chequeo 2", description: "¿Hojas amarillas nuevas? ¿Tallo firme?", type: "check" },
      { day: 14, title: "Cierre", description: "Sin hojas amarillas nuevas ni mal olor → recuperada.", type: "check" },
    ]
  } else if (kind === "pest") {
    P.title = "Tratamiento contra plaga"
    P.donot = "En comestibles nada de sistémicos; lava antes de consumir."

    if (culprit === "caterpillar") {
      P.summary = "Orugas voraces y nocturnas."
      P.escalation = "Si tras 2 reaplicaciones sigue el daño: neem + retirada manual diaria, o poda fuerte y aísla. En comestibles insiste en Bt semanal."
      P.steps = [
        { day: 0, title: "Inspección nocturna", description: "Linterna al anochecer: envés y tallos. Retira a mano.", type: "action" },
        { day: 0, title: "Poda de hojas dañadas", description: "Quita hojas >50% dañadas (máx. 1/3 del follaje).", type: "action" },
        { day: 1, title: "Tratamiento", description: "Bt (Bacillus thuringiensis) en comestibles, o jabón potásico.", type: "action" },
        { day: 3, title: "Chequeo 1", description: "¿Mordiscos nuevos o cacas negras?", type: "check" },
        { day: 4, title: "Reaplicar tratamiento", description: "Los huevos eclosionan: repite Bt/jabón.", type: "action" },
        { day: 7, title: "Reaplicar tratamiento", description: "Segunda repetición para cerrar el ciclo.", type: "action" },
        { day: 10, title: "Chequeo 2", description: "¿4 días sin daño nuevo?", type: "check" },
        { day: 14, title: "Cierre", description: "Sin daño una semana → recuperada.", type: "check" },
      ]
    } else if (culprit === "aphid") {
      P.summary = "Pulgón en brotes tiernos."
      P.escalation = "Si persiste tras 3 aplicaciones: neem, o suelta de crisopas/mariquitas en exterior."
      P.steps = [
        { day: 0, title: "Chorro de agua", description: "Agua a presión para tirar la mayoría.", type: "action" },
        { day: 1, title: "Jabón potásico", description: "En envés y brotes.", type: "action" },
        { day: 4, title: "Reaplicar jabón", description: "Repite en focos vivos.", type: "action" },
        { day: 5, title: "Chequeo 1", description: "¿Pulgón vivo en brotes nuevos?", type: "check" },
        { day: 7, title: "Reaplicar jabón", description: "Tercera aplicación si queda algo.", type: "action" },
        { day: 10, title: "Chequeo 2", description: "¿Brotes nuevos limpios?", type: "check" },
        { day: 14, title: "Cierre", description: "Sin pulgón 7 días → recuperada.", type: "check" },
      ]
    } else if (culprit === "mealybug") {
      P.summary = "Cochinilla algodonosa en hojas y axilas."
      P.warnings.push("Alcohol: prueba antes en una hoja; quema algunas especies.")
      P.escalation = "Si aparece algodón en las raíces al regar: es cochinilla de raíz → cambia a ese protocolo."
      P.steps = [
        { day: 0, title: "Algodón + alcohol", description: "Limpia cada foco (prueba antes en una hoja).", type: "action" },
        { day: 1, title: "Jabón potásico", description: "Insiste en axilas y envés.", type: "action" },
        { day: 4, title: "Reaplicar", description: "Alcohol/jabón en focos nuevos.", type: "action" },
        { day: 7, title: "Chequeo 1 + reaplicar", description: "¿Bolitas nuevas? Trata lo que veas.", type: "check" },
        { day: 14, title: "Chequeo 2", description: "¿Sin cochinilla visible?", type: "check" },
        { day: 21, title: "Reaplicar si hay focos", description: "Los crawlers eclosionan escalonados.", type: "action" },
        { day: 28, title: "Cierre", description: "Limpia 2 semanas → recuperada.", type: "check" },
      ]
    } else if (culprit === "root_mealybug") {
      P.summary = "Cochinilla de raíz: algodón en las raíces al trasplantar."
      P.escalation = "Si reaparece: repite trasplante + sistémico (no comestibles), o descarta la planta para proteger al resto."
      P.steps = [
        { day: 0, title: "Aislamiento estricto", description: "Lejos de todas las demás plantas.", type: "action" },
        { day: 0, title: "Lavar raíces", description: "Saca la planta y lava las raíces con chorro de agua tibia.", type: "action" },
        { day: 0, title: "Trasplante limpio", description: "Sustrato NUEVO y maceta desinfectada.", type: "action" },
        { day: 3, title: "Riego tratado", description: "Riega con sistémico apto para la especie (o jabón muy diluido en comestibles).", type: "action" },
        { day: 7, title: "Chequeo 1", description: "¿Algodón nuevo en bordes del sustrato?", type: "check" },
        { day: 14, title: "Chequeo 2", description: "¿Sin rastro nuevo?", type: "check" },
        { day: 28, title: "Cierre", description: "Limpia 2 semanas → recuperada.", type: "check" },
      ]
    } else if (culprit === "scale") {
      P.summary = "Escama acorazada: escudos fijos que no caen con jabón."
      P.escalation = "Si tras 6 semanas siguen apareciendo: sistémico (no comestibles) o descarta la planta."
      P.steps = [
        { day: 0, title: "Raspar cada escudo", description: "Palillo o uña: no dejes ninguno puesto.", type: "action" },
        { day: 0, title: "Tratar puntos raspados", description: "Jabón o alcohol en cada herida de raspado.", type: "action" },
        { day: 7, title: "Inspección semanal 1", description: "Busca crawlers nuevos y ráspalos.", type: "check" },
        { day: 14, title: "Inspección semanal 2", description: "Raspa lo nuevo.", type: "check" },
        { day: 21, title: "Inspección semanal 3", description: "Raspa lo nuevo.", type: "check" },
        { day: 28, title: "Inspección semanal 4", description: "Raspa lo nuevo.", type: "check" },
        { day: 35, title: "Inspección semanal 5", description: "Raspa lo nuevo.", type: "check" },
        { day: 42, title: "Cierre", description: "Sin escudos nuevos 2 semanas → recuperada.", type: "check" },
      ]
    } else if (culprit === "spider_mite") {
      P.summary = "Araña roja: punteado amarillo y finas telarañas."
      P.warnings.push("No pulverices el follaje a diario: favorece oídio y botrytis. Humedece el ENTORNO.")
      P.escalation = "Si persiste: neem tras el jabón (nunca mezclar en la misma aplicación), o acaricida específico."
      P.steps = [
        { day: 0, title: "Humedad del entorno", description: "Bandeja con piedras y agua bajo la maceta; pulveriza el AIRE alrededor, no la planta.", type: "action" },
        { day: 0, title: "Pulverización directa corta", description: "Solo 2-3 días si la infestación es fuerte; luego solo entorno.", type: "action" },
        { day: 1, title: "Jabón potásico", description: "En el envés, a fondo.", type: "action" },
        { day: 4, title: "Reaplicar jabón", description: "Los huevos eclosionan ~cada 3 días.", type: "action" },
        { day: 5, title: "Chequeo 1", description: "¿Telarañas o punteado nuevo?", type: "check" },
        { day: 7, title: "Reaplicar jabón", description: "Tercera aplicación.", type: "action" },
        { day: 10, title: "Reaplicar + Chequeo 2", description: "Cuarta aplicación; ¿hojas nuevas limpias?", type: "check" },
        { day: 14, title: "Cierre", description: "Sin síntomas 7 días → recuperada.", type: "check" },
      ]
    } else if (culprit === "whitefly") {
      P.summary = "Mosca blanca: sale volando al agitar."
      P.escalation = "Si persiste: neem o jabón cada 3 días + más trampas; en exterior, encarsia."
      P.steps = [
        { day: 0, title: "Trampas amarillas", description: "Cerca de la planta.", type: "action" },
        { day: 1, title: "Jabón potásico", description: "Cubriendo envés.", type: "action" },
        { day: 4, title: "Reaplicar jabón", description: "Repite.", type: "action" },
        { day: 5, title: "Chequeo 1", description: "¿Siguen volando al agitar?", type: "check" },
        { day: 7, title: "Reaplicar jabón", description: "Tercera aplicación.", type: "action" },
        { day: 10, title: "Chequeo 2", description: "¿Sin moscas varios días?", type: "check" },
        { day: 14, title: "Cierre", description: "Sin presencia → recuperada.", type: "check" },
      ]
    } else if (culprit === "thrips") {
      P.summary = "Trips: marcas plateadas y brotes deformes."
      P.escalation = "Si persiste: spinosad (no comestibles) o suelta de amblyseius."
      P.steps = [
        { day: 0, title: "Trampas azules", description: "Los trips se pegan al azul.", type: "action" },
        { day: 1, title: "Jabón + neem", description: "Mezcla y aplica.", type: "action" },
        { day: 5, title: "Chequeo 1", description: "¿Marcas plateadas nuevas?", type: "check" },
        { day: 6, title: "Reaplicar", description: "Segunda aplicación.", type: "action" },
        { day: 11, title: "Reaplicar", description: "Tercera aplicación.", type: "action" },
        { day: 12, title: "Chequeo 2", description: "¿Brotes nuevos sanos?", type: "check" },
        { day: 21, title: "Cierre", description: "Sin daños 7 días → recuperada.", type: "check" },
      ]
    } else if (culprit === "fungus_gnat") {
      P.summary = "Mosquitas negras del sustrato."
      P.escalation = "Nivel 2 si la arena no frena: riega con BTI (Bacillus thuringiensis israelensis, 'bits'): rompe el ciclo de larvas."
      P.steps = [
        { day: 0, title: "Dejar secar el sustrato", description: "Los huevos mueren en superficie seca.", type: "action" },
        { day: 0, title: "Trampas amarillas", description: "Para adultos.", type: "action" },
        { day: 1, title: "Arena o grava", description: "Capa de 1 cm en superficie.", type: "action" },
        { day: 5, title: "Chequeo 1", description: "¿Siguen saliendo mosquitas?", type: "check" },
        { day: 7, title: "Nivel 2 si persiste", description: "Solo si siguen: riego con BTI ('bits').", type: "action" },
        { day: 14, title: "Cierre", description: "Sin mosquitas 7 días → recuperada.", type: "check" },
      ]
    } else if (culprit === "snail") {
      P.summary = "Caracoles/babosas: agujeros grandes y baba brillante."
      P.escalation = "Si persiste: cebo de fosfato férrico (aptos comestibles) alrededor."
      P.steps = [
        { day: 0, title: "Caza nocturna", description: "Linterna y recoger a mano.", type: "action" },
        { day: 0, title: "Barreras", description: "Cáscara de huevo triturada o plato de cerveza al pie.", type: "action" },
        { day: 3, title: "Chequeo 1", description: "¿Agujeros nuevos?", type: "check" },
        { day: 5, title: "Renovar barreras", description: "Repon cáscara/cerveza.", type: "action" },
        { day: 10, title: "Cierre", description: "Sin daños nuevos → recuperada.", type: "check" },
      ]
    } else if (culprit === "leaf_miner") {
      P.summary = "Minador: galerías serpenteantes dentro de la hoja."
      P.escalation = "Si aparecen muchas galerías nuevas: trampas amarillas para adultos + repite poda."
      P.steps = [
        { day: 0, title: "Poda de hojas con galerías", description: "El insecticida no llega a la larva que está dentro.", type: "action" },
        { day: 0, title: "Aplastar larvas", description: "Si quieres conservar la hoja, aplasta el extremo de la galería.", type: "action" },
        { day: 3, title: "Chequeo 1", description: "¿Galerías nuevas?", type: "check" },
        { day: 7, title: "Cierre", description: "Sin galerías nuevas → recuperada.", type: "check" },
      ]
    } else {
      P.summary = "Plaga no identificada: tratamiento genérico seguro."
      P.escalation = "Si no frenas en 10 días: identifica con foto macro del envés y pasa al protocolo específico."
      P.steps = [
        { day: 0, title: "Inspección completa", description: "Lupa en envés, axilas y tallos.", type: "action" },
        { day: 1, title: "Jabón potásico genérico", description: "Cada 3-4 días en envés y brotes.", type: "action" },
        { day: 4, title: "Reaplicar", description: "Repite.", type: "action" },
        { day: 4, title: "Chequeo 1", description: "¿Avanza o frena?", type: "check" },
        { day: 10, title: "Chequeo 2", description: "¿Identificas al culpable? Pasa a su protocolo.", type: "check" },
        { day: 14, title: "Cierre", description: "Sin síntomas 7 días → recuperada.", type: "check" },
      ]
    }
  } else if (kind === "disease") {
    P.title = "Tratamiento de enfermedad"
    P.donot = "No uses fungicida preventivo como cura: ventila y poda."

    if (culprit === "powdery_mildew") {
      P.summary = "Oídio: polvo blanco en hojas."
      P.warnings.push("Azufre nunca >30 °C ni con aceites en las mismas 2 semanas.")
      P.escalation = "Si avanza: fungicida sistémico anti-oídio (no comestibles)."
      P.steps = [
        { day: 0, title: "Poda de hojas blancas", description: "Máx. 1/3 del follaje.", type: "action" },
        { day: 0, title: "Ventilación", description: "Separa y mejora circulación de aire.", type: "action" },
        { day: 1, title: "Bicarbonato o azufre", description: "Agua + 1% bicarbonato, o azufre.", type: "action" },
        { day: 4, title: "Reaplicar", description: "Repite el tratamiento.", type: "action" },
        { day: 4, title: "Chequeo 1", description: "¿Puntos blancos nuevos?", type: "check" },
        { day: 10, title: "Chequeo 2", description: "¿Tejido NUEVO limpio? Las manchas viejas no se van.", type: "check" },
        { day: 14, title: "Cierre", description: "Tejido nuevo limpio 7 días → recuperada.", type: "check" },
      ]
    } else if (culprit === "root_rot") {
      P.summary = "Podredumbre de raíz: decae con sustrato húmedo."
      P.escalation = "Si el tallo se ennegrece: corta por encima de lo sano y esqueja."
      P.steps = [
        { day: 0, title: "Revisar raíces", description: "Corta las negras/blandas; deja solo firmes.", type: "action" },
        { day: 0, title: "Trasplante nuevo", description: "Sustrato con buen drenaje; no riegues 2-3 días.", type: "action" },
        { day: 3, title: "Reanudar riego moderado", description: "Muy poco; con fungicida sistémico o peróxido diluido si se repite.", type: "action" },
        { day: 5, title: "Chequeo 1", description: "¿Se estabilizan las hojas?", type: "check" },
        { day: 14, title: "Cierre", description: "Nuevo crecimiento → recuperada.", type: "check" },
      ]
    } else if (culprit === "leaf_spot") {
      P.summary = "Manchas foliares con borde amarillo."
      P.escalation = "Si progresa: fungicida de cobre cada 7-10 días."
      P.steps = [
        { day: 0, title: "Poda de hojas con manchas", description: "Retíralas.", type: "action" },
        { day: 0, title: "Riego al pie", description: "Nunca mojes las hojas; por la mañana.", type: "action" },
        { day: 3, title: "Cobre si progresa", description: "Fungicida de cobre.", type: "action" },
        { day: 7, title: "Chequeo 1", description: "¿Manchas nuevas?", type: "check" },
        { day: 14, title: "Cierre", description: "Tejido nuevo sin manchas 7 días → recuperada.", type: "check" },
      ]
    } else if (culprit === "botrytis") {
      P.summary = "Botrytis: pelusilla gris en flores y tejido senescente."
      P.escalation = "Si avanza: fungicida anti-botrytis y poda más agresiva."
      P.steps = [
        { day: 0, title: "Poda de tejido senescente", description: "Flores marchitas y hojas muertas, fuera.", type: "action" },
        { day: 0, title: "Bajar humedad ambiental", description: "Ventila y separa plantas.", type: "action" },
        { day: 1, title: "Cobre si progresa", description: "Fungicida de cobre.", type: "action" },
        { day: 5, title: "Chequeo 1", description: "¿Pelusilla nueva?", type: "check" },
        { day: 14, title: "Cierre", description: "Sin pelusilla 7 días → recuperada.", type: "check" },
      ]
    } else {
      P.summary = "Enfermedad no identificada: medidas generales."
      P.escalation = "Si progresa: identifica con foto y pasa al protocolo específico."
      P.steps = [
        { day: 0, title: "Poda de partes afectadas", description: "Desinfecta las tijeras entre cortes.", type: "action" },
        { day: 0, title: "Mejorar condiciones", description: "Ventilación, luz y riego al pie.", type: "action" },
        { day: 5, title: "Chequeo 1", description: "¿Progresan los síntomas?", type: "check" },
        { day: 14, title: "Cierre", description: "Tejido nuevo sano una semana → recuperada.", type: "check" },
      ]
    }
  } else if (kind === "physical") {
    P.title = "Recuperación de daño físico"
    P.summary = "Golpe, rotura o daño mecánico."
    P.donot = "No tires de tejidos dañados."
    P.escalation = "Si un corte se pudre: recorta por encima de tejido sano y desinfecta."
    P.steps = [
      { day: 0, title: "Evaluar el daño", description: "Decide qué conservar y qué podar.", type: "action" },
      { day: 0, title: "Poda limpia", description: "Tijera desinfectada.", type: "action" },
      { day: 0, title: "Entutorar", description: "Sujeta tallos rotos con caña y cinta.", type: "action" },
      { day: 3, title: "Chequeo 1", description: "¿Cicatrizan? ¿Se pudre algo?", type: "check" },
      { day: 10, title: "Cierre", description: "Heridas selladas y sin pudrición → recuperada.", type: "check" },
    ]
  } else if (kind === "light") {
    P.title = "Ajuste de luz"
    P.summary = "Ubicación incorrecta respecto a la luz."
    P.donot = "No pases bruscamente de sombra a sol directo."
    P.escalation = "Si no mejora en 3 semanas: reevalúa la especie para esa ubicación."
    P.steps = [
      { day: 0, title: "Identificar", description: "Quemadura (manchas secas expuestas) o falta (tallos largos, poco crecimiento).", type: "action" },
      { day: 1, title: "Mover gradualmente", description: "Cambia la ubicación paso a paso en una semana.", type: "action" },
      { day: 7, title: "Chequeo 1", description: "¿Brotes nuevos sanos? Las hojas quemadas NO se recuperan.", type: "check" },
      { day: 21, title: "Cierre", description: "Crecimiento nuevo normal → recuperada.", type: "check" },
    ]
  } else if (kind === "thermal") {
    P.title = "Recuperación de golpe térmico"
    P.summary = "Helada u ola de calor."
    P.donot = "No podes hasta ver el alcance real del daño (tarda días)."
    P.escalation = "Si el tallo se arruga tras 2 semanas: corta por encima de lo sano."
    P.steps = [
      { day: 0, title: "Alejar del estrés", description: "Fuera del sol abrasador o del frío.", type: "action" },
      { day: 0, title: "No regar de más", description: "La planta estresada no absorbe bien.", type: "action" },
      { day: 3, title: "Esperar y observar", description: "Aún no podes.", type: "action" },
      { day: 7, title: "Chequeo 1", description: "¿Qué tejido está definitivamente muerto?", type: "check" },
      { day: 10, title: "Poda final", description: "Corta por encima del tejido vivo.", type: "action" },
      { day: 21, title: "Cierre", description: "Nuevo crecimiento → recuperada.", type: "check" },
    ]
  } else if (kind === "fertilizer") {
    P.title = "Quemadura por fertilizante / sales"
    P.summary = "Puntas marrones y costra blanca en sustrato o maceta."
    P.donot = "No abones 'para compensar': empeora la quemadura."
    P.escalation = "Si persiste: trasplanta a sustrato nuevo sin sales acumuladas."
    P.steps = [
      { day: 0, title: "Riego de lavado", description: "3-4 volúmenes de agua de la maceta para arrastrar sales.", type: "action" },
      { day: 0, title: "Suspender abonado", description: "Pausa total.", type: "action" },
      { day: 7, title: "Chequeo 1", description: "¿Puntas quemadas nuevas?", type: "check" },
      { day: 14, title: "Reanudar a media dosis", description: "Solo si está estable.", type: "action" },
      { day: 21, title: "Cierre", description: "Hojas nuevas sin puntas quemadas → recuperada.", type: "check" },
    ]
  }

  if (severity === "severe") {
    P.steps.unshift({ day: 0, title: "⚠ Aislamiento estricto", description: "Lejos de otras plantas; material desinfectado.", type: "action" })
  }
  return P
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