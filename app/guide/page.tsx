import Link from "next/link"

function S({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 rounded-xl bg-[#faf7f0] p-4 shadow-sm">
      <h2 className="mb-2 text-lg font-semibold text-stone-800">{title}</h2>
      <div className="space-y-2 text-sm text-stone-700">{children}</div>
    </section>
  )
}

export default function GuidePage() {
  return (
    <main className="min-h-screen bg-stone-50 p-4 md:p-8">
      <header className="mb-6 flex items-center gap-3">
        <Link href="/" className="text-sm text-stone-600 hover:underline">← Volver</Link>
        <h1 className="text-2xl font-bold text-stone-800">📚 Guía de Totoland</h1>
      </header>

      <S title="☀️ Luz: los 4 niveles en tu casa">
        <p><b>1 · Sol directo:</b> junto a ventana sur o terraza, más de 6 h de sol. Cactus, crasas, geranios.</p>
        <p><b>2 · Indirecta brillante:</b> junto a ventana este/oeste, o sur con cortina fina. La mayoría de tropicales.</p>
        <p><b>3 · Semisombra:</b> a 1-2 m de la ventana o tras otra planta. Luz suficiente para leer sin sol.</p>
        <p><b>4 · Sombra / poca luz:</b> interior sin ventana cerca, pasillos. Solo las duras (aspidistra, sansevieria…).</p>
        <p>🖐️ <b>Truco de la sombra:</b> pon tu mano entre la luz y la planta a 30 cm. Sombra nítida y marcada = nivel 1-2. Sombra suave = 3. Casi nada = 4.</p>
        <p>Señales de <b>poca luz</b>: crece estirada, hojas nuevas pequeñas, pierde colores. De <b>demasiada</b>: manchas blanquecinas o quemadas hacia el sol.</p>
      </S>

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

      <S title="💦 Humedad y pulverizado: cuándo y cómo">
        <p>Pulverizar sube la humedad solo durante unos minutos. Para subirla de verdad en la habitación, lo que ayuda es <b>agrupar plantas</b>, <b>bandeja con guijarros y agua</b> (la maceta encima, sin tocar el agua), o ubicarlas en baño/cocina luminosos.</p>
        <p><b>Sí pulverizar:</b> tropicales de selva (calathea, maranta, helechos, fittonia, palmeras de interior, alocasia).</p>
        <p><b>Pulverizar con moderación:</b> solo en verano o cuando la calefacción esté encendida y el aire sea muy seco.</p>
        <p><b>Nunca pulverizar:</b> crasas, cactus, violeta africana, begonia rex, plantas con hojas peludas. El agua en sus hojas mancha o pudre.</p>
        <p>🔧 <b>Cómo pulverizar bien:</b></p>
        <ul className="list-disc pl-5">
          <li>Usa un pulverizador de <b>gota fina</b> (nebulizador).</li>
          <li>Distancia: unos <b>30-40 cm</b> de la planta. Nunca a quemarropa.</li>
          <li><b>Niebla, no lluvia</b>: la idea es crear bruma alrededor, no empapar las hojas.</li>
          <li>Pulveriza por la <b>mañana</b>, nunca al atardecer: así las hojas se secan antes de la noche y no proliferan hongos.</li>
          <li>Nunca al sol directo: las gotitas hacen efecto lupa y queman la hoja.</li>
          <li>Pulveriza también por el <b>envés</b> de las hojas, donde están los estomas.</li>
          <li><b>No mojes las flores</b>: se estropean antes.</li>
          <li>Agua templada, nunca fría del grifo (shock térmico).</li>
          <li>Limpia de vez en cuando la boquilla del pulverizador para que no se atasque y suelte goterones.</li>
        </ul>
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

      <S title="🩺 Recuperación tras sequía: protocolo científico">
        <p>Cuando una planta pasa sed, ocurren cosas en cadena: cierra estomas (deja de hacer fotosíntesis), pierde turgencia (hojas mustias), sufre daño oxidativo, y si la sequía es larga, se forman burbujas en los vasos del xilema (cavitación) que son parcialmente irreversibles.</p>
        <p><b>La clave:</b> rehidratar de golpe una planta muy seca puede ser peor que dejarla seca un poco más. El shock osmótico rompe células, y las raíces dañadas no pueden absorber el exceso → pudrición.</p>

        <h3 className="mt-4 font-semibold text-stone-800">⏱️ Escala de severidad según días sin agua</h3>
        <ul className="list-disc pl-5">
          <li><b>🟢 Leve (1-3 días):</b> cierre estomático, hojas algo mustias. Recuperación en horas-días.</li>
          <li><b>🟡 Moderada (4-14 días):</b> hojas amarillas/marrones en bordes, turgencia perdida. Recuperación en 1-3 semanas.</li>
          <li><b>🟠 Severa (15-30 días):</b> muchas hojas muertas, cavitación parcial. Recuperación en 1-3 meses.</li>
          <li><b>🔴 Crítica (&gt;30 días):</b> cavitación extensa, raíz parcialmente muerta. Incierta.</li>
        </ul>

        <h3 className="mt-4 font-semibold text-stone-800">🌿 Diferencias por tipo de planta</h3>
        <p><b>Suculentas y cactus:</b> aguantan semanas-meses. Tras sequía: riego poco, sin remojo. Exceso = pudrición rápida.</p>
        <p><b>Epífitas (orquídeas, tillandsias):</b> rehidratación por inmersión breve o pulverizado abundante. Escurre bien.</p>
        <p><b>Tropicales de selva (calathea, helechos):</b> tolerancia muy baja. Rehidratación gradual + humedad alta + sombra 2-3 días.</p>
        <p><b>Todoterreno (monstera, poto):</b> tolerancia media. Rehidratación en dos tandas, sin sol directo 1-2 días.</p>
        <p><b>Mediterráneas (romero, lavanda):</b> aguantan bien. Riego moderado, buen drenaje.</p>

        <h3 className="mt-4 font-semibold text-stone-800">📋 Protocolo paso a paso</h3>
        <ol className="list-decimal pl-5">
          <li><b>Evaluación:</b> toca el sustrato. Si está muy seco y compacto, se ha vuelto hidrofóbico (repele el agua).</li>
          <li><b>Rehidratación gradual:</b>
            <ul className="list-disc pl-5">
              <li>Sustrato hidrofóbico: remojo de la maceta en 2-3 cm de agua durante <b>15-20 min máximo</b>.</li>
              <li>Sustrato normal: riega con <b>media dosis</b>, espera 15-20 min, y luego otra media dosis.</li>
            </ul>
          </li>
          <li><b>Ambiente de recuperación (24-72 h):</b>
            <ul className="list-disc pl-5">
              <li>Aleja del sol directo 2-3 días (aunque sea planta de sol).</li>
              <li>Si es tropical: aumenta humedad (bandeja con guijarros, agrupa con otras plantas).</li>
              <li>Temperatura estable, sin corrientes.</li>
            </ul>
          </li>
          <li><b>Poda de daños (día 3-7):</b> quita solo hojas totalmente secas y crujientes. Las amarillas pueden recuperarse.</li>
          <li><b>Zona prohibida (2-4 semanas):</b>
            <ul className="list-disc pl-5">
              <li>🚫 No abones (raíces dañadas no absorben, se queman).</li>
              <li>🚫 No trasplantes (más estrés).</li>
              <li>🚫 No podes drástico.</li>
              <li>🚫 No apliques fitosanitarios.</li>
            </ul>
          </li>
        </ol>

        <h3 className="mt-4 font-semibold text-stone-800">🔍 Chequeos progresivos</h3>
        <ul className="list-disc pl-5">
          <li><b>Día 3:</b> ¿se han erguido las hojas? ¿hay nuevas hojas mustias?</li>
          <li><b>Día 7:</b> ¿están brotando yemas nuevas?</li>
          <li><b>Día 21:</b> ¿el crecimiento ha vuelto a la normalidad?</li>
          <li><b>Día 45</b> (solo estrés severo/crítico): ¿ha sobrevivido? ¿quedan secuelas?</li>
        </ul>

        <p className="mt-4"><b>La app te guía:</b> al regar con retraso o marcar manualmente "en recuperación", calcula la severidad según tipo de planta y te programa los chequeos. En cada uno te pregunta qué observas y te da el paso siguiente.</p>
      </S>

      <S title="🔣 Símbolos y cómo piensa la app">
        <p>💧 Regar · 💧+🌫 Regar y pulverizar · ＋ Más acciones (observaciones, plagas…) · ⭐ Foto principal · 🪦 Cementerio · 🔄 Sincronizar · 🔔 Avisos · ✏️ Editar · 🖨 PDF.</p>
        <p><b>"Le toca"</b> sale cuando han pasado más días que su frecuencia desde el último riego (o si nunca se regó).</p>
        <p><b>Verano/invierno:</b> cada planta tiene dos frecuencias; la app usa la de la temporada que marques en ⚙️ Ajustes.</p>
        <p><b>🔄 Sincronizar:</b> ajusta frecuencias a múltiplos de un ciclo común (p. ej. 7 días) dentro de tu tolerancia, para regar en tandas el mismo día. También permite varias veces por ronda (p. ej. una planta de 4 días se convierte en "2 riegos por semana").</p>
        <p><b>🩺 Recuperación:</b> cuando riegas con retraso o marcas manualmente una planta, la app calcula la severidad según tipo y te guía con instrucciones específicas y chequeos progresivos.</p>
        <p><b>🪦 Cementerio:</b> las plantas no se borran, se entierran con su historia. Puedes revivirlas o borrarlas del todo.</p>
      </S>

      <S title="🗓️ El año de tus plantas en Bilbao">
        <p><b>Primavera:</b> trasplantes, reanudar abono, limpiar hojas, sacar al exterior las de balcón poco a poco (aclimatación).</p>
        <p><b>Verano:</b> más riego y vigilancia de plagas (araña roja con calor seco). Riega a primera o última hora, nunca a mediodía en exterior.</p>
        <p><b>Otoño:</b> reducir riego progresivamente, meter dentro lo sensible al frío, última poda ligera y limpieza de hojas secas.</p>
        <p><b>Invierno:</b> riego mínimo, lejos de radiadores y de corrientes; luz al máximo (acerca a las ventanas). No abonar.</p>
      </S>
    </main>
  )
}