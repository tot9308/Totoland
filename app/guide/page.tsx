import Link from "next/link"
import GuideProtocols from "@/components/GuideProtocols"
import ExpandAll from "@/components/ExpandAll"
import SymptomChecker from "@/components/SymptomChecker"

function S({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 rounded-xl bg-[#faf7f0] p-4 shadow-sm">
      <h2 className="mb-2 text-lg font-semibold text-stone-800">{title}</h2>
      <div className="space-y-2 text-sm text-stone-700">{children}</div>
    </section>
  )
}

function D({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="rounded-lg bg-white/70 p-3">
      <summary className="cursor-pointer font-medium text-stone-800">{title}</summary>
      <div className="mt-2 space-y-2">{children}</div>
    </details>
  )
}

export default function GuidePage() {
  return (
    <main className="min-h-screen bg-stone-50 p-4 md:p-8">
      <header className="mb-4 flex items-center gap-3">
        <Link href="/" className="text-sm text-stone-600 hover:underline">← Volver</Link>
        <h1 className="text-2xl font-bold text-stone-800">📚 Guía de Totoland</h1>
      </header>
<SymptomChecker />
      <ExpandAll />

      {/* ---------- Lo esencial, siempre visible ---------- */}

      <S title="💧 Riego: estilos A/B/C y cuánta agua">
        <p><b>A · Siempre húmedo:</b> no dejar secar nunca (helechos, calatheas, fittonia). Comprueba cada 2-3 días.</p>
        <p><b>B · Secar 1-2 cm superficial:</b> mete el dedo; si solo está seca la capa de arriba, aún no. Si seca hasta la 2ª falange, riega.</p>
        <p><b>C · Secar completamente:</b> la maceta se nota <b>ligera</b> al levantarla y la tierra está seca del todo (cactus, crasas, sansevieria).</p>
        <p>🫗 <b>¿Cuánta agua?</b> La fija la maceta, no el calendario. Riega hasta que <b>salga por el agujero de drenaje</b>. Como referencia, entre un 8% y un 18% del volumen del sustrato:</p>
        <ul className="list-disc pl-5">
          <li>Maceta de 10 cm ≈ <b>50–100 ml</b> (un chupito de café)</li>
          <li>Maceta de 14 cm ≈ <b>90–140 ml</b> (un vasito)</li>
          <li>Maceta de 20 cm ≈ <b>320–480 ml</b> (una lata de refresco pequeña)</li>
          <li>Maceta de 30 cm ≈ <b>1–1,5 L</b></li>
        </ul>
        <p>La app te calcula el rango exacto en cada ficha si pones el diámetro de la maceta.</p>
        <p>🍽️ <b>El plato:</b> no cambia la cantidad. Vacíalo a los 10-15 min de regar (agua estancada = raíces podridas). Excepción: carnívoras, que viven con plato de agua destilada.</p>
        <p>⏰ <b>Con retraso:</b> NO eches más agua de la cuenta por compensar. Misma cantidad, pero en <b>dos tandas</b> (riegas, esperas 10 min, repites) o <b>remojo</b> de la maceta 10-15 min en un cubo. Y no abones hasta que se recupere.</p>
        <p>🌧️ <b>Agua del grifo:</b> déjala reposar unas horas en una jarra abierta para que se vaya el cloro. Calatheas, azaleas y carnívoras prefieren agua sin cal o destilada.</p>
      </S>

      <S title="☀️ Luz: los 4 niveles en tu casa">
        <p><b>1 · Sol directo:</b> junto a ventana sur o terraza, más de 6 h de sol. Cactus, crasas, geranios.</p>
        <p><b>2 · Indirecta brillante:</b> junto a ventana este/oeste, o sur con cortina fina. La mayoría de tropicales.</p>
        <p><b>3 · Semisombra:</b> a 1-2 m de la ventana o tras otra planta. Luz suficiente para leer sin sol.</p>
        <p><b>4 · Sombra / poca luz:</b> interior sin ventana cerca, pasillos. Solo las duras (aspidistra, sansevieria…).</p>
        <p>🖐️ <b>Truco de la sombra:</b> pon tu mano entre la luz y la planta a 30 cm. Sombra nítida y marcada = nivel 1-2. Sombra suave = 3. Casi nada = 4.</p>
        <p>Señales de <b>poca luz</b>: crece estirada, hojas nuevas pequeñas, pierde colores. De <b>demasiada</b>: manchas blanquecinas o quemadas hacia el sol.</p>
      </S>

      <S title="🔣 Símbolos y cómo piensa la app">
        <p>💧 Regar · 💧+🌫 Regar y pulverizar · ⋮ Más acciones (editar, evento, PDF, tareas, cementerio) · ⭐ Foto principal · 🔄 Sincronizar · ✏️ Editar · 🖨 PDF.</p>
        <p><b>"Le toca"</b> sale cuando han pasado más días que su frecuencia desde el último riego (o si nunca se regó).</p>
        <p><b>Verano/invierno:</b> cada planta tiene dos frecuencias; la app usa la de la temporada que marques en ⚙️ Ajustes.</p>
        <p><b>🔄 Sincronizar:</b> ajusta frecuencias a múltiplos de un ciclo común (p. ej. 7 días) dentro de tu tolerancia, para regar en tandas el mismo día. También permite varias veces por ronda (p. ej. una planta de 4 días se convierte en "2 riegos por semana").</p>
        <p><b>🩺 Seguimiento:</b> eliges tipo de problema, culpable y gravedad, y la app genera un plan por días con pasos y chequeos. Los días de chequeo te avisa en la home y por push.</p>
        <p><b>🪦 Cementerio:</b> las plantas no se borran, se entierran con su historia. Puedes revivirlas o borrarlas del todo.</p>
      </S>

      <S title="🪴 Sustrato: los 4 tipos">
        <p><b>1 Universal:</b> la mayoría de plantas de interior.</p>
        <p><b>2 Mezcla porosa:</b> cactus y crasas; drena rapidísimo.</p>
        <p><b>3 Ácido:</b> hortensias, azaleas, camelias, gardenias (tierra de brezo/erikas).</p>
        <p><b>4 Corteza o musgo:</b> orquídeas y epífitas (raíces al aire).</p>
        <p>Señales de trasplante: raíces por el agujero, agua que pasa de largo sin empapar, o más de 2 años sin cambiar.</p>
      </S>

      <S title="🌾 Abono sin miedo">
        <p><b>NPK</b> = Nitrógeno (hojas), Fósforo (raíz y flor), Potasio (salud general). Un "equilibrado" vale para casi todo; "rico en fósforo" para las que florecen.</p>
        <p>Regla de oro: <b>mitad de dosis</b> de la que diga el bote, y solo en primavera-verano. En invierno, la mayoría descansa: no abones.</p>
        <p>Nunca abones una planta estresada (recién trasplantada, con retraso de riego o enferma): primero recupera, luego alimenta.</p>
      </S>

      <S title="🐶 Toxicidad">
        <p>Si tu mascota mordisquea una planta marcada como tóxica: retira restos de la boca, anota el nombre científico y llama al veterinario con ese nombre en la mano. No esperes a ver síntomas.</p>
        <p>Las más conflictivas en casa: lirio de paz, monstera, poto, dieffenbachia, ciclamen y azalea. Colócalas altas o fuera de alcance.</p>
      </S>

      {/* ---------- Referencia larga, con desplegables ---------- */}

      <S title="💦 Humedad y pulverizado: cuándo y cómo">
        <p>Pulverizar sube la humedad solo durante unos minutos. Para subirla de verdad en la habitación, lo que ayuda es <b>agrupar plantas</b>, <b>bandeja con guijarros y agua</b> (la maceta encima, sin tocar el agua), o ubicarlas en baño/cocina luminosos.</p>
        <p><b>Sí pulverizar:</b> tropicales de selva (calathea, maranta, helechos, fittonia, palmeras de interior, alocasia).</p>
        <p><b>Pulverizar con moderación:</b> solo en verano o cuando la calefacción esté encendida y el aire sea muy seco.</p>
        <p><b>Nunca pulverizar:</b> crasas, cactus, violeta africana, begonia rex, plantas con hojas peludas. El agua en sus hojas mancha o pudre.</p>
        <D title="🔧 Cómo pulverizar bien (8 reglas)">
          <ul className="list-disc pl-5">
            <li>Usa un pulverizador de <b>gota fina</b> (nebulizador).</li>
            <li>Distancia: unos <b>30-40 cm</b> de la planta. Nunca a quemarropa.</li>
            <li><b>Niebla, no lluvia</b>: la idea es crear bruma alrededor, no empapar las hojas.</li>
            <li>Pulveriza por la <b>mañana</b>, nunca al atardecer: así las hojas se secan antes de la noche y no proliferan hongos.</li>
            <li>Nunca al sol directo: las gotitas hacen efecto lupa y queman la hoja.</li>
            <li>Pulveriza también por el <b>envés</b> de las hojas, donde están los estomas.</li>
            <li><b>No mojes las flores</b>: se estropean antes.</li>
            <li>Agua templada, nunca fría del grifo (shock térmico). Limpia de vez en cuando la boquilla para que no suelte goterones.</li>
          </ul>
        </D>
      </S>

      <S title="🗓️ El año de tus plantas en Bilbao">
        <p>Despliega la estación en la que estés para ver qué toca hacer.</p>
        <D title="🌸 Primavera">
          <p>Trasplantes, reanudar abono, limpiar hojas, sacar al exterior las de balcón poco a poco (aclimatación).</p>
        </D>
        <D title="☀️ Verano">
          <p>Más riego y vigilancia de plagas (araña roja con calor seco). Riega a primera o última hora, nunca a mediodía en exterior.</p>
        </D>
        <D title="🍂 Otoño">
          <p>Reducir riego progresivamente, meter dentro lo sensible al frío, última poda ligera y limpieza de hojas secas.</p>
        </D>
        <D title="❄️ Invierno">
          <p>Riego mínimo, lejos de radiadores y de corrientes; luz al máximo (acerca a las ventanas). No abonar.</p>
        </D>
      </S>
    </main>
  )
}