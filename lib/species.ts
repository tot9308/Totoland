export type SpeciesCard = {
  sci: string
  common: string
  light: 1 | 2 | 3 | 4
  water: "A" | "B" | "C"
  temp: string
  mist: "Sí" | "Mod" | "No"
  substrate: number
  fert: string
  toxic: boolean
  difficulty: 1 | 2 | 3
  ws: number
  ww: number
  flags: string
}

// Formato: comun|cientifico|luz|riego|temp|pulv|sustrato|abono|tox|dif|diasVerano|diasInvierno|extra
const RAW = [
  "Lengua de suegra|Sansevieria trifasciata|4|C|15-28|No|2|M-Eq|1|1|12|20",
  "Lanza africana|Sansevieria cylindrica|4|C|15-28|No|2|M-Eq|1|1|12|20",
  "Planta ZZ|Zamioculcas zamiifolia|4|C|16-26|No|2|M-Eq|1|1|12|20",
  "Hoja de hierro|Aspidistra elatior|4|B|10-25|Sí|1|M-Eq|0|1|8|14",
  "Cinta|Chlorophytum comosum|3|B|15-25|Sí|1|M-Eq|0|1|6|10",
  "Aglaonema|Aglaonema commutatum|3|B|18-26|Sí|1|M-Eq|1|1|7|12",
  "Ficus gomero|Ficus elastica|2|B|16-27|No|1|M-Eq|1|1|7|12",
  "Ficus hoja violín|Ficus lyrata|2|B|18-27|No|1|M-Eq|1|2|7|10",
  "Ficus llorón|Ficus benjamina|2|B|16-26|No|1|M-Eq|1|1|6|10",
  "Bonsái de interior|Ficus microcarpa ginseng|2|B|18-26|Mod|1|M-Eq|1|2|6|10",
  "Árbol pulpo|Schefflera actinophylla|2|B|16-26|Sí|1|M-Eq|1|1|7|12",
  "Árbol dinero|Pachira aquatica|2|B|18-26|Sí|1|M-Eq|0|1|8|12",
  "Costilla de Adán|Monstera deliciosa|2|B|18-27|Sí|1|F-Eq|1|1|7|12",
  "Monstera adansonii|Monstera adansonii|2|B|18-27|Sí|1|F-Eq|1|1|6|10",
  "Filodendro trepador|Philodendron hederaceum|2|B|18-27|Sí|1|F-Eq|1|1|7|12",
  "Filodendro selloum|Philodendron bipinnatifidum|2|B|18-27|Sí|1|F-Eq|1|1|7|12",
  "Potos plateado|Scindapsus pictus|2|B|18-26|Sí|1|F-Eq|1|1|8|14",
  "Potos dorado|Epipremnum aureum|2|B|16-26|Sí|1|F-Eq|1|1|7|12",
  "Mini-monstera|Rhaphidophora tetrasperma|2|B|18-26|Sí|1|F-Eq|1|1|6|10",
  "Calathea orbifolia|Calathea orbifolia|3|A|18-24|Sí|1|F-Eq|0|3|5|8",
  "Calathea pavo real|Calathea makoyana|3|A|18-24|Sí|1|F-Eq|0|3|5|8",
  "Planta oración|Maranta leuconeura|3|A|18-24|Sí|1|F-Eq|0|3|5|8",
  "Ctenanthe|Ctenanthe burle-marxii|3|A|18-24|Sí|1|F-Eq|0|3|5|8",
  "Calathea lancifolia|Goeppertia insignis|3|A|18-24|Sí|1|F-Eq|0|3|5|8",
  "Árbol de jade|Crassula ovata|1|C|15-26|No|2|M-Eq|1|1|12|20",
  "Rosa alabastro|Echeveria elegans|1|C|15-25|No|2|M-Eq|0|1|12|20",
  "Cola de burro|Sedum morganianum|1|C|16-26|No|2|M-Eq|1|1|12|18",
  "Aloe vera|Aloe barbadensis|1|C|16-27|No|2|M-Eq|1|1|12|20",
  "Planta cebra|Haworthia fasciata|2|C|15-25|No|2|M-Eq|0|1|12|18",
  "Cactus de Navidad|Schlumbergera truncata|2|B|18-25|Sí|1|M-Flo|0|2|8|14",
  "Lirio de paz|Spathiphyllum wallisii|3|A|18-26|Sí|1|F-Flo|1|1|5|8",
  "Anturio|Anthurium andraeanum|2|B|18-26|Sí|1|F-Flo|1|2|6|9",
  "Orquídea mariposa|Phalaenopsis hybrida|2|B|18-28|No|4|M-Flo|0|2|8|12",
  "Violeta africana|Saintpaulia ionantha|3|B|18-24|No|1|M-Flo|0|2|6|9",
  "Kalanchoe|Kalanchoe blossfeldiana|1|C|16-26|No|2|M-Flo|1|1|9|14",
  "Begonia lunares|Begonia maculata|2|B|18-26|Sí|1|F-Flo|1|2|6|10",
  "Dracena tronco|Dracaena marginata|2|B|16-26|Sí|1|M-Eq|1|1|8|14",
  "Tronco Brasil|Dracaena fragrans|3|B|16-26|Sí|1|M-Eq|1|1|7|12",
  "Dracena manchada|Dracaena surculosa|3|B|18-26|Sí|1|M-Eq|1|1|7|12",
  "Palmera de salón|Chamaedorea elegans|3|B|16-24|Sí|1|M-Eq|0|1|6|10",
  "Areca|Dypsis lutescens|2|B|18-26|Sí|1|M-Eq|0|2|6|9",
  "Pata de elefante|Beaucarnea recurvata|1|C|15-26|No|2|M-Eq|0|1|12|20",
  "Amor de hombre|Tradescantia zebrina|2|B|16-25|Sí|1|F-Eq|0|1|6|10",
  "Purpurina|Tradescantia pallida|1|B|16-25|Sí|1|F-Eq|0|1|6|10",
  "Collar de corazones|Ceropegia woodii|2|C|18-26|No|2|M-Eq|0|1|10|16",
  "Collar de perlas|Senecio rowleyanus|2|C|18-26|No|2|M-Eq|1|2|10|16",
  "Peperomia|Peperomia obtusifolia|3|B|18-26|Mod|1|M-Eq|0|1|8|14",
  "Helecho de Boston|Nephrolepis exaltata|3|A|16-24|Sí|1|F-Eq|0|2|4|7",
  "Helecho nido|Asplenium nidus|3|A|18-24|Sí|1|F-Eq|0|2|5|8",
  "Helecho resurrección|Pleopeltis polypodioides|3|A|18-24|Sí|1|F-Eq|0|2|5|8",
  "Alocasia tigre|Alocasia zebrina|2|A|20-27|Sí|1|F-Eq|1|3|4|7",
  "Alocasia polly|Alocasia amazonica|2|A|20-27|Sí|1|F-Eq|1|3|4|7",
  "Syngonium|Syngonium podophyllum|2|B|18-26|Sí|1|F-Eq|1|1|6|10",
  "Philodendron birkin|Philodendron birkin|2|B|18-26|Sí|1|F-Eq|1|2|6|10",
  "Philodendron gloriosum|Philodendron gloriosum|2|B|20-26|Sí|1|F-Eq|1|3|6|9",
  "Monstera plateada|Monstera siltepecana|2|B|18-26|Sí|1|F-Eq|1|2|6|10",
  "Planta de cera|Hoya carnosa|2|B|18-27|Sí|1|F-Eq|0|1|10|16",
  "Hoya linearis|Hoya linearis|2|B|18-26|Sí|1|F-Eq|0|2|9|14",
  "Peperomia sandía|Peperomia argyreia|3|B|18-26|Mod|1|M-Eq|0|2|7|12",
  "Peperomia arrugada|Peperomia caperata|3|B|18-26|Mod|1|M-Eq|0|2|7|12",
  "Higuera trepadora|Ficus pumila|3|B|16-26|No|1|M-Eq|1|1|6|10",
  "Ficus altissima|Ficus altissima|2|B|18-27|No|1|M-Eq|1|2|7|12",
  "Canción de India|Dracaena reflexa|2|B|16-26|Sí|1|M-Eq|1|1|7|12",
  "Ave paraíso pequeña|Strelitzia reginae|1|B|18-27|Sí|1|M-Flo|0|3|6|10",
  "Ave paraíso gigante|Strelitzia nicolai|1|B|18-27|Sí|1|M-Flo|0|3|6|10",
  "Palmera Kentia|Howea forsteriana|3|B|16-24|Sí|1|M-Eq|0|2|7|12",
  "Palmera majestad|Ravenea rivularis|2|B|18-24|Sí|1|M-Eq|0|3|6|10",
  "Culantrillo|Adiantum raddianum|3|A|18-24|Sí|1|F-Eq|0|3|4|7",
  "Cuerno de alce|Platycerium bifurcatum|3|A|18-26|Sí|4|F-Eq|0|3|5|8",
  "Planta de aire pequeña|Tillandsia ionantha|2|C|18-26|Sí|-|-|0|2|7|10|inmersion",
  "Planta de aire grande|Tillandsia xerographica|2|C|18-26|Sí|-|-|0|2|7|12|inmersion",
  "Bromelia estrella|Guzmania lingulata|3|A|18-26|Sí|4|M-Flo|0|2|8|12|tanque",
  "Espada de fuego|Vriesea splendens|3|A|18-26|Sí|4|M-Flo|0|2|8|12|tanque",
  "Bromelia urna|Aechmea fasciata|3|A|18-26|Sí|4|M-Flo|0|2|8|12|tanque",
  "Clivia|Clivia miniata|3|B|18-24|No|1|M-Flo|1|2|8|14",
  "Violeta del cabo|Streptocarpus saxorum|3|B|18-24|No|1|M-Flo|0|2|6|9",
  "Trébol morado|Oxalis triangularis|2|B|18-24|Sí|1|M-Flo|1|2|6|10",
  "Ciclamen|Cyclamen persicum|3|B|15-20|No|1|M-Flo|1|3|5|8",
  "Alegría|Impatiens walleriana|3|A|18-24|Sí|1|F-Flo|0|1|4|7",
  "Prímula|Primula obconica|3|B|15-20|Sí|1|M-Flo|1|2|5|8",
  "Gardenia|Gardenia jasminoides|2|A|18-24|Sí|3|M-Flo|0|3|4|7",
  "Camelia|Camellia japonica|3|B|15-22|Sí|3|M-Flo|1|3|4|7",
  "Cactus africano|Euphorbia trigona|1|C|18-27|No|2|M-Eq|1|1|12|20",
  "Corona de Cristo|Euphorbia milii|1|C|18-27|No|2|M-Flo|1|2|10|18",
  "Lengua de vaca|Gasteria bicolor|2|C|16-26|No|2|M-Eq|0|1|12|18",
  "Piedras vivas|Lithops spp.|1|C|18-24|No|2|M-Eq|0|3|14|24",
  "Dedos de bebé|Fenestraria rhopalophylla|1|C|18-24|No|2|M-Eq|0|3|14|24",
  "Suculenta de fieltro|Senecio haworthii|1|C|18-26|No|2|M-Eq|1|2|12|20",
  "Rosa del desierto|Adenium obesum|1|C|20-28|No|2|M-Flo|1|3|10|18",
  "Suculenta colgante|Aptenia cordifolia|1|C|16-26|No|2|M-Eq|0|1|10|16",
  "Planta de aluminio|Pilea cadierei|3|B|18-24|Sí|1|M-Eq|0|2|6|10",
  "Planta de artillería|Pilea microphylla|3|B|18-24|Sí|1|M-Eq|0|2|6|10",
  "Planta de nervios|Fittonia albivenis|3|A|18-24|Sí|1|M-Eq|0|2|4|7",
  "Planta del beso|Hypoestes phyllostachya|3|B|18-24|Sí|1|M-Eq|0|2|5|8",
  "Lágrimas de bebé|Soleirolia soleirolii|3|A|15-22|Sí|1|M-Eq|0|2|4|7",
  "Hiedra de uva|Cissus rhombifolia|3|B|16-24|Sí|1|M-Eq|0|1|6|10",
  "Hiedra inglesa|Hedera helix|3|B|10-22|Sí|1|M-Eq|1|1|6|9",
  "Albahaca|Ocimum basilicum|1|A|18-26|Sí|1|F-Eq|0|2|4|7|poda",
  "Menta|Mentha spicata|1|A|15-25|Sí|1|F-Eq|0|2|4|7|poda",
  "Perejil|Petroselinum crispum|1|B|15-24|Sí|1|F-Eq|0|2|4|7|poda",
  "Geranio|Pelargonium hortorum|1|B|10-28|No|1|F-Flo|1|1|5|8",
  "Hortensia|Hydrangea macrophylla|3|A|10-25|No|3|M-Flo|1|2|4|7",
  "Lavanda|Lavandula angustifolia|1|C|8-30|No|2|-|1|1|9|14",
  "Romero|Salvia rosmarinus|1|C|8-30|No|2|-|0|1|8|12",
  "Jazmín|Jasminum polyanthum|1|B|10-26|No|1|M-Flo|0|2|5|8",
  "Hibisco|Hibiscus rosa-sinensis|1|B|15-30|No|1|F-Flo|0|2|5|8",
  "Buganvilla|Bougainvillea spectabilis|1|C|12-32|No|2|M-Flo|0|2|7|10",
  "Limonero|Citrus limon|1|B|10-30|No|1|M-Flo|0|2|5|8",
  "Olivo|Olea europaea|1|C|5-32|No|2|-|0|1|9|15",
  "Falso jazmín|Trachelospermum jasminoides|1|B|8-30|No|1|M-Flo|0|1|5|9",
  "Lantana|Lantana camara|1|C|12-32|No|2|M-Flo|1|1|6|10",
  "Jazmín azul|Plumbago auriculata|1|B|12-32|No|1|M-Flo|0|1|5|9",
  "Fucsia|Fuchsia hybrida|3|B|10-24|Sí|1|F-Flo|0|2|4|7",
  "Pensamiento|Viola cornuta|1|B|3-20|No|1|M-Flo|0|1|4|7",
  "Clavel|Dianthus caryophyllus|1|C|8-28|No|2|M-Flo|0|1|6|10",
  "Rosal mini|Rosa chinensis|1|B|8-30|No|1|F-Flo|0|2|4|7",
  "Crisantemo|Chrysanthemum morifolium|1|B|10-25|No|1|M-Flo|1|1|4|7",
  "Azalea|Rhododendron simsii|3|B|5-25|Sí|3|M-Flo|1|3|4|6",
  "Pieris|Pieris japonica|3|B|5-28|No|3|M-Flo|1|2|5|8",
  "Skimmia|Skimmia japonica|3|B|0-25|No|3|M-Eq|1|1|5|9",
  "Nandina|Nandina domestica|2|B|0-30|No|1|M-Eq|1|1|6|10",
  "Fotinia|Photinia fraseri|1|B|0-32|No|1|M-Eq|0|1|6|10",
  "Bambú no invasivo|Fargesia murielae|3|A|0-28|No|1|M-Eq|0|1|4|6",
  "Capuchina|Tropaeolum majus|1|C|8-28|No|1|-|0|1|5|8",
  "Glicinia|Wisteria sinensis|1|B|5-32|No|1|M-Flo|1|3|5|9",
  "Pasionaria|Passiflora caerulea|1|B|8-32|No|1|M-Flo|0|2|5|9",
  "Bignonia|Campsis radicans|1|C|5-35|No|1|-|0|1|6|10",
  "Vincapervinca|Vinca major|3|B|8-28|No|1|M-Eq|1|1|5|9",
  "Hosta|Hosta hybrida|4|A|8-26|No|1|M-Eq|1|1|4|6",
  "Heuchera|Heuchera hybrida|3|B|8-28|No|1|M-Eq|0|1|5|9",
  "Astilbe|Astilbe hybrida|3|A|8-24|No|1|M-Flo|0|2|4|6",
  "Bergenia|Bergenia cordifolia|3|B|0-28|No|1|M-Eq|0|1|6|10",
  "Yuca|Yucca elephantipes|1|C|13-30|No|2|M-Eq|1|1|10|18",
  "Sagú|Cycas revoluta|1|C|13-30|No|2|M-Eq|1|1|10|16",
  "Pino de Norfolk|Araucaria heterophylla|2|B|13-24|Sí|1|M-Eq|0|2|6|9",
  "Poinsetia|Euphorbia pulcherrima|2|B|15-24|No|1|M-Eq|1|2|6|10",
  "Amarilis|Hippeastrum hybridum|2|C|15-26|No|2|M-Flo|1|2|9|15",
  "Planta china|Pilea peperomioides|2|B|15-26|No|1|M-Eq|0|1|7|12",
  "Bananera enana|Musa acuminata|1|A|18-30|Sí|1|F-Eq|0|2|5|8",
  "Begonia de flor|Begonia semperflorens|3|B|13-28|No|1|F-Flo|1|1|5|8",
  "Schefflera enana|Schefflera arboricola|2|B|15-27|Mod|1|M-Eq|1|1|7|12",
]

