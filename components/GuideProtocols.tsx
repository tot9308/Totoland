function P({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <details className="rounded-lg bg-white/70 p-3">
      <summary className="cursor-pointer font-medium text-stone-800">{name}</summary>
      <div className="mt-1 space-y-1 text-sm text-stone-700">{children}</div>
    </details>
  )
}
function D({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="rounded-lg bg-white/70 p-3">
      <summary className="cursor-pointer font-medium text-stone-800">{title}</summary>
      <div className="mt-2 space-y-2 text-sm text-stone-700">{children}</div>
    </details>
  )
}
export default function GuideProtocols() {
  return (
    <section className="mb-8 space-y-6">
      <div>
        <h2 className="mb-2 font-serif text-xl font-semibold text-stone-800">💧 Sequía: la ciencia del rescate</h2>
        <p className="mb-2 text-sm text-stone-700">
          Por qué rehidratar de golpe puede ser peor, y cómo se recupera una planta según su tipo y su severidad.
        </p>
        <div className="space-y-2">
          <D title="🧠 Qué le pasa a la planta cuando pasa sed">
            <p>Cierra estomas (deja de hacer fotosíntesis), pierde turgencia (hojas mustias), sufre daño oxidativo y, si la sequía es larga, se forman burbujas en los vasos del xilema (cavitación) parcialmente irreversibles.</p>
            <p><b>La clave:</b> rehidratar de golpe una planta muy seca puede ser peor que dejarla seca un poco más: el shock osmótico rompe células y las raíces dañadas no absorben el exceso → pudrición.</p>
          </D>
          <D title="⏱️ Escala de severidad según días sin agua">
            <ul className="list-disc space-y-1 pl-5">
              <li><b>🟢 Leve (1-3 días):</b> cierre estomático, hojas algo mustias. Recuperación en horas-días.</li>
              <li><b>🟡 Moderada (4-14 días):</b> hojas amarillas/marrones en bordes, turgencia perdida. Recuperación en 1-3 semanas.</li>
              <li><b>🟠 Severa (15-30 días):</b> muchas hojas muertas, cavitación parcial. Recuperación en 1-3 meses.</li>
              <li><b>🔴 Crítica (&gt;30 días):</b> cavitación extensa, raíz parcialmente muerta. Incierta.</li>
            </ul>
          </D>
          <D title="🌿 Diferencias por tipo de planta">
            <p><b>Suculentas y cactus:</b> aguantan semanas-meses. Tras sequía: riego poco, sin remojo. Exceso = pudrición rápida.</p>
            <p><b>Epífitas (orquídeas, tillandsias):</b> rehidratación por inmersión breve o pulverizado abundante. Escurre bien.</p>
            <p><b>Tropicales de selva (calathea, helechos):</b> tolerancia muy baja. Rehidratación gradual + humedad alta + sombra 2-3 días.</p>
            <p><b>Todoterreno (monstera, poto):</b> tolerancia media. Rehidratación en dos tandas, sin sol directo 1-2 días.</p>
            <p><b>Mediterráneas (romero, lavanda):</b> aguantan bien. Riego moderado, buen drenaje.</p>
          </D>
          <D title="📋 Protocolo de rescate paso a paso">
            <ol className="list-decimal space-y-1 pl-5">
              <li><b>Evaluación:</b> toca el sustrato; si está muy seco y compacto se ha vuelto hidrofóbico (repele el agua).</li>
              <li><b>Rehidratación gradual:</b> sustrato hidrofóbico → remojo en 2-3 cm de agua 15-20 min máximo; sustrato normal → media dosis, espera 15-20 min, otra media dosis.</li>
              <li><b>Ambiente de recuperación (24-72 h):</b> sin sol directo 2-3 días; si es tropical, sube humedad; temperatura estable sin corrientes.</li>
              <li><b>Poda de daños (día 3-7):</b> solo hojas totalmente secas y crujientes; las amarillas pueden recuperarse.</li>
              <li><b>Zona prohibida (2-4 semanas):</b> no abones, no trasplantes, no podes drástico, no fitosanitarios.</li>
            </ol>
          </D>
          <D title="🔍 Chequeos progresivos">
            <ul className="list-disc space-y-1 pl-5">
              <li><b>Día 3:</b> ¿se han erguido las hojas? ¿hay nuevas hojas mustias?</li>
              <li><b>Día 7:</b> ¿están brotando yemas nuevas?</li>
              <li><b>Día 21:</b> ¿el crecimiento ha vuelto a la normalidad?</li>
              <li><b>Día 45</b> (solo estrés severo/crítico): ¿ha sobrevivido? ¿quedan secuelas?</li>
            </ul>
          </D>
        </div>
      </div>
      <div>
        <h2 className="mb-2 font-serif text-xl font-semibold text-stone-800">🩺 Seguimiento de problemas (protocolos)</h2>
        <div className="space-y-2 text-sm text-stone-700">
          <p>
            Cuando una planta tenga un problema (sequía, plaga, enfermedad, exceso de riego o de abono,
            un golpe, mala luz o un golpe de calor), entra en su ficha y pulsa{" "}
            <b>🩺 Iniciar seguimiento</b>. Elige el <b>tipo</b>, el <b>culpable</b> (si lo intuyes) y la{" "}
            <b>gravedad</b>: la app genera un plan de pasos por días.
          </p>
          <p>
            <b>Cómo se lee:</b> los pasos de días pasados se marcan ✓ solos; el paso de hoy va
            destacado con borde terracota. El plan corre con el calendario, no hay que avanzarlo a mano.
          </p>
          <p>
            <b>Tus tres botones:</b> ✅ <i>Recuperada</i> cierra y anota · 💧 <i>Sigo el tratamiento</i>{" "}
            registra y programa el próximo chequeo · 🩺 <i>Sin cambios / empeora</i> registra el
            estancamiento y, si se repite, <b>sube la gravedad</b> y te avisa.
          </p>
          <p>
            Los días que toca chequeo, la <b>home</b> muestra un aviso bajo la tarjeta y el{" "}
            <b>aviso diario</b> lo incluye en la notificación.
          </p>
        </div>
      </div>

      <div>
        <h2 className="mb-2 font-serif text-xl font-semibold text-stone-800">🐛 Guía rápida de plagas</h2>
        <p className="mb-2 text-xs text-stone-500">Despliega la tuya para ver cómo reconocerla y qué hacer.</p>
        <div className="space-y-2">
          <P name="🐛 Oruga">
            <p><b>Reconocer:</b> mordiscos grandes en hojas y cacas negras. Son nocturnas.</p>
            <p><b>Qué hacer:</b> retirada manual al anochecer con linterna + Bt (comestibles) o jabón potásico; reaplicar días 4 y 7. ≈2 semanas.</p>
          </P>
          <P name="🐛 Pulgón">
            <p><b>Reconocer:</b> brotes tiernos pegajosos y apiñados.</p>
            <p><b>Qué hacer:</b> chorro de agua + jabón potásico (días 1, 4 y 7). ≈2 semanas.</p>
          </P>
          <P name="🐛 Cochinilla de hojas">
            <p><b>Reconocer:</b> bolitas algodonosas en axilas y envés.</p>
            <p><b>Qué hacer:</b> algodón con alcohol 70° (prueba antes en una hoja) + jabón. ≈4 semanas.</p>
          </P>
          <P name="🐛 Cochinilla de raíz">
            <p><b>Reconocer:</b> algodón en las raíces al trasplantar.</p>
            <p><b>Qué hacer:</b> lavar raíces, trasplante a sustrato y maceta limpios, riego tratado. ≈4 semanas con aislamiento estricto.</p>
          </P>
          <P name="🐛 Escama (cochinilla acorazada)">
            <p><b>Reconocer:</b> escudos fijos marrones que no se caen al frotar.</p>
            <p><b>Qué hacer:</b> raspar cada escudo con palillo + inspección y raspado semanal. ≈6 semanas.</p>
          </P>
          <P name="🐛 Araña roja">
            <p><b>Reconocer:</b> punteado amarillo y telarañas finas en el envés.</p>
            <p><b>Qué hacer:</b> humedad del <i>entorno</i> (bandeja con piedras y agua), no del follaje + jabón días 1, 4, 7 y 10. ≈2 semanas.</p>
          </P>
          <P name="🐛 Mosca blanca">
            <p><b>Reconocer:</b> nube de insectillos al agitar la planta.</p>
            <p><b>Qué hacer:</b> trampas amarillas + jabón en el envés. ≈2 semanas.</p>
          </P>
          <P name="🐛 Trips">
            <p><b>Reconocer:</b> marcas plateadas y brotes deformes.</p>
            <p><b>Qué hacer:</b> trampas azules + jabón y neem. ≈3 semanas.</p>
          </P>
          <P name="🐛 Mosca del sustrato">
            <p><b>Reconocer:</b> mosquitas negras que salen del sustrato.</p>
            <p><b>Qué hacer:</b> dejar secar + capa de arena + trampas amarillas; si persiste, riego con BTI ("bits"). ≈2 semanas.</p>
          </P>
          <P name="🐛 Caracol / babosa">
            <p><b>Reconocer:</b> agujeros grandes y rastros brillantes de baba.</p>
            <p><b>Qué hacer:</b> caza nocturna + barreras (cáscara de huevo, cerveza). ≈10 días.</p>
          </P>
          <P name="🐛 Minador de hojas">
            <p><b>Reconocer:</b> galerías serpenteantes dentro de la hoja.</p>
            <p><b>Qué hacer:</b> podar las hojas con galería (el tratamiento no llega a la larva). ≈1 semana.</p>
          </P>
        </div>
      </div>

      <div>
        <h2 className="mb-2 font-serif text-xl font-semibold text-stone-800">🦠 Enfermedades y otros problemas</h2>
        <div className="space-y-2">
          <P name="🦠 Oídio">
            <p><b>Reconocer:</b> polvo blanco como harina.</p>
            <p><b>Qué hacer:</b> poda de hojas blancas + ventilación + bicarbonato o azufre. El cierre se juzga por tejido <i>nuevo</i> limpio.</p>
          </P>
          <P name="🦠 Mildiu">
            <p><b>Reconocer:</b> manchas amarillas por arriba, pelusilla gris por el envés.</p>
            <p><b>Qué hacer:</b> poda + bajar humedad + cobre solo si empeora.</p>
          </P>
          <P name="🦠 Podredumbre de raíz">
            <p><b>Reconocer:</b> la planta decae con el sustrato húmedo y huele mal.</p>
            <p><b>Qué hacer:</b> cortar raíces podridas + trasplante a sustrato seco + reanudar riego mínimo al día 3-4.</p>
          </P>
          <P name="🦠 Manchas foliares">
            <p><b>Reconocer:</b> puntos oscuros con halo amarillo.</p>
            <p><b>Qué hacer:</b> poda + riego al pie sin mojar hojas + cobre si progresa.</p>
          </P>
          <P name="🦠 Botrytis">
            <p><b>Reconocer:</b> pelusilla gris en flores y tejido viejo.</p>
            <p><b>Qué hacer:</b> poda con margen + ventilar + no mojar flores.</p>
          </P>
          <P name="🧂 Quemadura por abono / sales">
            <p><b>Reconocer:</b> puntas marrones y costra blanca en el sustrato.</p>
            <p><b>Qué hacer:</b> riego de lavado (3-4 volúmenes de la maceta) + pausa de abono; reanudar a media dosis al día 14.</p>
          </P>
        </div>
      </div>

      <div>
        <h2 className="mb-2 font-serif text-xl font-semibold text-stone-800">⚠️ Reglas de oro de los tratamientos</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-stone-700">
          <li>Jabón potásico: aplica <b>al atardecer</b> y prueba antes en una hoja en helechos, calatheas, carnívoras y suculentas con pruina.</li>
          <li>Azufre y aceites (neem): <b>nunca en las mismas 2 semanas</b>; el azufre jamás por encima de 30 °C.</li>
          <li>Comestibles (albahaca, menta…): nada de sistémicos; lava bien antes de consumir.</li>
          <li>Si hay <b>hormigas</b>: controla también el hormiguero; "cultivan" pulgón y cochinilla y reinfestarán.</li>
          <li>Las hojas quemadas o manchadas <b>no se recuperan</b>: el criterio de cierre es siempre tejido nuevo sano.</li>
          <li>La mayoría de plagas no fallan por mal tratamiento sino por <b>tratar una sola vez</b>: respeta las reaplicaciones del plan.</li>
        </ul>
      </div>
    </section>
  )
}