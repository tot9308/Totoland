import {
  type SpeciesCard, LIGHT_LABELS, WATER_LABELS, MIST_LABELS, SUBSTRATE_LABELS, fertLabel,
} from "./species"

export function careTemplate(card: SpeciesCard): string {
  const w = WATER_LABELS[card.water]
  const lines = [
    LIGHT_LABELS[card.light],
    `Riego: ${w.label}. ${w.check}`,
    MIST_LABELS[card.mist],
    `Sustrato: ${SUBSTRATE_LABELS[card.substrate]}`,
    `Abono: ${fertLabel(card.fert)}`,
    `Orientativo: cada ${card.ws} d en verano, ${card.ww} d en invierno`,
  ]
  if (card.toxic) lines.push("⚠️ Tóxica para mascotas: tenla fuera de su alcance")
  return lines.join("\n")
}