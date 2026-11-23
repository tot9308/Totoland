// ============================================================================
// TESTS DE LA LOGICA DE RIEGO
// Ejecutar con: node lib/plants.test.ts  (Node 22.18+ / 24 con type stripping)
// ============================================================================
import {
  LIGHT_FRACTION,
  DEEP_FRACTION,
  deepWateringIntervalMonths,
  shouldDeepWater,
  nextDeepWateringDate,
  deepWateringPatch,
  calculateWatering,
} from "./plants.ts"
import type { Plant } from "./plants.ts"

function makePlant(over: Partial<Plant> = {}): Plant {
  return {
    id: "p1",
    household_id: "h1",
    name: "Test",
    species: null,
    location: null,
    watering_frequency_days: 7,
    watering_frequency_winter_days: null,
    watering_days: null,
    watering_week_interval: null,
    watering_anchor: null,
    last_watered_at: null,
    status: "alive",
    misting_enabled: false,
    notes: null,
    main_photo_path: null,
    care_tips: null,
    acquired_at: null,
    died_at: null,
    pot_diameter_cm: 14,
    has_saucer: false,
    recovery_check_at: null,
    recovery_step: 0,
    recovery_severity: null,
    recovery_started_at: null,
    plant_type: null,
    recovery_kind: null,
    recovery_culprit: null,
    death_cause: null,
    crop_box: null,
    misting_frequency_days: null,
    last_misted_at: null,
    drainage: true,
    last_deep_watering_at: null,
    watering_style: "C",
    created_at: null,
    ...over,
  }
}

function potVolume(diameterCm: number): number {
  const D = Math.max(4, diameterCm)
  const R = D / 2
  const r = R * 0.75
  const h = D * 0.9
  return (Math.PI * h / 3) * (R * R + R * r + r * r)
}

const r5 = (x: number) => Math.round(x / 5) * 5
const iso = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null)

let passed = 0
let failed = 0
function test(name: string, fn: () => void) {
  try { fn(); passed++; console.log("OK   " + name) }
  catch (e: any) { failed++; console.log("FAIL " + name + ": " + e.message) }
}
function assert(cond: boolean, msg: string) { if (!cond) throw new Error(msg) }
function assertEqual(actual: any, expected: any, msg: string) {
  if (actual !== expected) throw new Error(msg + ": esperado " + JSON.stringify(expected) + ", obtenido " + JSON.stringify(actual))
}

// ---------------- Tablas de fracciones ----------------
test("LIGHT_FRACTION A-E", () => {
  assertEqual(LIGHT_FRACTION.A.join(","), "0.05,0.08", "A")
  assertEqual(LIGHT_FRACTION.B.join(","), "0.06,0.1", "B")
  assertEqual(LIGHT_FRACTION.C.join(","), "0.08,0.12", "C")
  assertEqual(LIGHT_FRACTION.D.join(","), "0.1,0.14", "D")
  assertEqual(LIGHT_FRACTION.E.join(","), "0.12,0.16", "E")
})
test("DEEP_FRACTION A-E", () => {
  assertEqual(DEEP_FRACTION.A, null, "A nunca profundo")
  assertEqual(DEEP_FRACTION.B!.join(","), "0.18,0.22", "B")
  assertEqual(DEEP_FRACTION.C!.join(","), "0.2,0.25", "C")
  assertEqual(DEEP_FRACTION.D!.join(","), "0.22,0.28", "D")
  assertEqual(DEEP_FRACTION.E!.join(","), "0.25,0.3", "E")
})

// ---------------- Estacionalidad ----------------
test("Intervalo: verano = 1 mes", () => {
  assertEqual(deepWateringIntervalMonths(7), 1, "julio")
  assertEqual(deepWateringIntervalMonths(5), 1, "mayo")
  assertEqual(deepWateringIntervalMonths(9), 1, "septiembre")
})
test("Intervalo: invierno = 2 meses", () => {
  assertEqual(deepWateringIntervalMonths(1), 2, "enero")
  assertEqual(deepWateringIntervalMonths(10), 2, "octubre")
  assertEqual(deepWateringIntervalMonths(4), 2, "abril")
})
test("Intervalo: verano configurado a medida (11-2)", () => {
  assertEqual(deepWateringIntervalMonths(1, 11, 2), 1, "enero en hemisferio sur")
  assertEqual(deepWateringIntervalMonths(7, 11, 2), 2, "julio en hemisferio sur")
})

// ---------------- shouldDeepWater ----------------
test("Profundo: sin drenaje nunca", () => {
  assertEqual(shouldDeepWater(makePlant({ drainage: false, last_deep_watering_at: "2025-01-01" }), new Date("2026-08-01")), false, "sin drenaje")
})
test("Profundo: suculentas (A) nunca", () => {
  assertEqual(shouldDeepWater(makePlant({ watering_style: "A", last_deep_watering_at: "2025-01-01" }), new Date("2026-08-01")), false, "A")
})
test("Profundo: sin referencia no se calcula", () => {
  assertEqual(shouldDeepWater(makePlant({ created_at: null, last_deep_watering_at: null }), new Date("2026-08-01")), false, "sin referencia")
})
test("Profundo: verano, hace 1 mes -> true", () => {
  assertEqual(shouldDeepWater(makePlant({ last_deep_watering_at: "2026-07-15" }), new Date("2026-08-15")), true, "verano 1 mes")
})
test("Profundo: verano, mismo mes -> false", () => {
  assertEqual(shouldDeepWater(makePlant({ last_deep_watering_at: "2026-08-05" }), new Date("2026-08-20")), false, "verano mismo mes")
})
test("Profundo: invierno, hace 1 mes -> false", () => {
  assertEqual(shouldDeepWater(makePlant({ last_deep_watering_at: "2025-12-15" }), new Date("2026-01-15")), false, "invierno 1 mes")
})
test("Profundo: invierno, hace 2 meses -> true", () => {
  assertEqual(shouldDeepWater(makePlant({ last_deep_watering_at: "2025-11-15" }), new Date("2026-01-15")), true, "invierno 2 meses")
})
test("Profundo: hemisferio sur (verano 11-2), 1 mes -> true", () => {
  const p = makePlant({ last_deep_watering_at: "2025-12-10" })
  assertEqual(shouldDeepWater(p, new Date("2026-01-10"), 11, 2), true, "verano austral")
})
test("Profundo: usa created_at si no hay riego profundo previo", () => {
  const p = makePlant({ created_at: "2026-06-01", last_deep_watering_at: null })
  assertEqual(shouldDeepWater(p, new Date("2026-08-20")), true, "created_at")
})

