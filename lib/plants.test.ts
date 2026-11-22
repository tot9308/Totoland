// ============================================================================
// TESTS PARA LÓGICA DE RIEGO - plantas.test.ts
// Ejecutar con: node --experimental-strip-types lib/plants.test.ts
// ============================================================================

const LIGHT_FRACTION: Record<string, [number, number]> = {
  A: [0.05, 0.08], B: [0.06, 0.10], C: [0.08, 0.12],
  D: [0.10, 0.14], E: [0.12, 0.16],
}
const DEEP_FRACTION: Record<string, [number, number] | null> = {
  A: null, B: [0.18, 0.22], C: [0.20, 0.25], D: [0.22, 0.28], E: [0.25, 0.30],
}

function getLightFraction(style: string): [number, number] {
  return LIGHT_FRACTION[style] ?? LIGHT_FRACTION.B
}
function getDeepFraction(style: string): [number, number] | null {
  return DEEP_FRACTION[style] ?? null
}

function shouldDeepWater(
  drainage: boolean | null,
  wateringStyle: string,
  lastDeepWateringAt: string | null,
  createdAt: string | null,
  today: Date
): boolean | null {
  if (drainage == null) return null
  if (!drainage) return false
  if (wateringStyle === "A") return false
  const reference = lastDeepWateringAt ?? createdAt
  if (!reference) return false
  if (wateringStyle === "B") {
    const d1 = new Date(reference)
    const monthsDiff = (today.getFullYear() - d1.getFullYear()) * 12 + (today.getMonth() - d1.getMonth())
    return monthsDiff >= 2
  }
  const lastMonth = new Date(reference).getMonth()
  const lastYear = new Date(reference).getFullYear()
  const curMonth = today.getMonth()
  const curYear = today.getFullYear()
  return !(lastMonth === curMonth && lastYear === curYear)
}

