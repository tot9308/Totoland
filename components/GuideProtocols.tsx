export default function GuideProtocols() {
  return (
    <section className="mb-8 space-y-6">
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
            destacado con borde terracota. No hay que "avanzar" manualmente: el plan corre con el
            calendario.
          </p>
          <p>
            <b>Tus tres botones:</b> ✅ <i>Recuperada</i> cierra el protocolo y lo anota en el
            historial · 💧 <i>Sigo el tratamiento</i> registra que continúas y programa el próximo
            chequeo · 🩺 <i>Sin cambios / empeora</i> registra el estancamiento; si se repite, la app
            <b> sube la gravedad</b> y te avisa para que revises el plan escalado.
          </p>
          <p>
            Los días que toca chequeo, la <b>home</b> muestra un aviso bajo la tarjeta y el{" "}
            <b>aviso diario</b> lo incluye en la notificación.
          </p>
        </div>
      </div>

      <div>
        <h2 className="mb-2 font-serif text-xl font-semibold text-stone-800">🐛 Guía rápida de plagas</h2>
        <ul className="space-y-2 text-sm text-stone-700">
          <li><b>Oruga</b> — mordiscos grandes y cacas negras. Retirada manual al anochecer + Bt (comestibles) o jabón potásico; reaplicar días 4 y 7. ≈2 semanas.</li>
          <li><b>Pulgón</b> — brotes tiernos pegajosos y apiñados. Chorro de agua + jabón potásico (días 1, 4 y 7). ≈2 semanas.</li>
          <li><b>Cochinilla de hojas</b> — bolitas algodonosas en axilas y envés. Algodón con alcohol 70° (prueba antes en una hoja) + jabón. ≈4 semanas (los crawlers eclosionan escalonados).</li>
          <li><b>Cochinilla de raíz</b> — algodón en las raíces al trasplantar. Lavar raíces, trasplante a sustrato y maceta limpios, riego tratado. ≈4 semanas y aislamiento estricto.</li>
          <li><b>Escama (cochinilla acorazada)</b> — escudos fijos marrones que no se caen al frotar. Raspar cada escudo con palillo + inspección y raspado semanal. ≈6 semanas.</li>
          <li><b>Araña roja</b> — punteado amarillo y telarañas finas en el envés. Humedad del <i>entorno</i> (bandeja con piedras y agua), no del follaje + jabón días 1, 4, 7 y 10. ≈2 semanas.</li>
          <li><b>Mosca blanca</b> — nube de insectillos al agitar. Trampas amarillas + jabón en el envés. ≈2 semanas.</li>
          <li><b>Trips</b> — marcas plateadas y brotes deformes. Trampas azules + jabón y neem. ≈3 semanas.</li>
          <li><b>Mosca del sustrato</b> — mosquitas negras que salen del sustrato. Dejar secar + capa de arena + trampas amarillas; si persiste, riego con BTI ("bits"). ≈2 semanas.</li>
          <li><b>Caracol / babosa</b> — agujeros grandes y rastros de baba. Caza nocturna + barreras (cáscara de huevo, cerveza). ≈10 días.</li>
          <li><b>Minador de hojas</b> — galerías serpenteantes dentro de la hoja. Podar las hojas con galería (el tratamiento no llega a la larva). ≈1 semana.</li>
        </ul>
      </div>

      <div>
        <h2 className="mb-2 font-serif text-xl font-semibold text-stone-800">🦠 Enfermedades y otros problemas</h2>
        <ul className="space-y-2 text-sm text-stone-700">
          <li><b>Oídio</b> — polvo blanco como harina. Poda de hojas blancas + ventilación + bicarbonato o azufre. El cierre se juzga por tejido <i>nuevo</i> limpio.</li>
          <li><b>Mildiu</b> — manchas amarillas por arriba, pelusilla gris por el envés. Poda + bajar humedad + cobre solo si empeora.</li>
          <li><b>Podredumbre de raíz</b> — la planta decae con el sustrato húmedo y huele mal. Cortar raíces podridas + trasplante a sustrato seco + reanudar riego mínimo al día 3-4.</li>
          <li><b>Manchas foliares</b> — puntos oscuros con halo amarillo. Poda + riego al pie sin mojar hojas + cobre si progresa.</li>
          <li><b>Botrytis</b> — pelusilla gris en flores y tejido viejo. Poda con margen + ventilar + no mojar flores.</li>
          <li><b>Quemadura por abono / sales</b> — puntas marrones y costra blanca en el sustrato. Riego de lavado (3-4 volúmenes de la maceta) + pausa de abono; reanudar a media dosis al día 14.</li>
        </ul>
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