// ---------------- nextDeepWateringDate ----------------
test("Proximo profundo: sin drenaje -> null", () => {
  assertEqual(nextDeepWateringDate(makePlant({ drainage: false, last_deep_watering_at: "2026-07-01" }), new Date("2026-07-10")), null, "sin drenaje")
})
test("Proximo profundo: suculenta -> null", () => {
  assertEqual(nextDeepWateringDate(makePlant({ watering_style: "A", last_deep_watering_at: "2026-07-01" }), new Date("2026-07-10")), null, "A")
})
test("Proximo profundo: verano -> +1 mes", () => {
  const p = makePlant({ last_deep_watering_at: "2026-07-15" })
  assertEqual(iso(nextDeepWateringDate(p, new Date("2026-07-20"))), "2026-08-15", "verano")
})
test("Proximo profundo: invierno -> +2 meses", () => {
  const p = makePlant({ last_deep_watering_at: "2025-12-15" })
  assertEqual(iso(nextDeepWateringDate(p, new Date("2025-12-20"))), "2026-02-15", "invierno")
})

// ---------------- deepWateringPatch ----------------
test("Patch: si no toca, no anade nada", () => {
  const p = makePlant({ last_deep_watering_at: "2026-08-20" })
  const patch = deepWateringPatch(p, new Date("2026-08-21"))
  assertEqual(Object.keys(patch).length, 0, "patch vacio")
})
test("Patch: si toca, guarda last_deep_watering_at", () => {
  const p = makePlant({ last_deep_watering_at: "2026-06-01" })
  const when = new Date("2026-08-01T10:00:00.000Z")
  const patch = deepWateringPatch(p, when)
  assertEqual(patch.last_deep_watering_at, when.toISOString(), "patch profundo")
})

// ---------------- calculateWatering ----------------
test("Calcular: sin drenaje configurado -> null", () => {
  assertEqual(calculateWatering(makePlant({ drainage: null }), new Date("2026-08-01")), null, "drainage null")
})
test("Calcular: sin diametro de maceta -> null", () => {
  assertEqual(calculateWatering(makePlant({ pot_diameter_cm: null }), new Date("2026-08-01")), null, "sin maceta")
})
test("Calcular: riego ligero C usa fraccion 0.08-0.12", () => {
  const p = makePlant({ watering_style: "C", last_deep_watering_at: null, created_at: null })
  const a = calculateWatering(p, new Date("2026-08-10"))!
  const vol = potVolume(14)
  assertEqual(a.kind, "light", "kind")
  assertEqual(a.min, r5(vol * 0.08), "min")
  assertEqual(a.max, r5(vol * 0.12), "max")
  assert(a.instruction.indexOf("ml") > 0, "instruccion con ml")
})
test("Calcular: riego profundo C usa fraccion 0.20-0.25", () => {
  const p = makePlant({ watering_style: "C", last_deep_watering_at: "2026-07-01" })
  const a = calculateWatering(p, new Date("2026-08-20"))!
  const vol = potVolume(14)
  assertEqual(a.kind, "deep", "kind")
  assertEqual(a.min, r5(vol * 0.20), "min")
  assertEqual(a.max, r5(vol * 0.25), "max")
  assert(a.instruction.indexOf("drene") >= 0, "instruccion drenar")
})
test("Calcular: invierno no hace profundo con 1 mes", () => {
  const p = makePlant({ watering_style: "C", last_deep_watering_at: "2025-12-01" })
  const a = calculateWatering(p, new Date("2026-01-15"))!
  assertEqual(a.kind, "light", "invierno light")
})
test("Calcular: sin drenaje limita al 10% del sustrato", () => {
  const p = makePlant({ watering_style: "E", drainage: false, last_deep_watering_at: "2026-01-01" })
  const a = calculateWatering(p, new Date("2026-08-20"))!
  const vol = potVolume(14)
  assertEqual(a.kind, "light", "kind")
  assertEqual(a.max, r5(vol * 0.10), "cap 10%")
  assertEqual(a.min, r5(vol * 0.10), "cap 10% min")
})
test("Calcular: suculenta nunca profunda", () => {
  const p = makePlant({ watering_style: "A", last_deep_watering_at: "2025-01-01" })
  const a = calculateWatering(p, new Date("2026-08-20"))!
  assertEqual(a.kind, "light", "A light")
})
test("Calcular: estilo invalido usa B por defecto", () => {
  const p = makePlant({ watering_style: "Z", last_deep_watering_at: null, created_at: null })
  const a = calculateWatering(p, new Date("2026-08-10"))!
  const vol = potVolume(14)
  assertEqual(a.min, r5(vol * 0.06), "fallback min")
  assertEqual(a.max, r5(vol * 0.10), "fallback max")
})

console.log("")
console.log("RESULTADOS: " + passed + " aprobados, " + failed + " fallidos")
process.exit(failed > 0 ? 1 : 0)