let passed = 0
let failed = 0
function test(name: string, fn: () => void) {
  try { fn(); passed++; console.log("✅ " + name) }
  catch (e: any) { failed++; console.log("❌ " + name + ": " + e.message) }
}
function assert(condition: boolean, message: string) { if (!condition) throw new Error(message) }
function assertEqual(actual: any, expected: any, message: string) {
  if (actual !== expected) throw new Error(message + ": esperado " + JSON.stringify(expected) + ", obtenido " + JSON.stringify(actual))
}// ============ TABLA DE FRACCIONES ============
test("LIGHT_FRACTION.A (suculentas) = [0.05, 0.08]", () => {
  assertEqual(getLightFraction("A")[0], 0.05, "min A")
  assertEqual(getLightFraction("A")[1], 0.08, "max A")
})
test("LIGHT_FRACTION.B (escaso) = [0.06, 0.10]", () => {
  assertEqual(getLightFraction("B")[0], 0.06, "min B")
  assertEqual(getLightFraction("B")[1], 0.10, "max B")
})
test("LIGHT_FRACTION.C (medio) = [0.08, 0.12]", () => {
  assertEqual(getLightFraction("C")[0], 0.08, "min C")
  assertEqual(getLightFraction("C")[1], 0.12, "max C")
})
test("LIGHT_FRACTION.D (frecuente) = [0.10, 0.14]", () => {
  assertEqual(getLightFraction("D")[0], 0.10, "min D")
  assertEqual(getLightFraction("D")[1], 0.14, "max D")
})
test("LIGHT_FRACTION.E (tropicales) = [0.12, 0.16]", () => {
  assertEqual(getLightFraction("E")[0], 0.12, "min E")
  assertEqual(getLightFraction("E")[1], 0.16, "max E")
})
test("LIGHT_FRACTION estilo desconocido usa B por defecto", () => {
  assertEqual(getLightFraction("Z")[0], 0.06, "min fallback")
  assertEqual(getLightFraction("Z")[1], 0.10, "max fallback")
})
test("DEEP_FRACTION.A = null (suculentas nunca profundo)", () => {
  assertEqual(getDeepFraction("A"), null, "A deep null")
})
test("DEEP_FRACTION.B = [0.18, 0.22]", () => {
  assertEqual(getDeepFraction("B")?.[0], 0.18, "B deep min")
  assertEqual(getDeepFraction("B")?.[1], 0.22, "B deep max")
})
test("DEEP_FRACTION.C = [0.20, 0.25]", () => {
  assertEqual(getDeepFraction("C")?.[0], 0.20, "C deep min")
  assertEqual(getDeepFraction("C")?.[1], 0.25, "C deep max")
})
test("DEEP_FRACTION.D = [0.22, 0.28]", () => {
  assertEqual(getDeepFraction("D")?.[0], 0.22, "D deep min")
  assertEqual(getDeepFraction("D")?.[1], 0.28, "D deep max")
})
test("DEEP_FRACTION.E = [0.25, 0.30]", () => {
  assertEqual(getDeepFraction("E")?.[0], 0.25, "E deep min")
  assertEqual(getDeepFraction("E")?.[1], 0.30, "E deep max")
)
// ============ shouldDeepWater ============
test("shouldDeepWater: drainage=null → null (no calcular)", () => {
  const result = shouldDeepWater(null, "B", null, null, new Date("2026-01-15"))
  assertEqual(result, null, "drainage null → null")
})
test("shouldDeepWater: drainage=false → false (sin drenaje nunca profundo)", () => {
  const result = shouldDeepWater(false, "C", null, null, new Date("2026-01-15"))
  assertEqual(result, false, "sin drenaje → false")
})
test("shouldDeepWater: estilo A (suculenta) → false (nunca profundo)", () => {
  const result = shouldDeepWater(true, "A", "2026-01-01", "2026-01-01", new Date("2026-01-15"))
  assertEqual(result, false, "suculenta → false")
})
test("shouldDeepWater: B, last hace 3 meses → true (profundo)", () => {
  const result = shouldDeepWater(true, "B", "2025-10-15", "2025-10-15", new Date("2026-01-15"))
  assertEqual(result, true, "B 3 meses → true")
})
test("shouldDeepWater: B, last hace 1 mes → false (no es momento aún)", () => {
  const result = shouldDeepWater(true, "B", "2025-12-15", "2025-12-15", new Date("2026-01-15"))
  assertEqual(result, false, "B 1 mes → false")
})
test("shouldDeepWater: B, last hace exactamente 2 meses → true", () => {
  const result = shouldDeepWater(true, "B", "2025-11-15", "2025-11-15", new Date("2026-01-15"))
  assertEqual(result, true, "B 2 meses exactos → true")
})
test("shouldDeepWater: C, primer riego del mes → true", () => {
  const today = new Date("2026-01-15")
  const result = shouldDeepWater(true, "C", null, "2026-01-01", today)
  assertEqual(result, true, "C primer riego del mes → true")
})
test("shouldDeepWater: C, segundo riego del mismo mes → false", () => {
  const today = new Date("2026-01-20")
  const result = shouldDeepWater(true, "C", "2026-01-05", "2026-01-01", today)
  assertEqual(result, false, "C segundo riego mes → false")
})
test("shouldDeepWater: C, primer riego del mes siguiente → true", () => {
  const today = new Date("2026-02-05")
  const result = shouldDeepWater(true, "C", "2026-01-20", "2026-01-01", today)
  assertEqual(result, true, "C nuevo mes → true")
})
test("shouldDeepWater: E, primer riego del mes → true", () => {
  const today = new Date("2026-03-10")
  const result = shouldDeepWater(true, "E", null, "2026-03-01", today)
  assertEqual(result, true, "E primer riego mes → true")
})
test("shouldDeepWater: sin last_deep_watering_at ni created_at → false", () => {
  const result = shouldDeepWater(true, "C", null, null, new Date("2026-01-15"))
  assertEqual(result, false, "sin referencia → false")
})
// ============ CAP SIN DRENAJE ============
test("Cap sin drenaje: fracción ligera B (0.06-0.10) → capped a 0.06-0.10", () => {
  const light = LIGHT_FRACTION.B
  const capped = [Math.min(light[0], 0.10), Math.min(light[1], 0.10)]
  assertEqual(capped[0], 0.06, "cap min")
  assertEqual(capped[1], 0.10, "cap max")
})
test("Cap sin drenaje: fracción profunda C (0.20-0.25) → capped a 0.10", () => {
  const deep = DEEP_FRACTION.C
  const capped = [Math.min(deep![0], 0.10), Math.min(deep![1], 0.10)]
  assertEqual(capped[0], 0.10, "deep cap min")
  assertEqual(capped[1], 0.10, "deep cap max")
})
console.log("\n═════════════════════════════════════════════════════════════════════════════")
console.log("RESULTADOS: " + passed + " aprobados, " + failed + " fallidos")
console.log("═════════════════════════════════════════════════════════════════════════════\n")
process.exit(failed > 0 ? 1 : 0)