function P(r: string): SpeciesCard {
  const c = r.split("|")
  return {
    common: c[0],
    sci: c[1],
    light: Number(c[2]) as 1 | 2 | 3 | 4,
    water: c[3] as "A" | "B" | "C",
    temp: c[4],
    mist: c[5] as "Sí" | "Mod" | "No",
    substrate: c[6] === "-" ? 0 : Number(c[6]),
    fert: c[7],
    toxic: c[8] === "1",
    difficulty: Number(c[9]) as 1 | 2 | 3,
    ws: Number(c[10]),
    ww: Number(c[11]),
    flags: c[12] ?? "",
  }
}

export const SPECIES: SpeciesCard[] = RAW.map(P)

export const LIGHT_LABELS: Record<number, string> = {
  1: "☀️ Sol directo",
  2: "🌤️ Indirecta brillante",
  3: "⛅ Semisombra",
  4: "🌥️ Sombra / poca luz",
}

export const WATER_LABELS: Record<string, { label: string; check: string }> = {
  A: { label: "💧 Sustrato siempre húmedo", check: "no dejar secar nunca" },
  B: { label: "💧 Secar 1-2 cm superficial", check: "dedo: solo seca la capa de arriba" },
  C: { label: "💧 Secar completamente", check: "maceta ligera y tierra seca del todo" },
}

export const MIST_LABELS: Record<string, string> = {
  Sí: "💦 Pulverizar a menudo",
  Mod: "💦 Solo verano o con calefacción",
  No: "🚫 No pulverizar",
}

export const SUBSTRATE_LABELS: Record<number, string> = {
  0: "—",
  1: "Universal",
  2: "Mezcla porosa (cactus/suculentas)",
  3: "Sustrato ácido",
  4: "Corteza o musgo",
}

export const DIFF_LABELS: Record<number, string> = {
  1: "🟢 Fácil",
  2: "🟡 Media",
  3: "🔴 Avanzada",
}

export const FLAG_LABELS: Record<string, string> = {
  tanque: "🫗 Echar agua en el centro (cáliz) y renovarla si se estanca",
  inmersion: "🌊 Riego por inmersión ~1 h/semana o pulverizado diario",
  poda: "✂️ Poda frecuente: pinzar puntas para que no espigue",
}

export function fertLabel(f: string): string {
  if (f === "-") return "sin abono relevante"
  const [freq, tipo] = f.split("-")
  const fq = freq === "F" ? "cada 15 días en primavera-verano" : "1 vez al mes en primavera-verano"
  const tp = tipo === "Eq" ? "equilibrado" : "rico en fósforo (floración)"
  return `${fq} · ${tp} · en invierno no`
}

export function searchSpecies(q: string, limit = 6): SpeciesCard[] {
  const n = q.trim().toLowerCase()
  if (n.length < 2) return []
  return SPECIES.filter(
    s => s.sci.toLowerCase().includes(n) || s.common.toLowerCase().includes(n)
  ).slice(0, limit)
}

export function findSpecies(q: string): SpeciesCard | undefined {
  const n = q.trim().toLowerCase()
  if (!n) return undefined
  return (
    SPECIES.find(s => s.sci.toLowerCase() === n || s.common.toLowerCase() === n) ??
    SPECIES.find(s => s.sci.toLowerCase().includes(n) || s.common.toLowerCase().includes(n))
  )
}