\# Changelog



Registro de cambios de Totoland. Formato inspirado en \[Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).



\## \[Unreleased]



\### En desarrollo

\- 🔔 Recordatorios personalizados recurrentes

\- 🌱 Plantillas automáticas de cuidados al crear planta

\- 📸 Capturas y documentación visual



\## \[0.11.0] - 2026-09-13



\### Añadido

\- 🌙 Modo oscuro con tres opciones: Claro, Oscuro y Automático (según el sistema)

\- 🔔 Hora del aviso diario \*\*por usuario\*\* (cada miembro tiene la suya)

\- 🤫 El siguiente usuario solo recibe el aviso si aún quedan riegos pendientes

\- 📅 Fecha de último riego configurable en el sincronizador

\- 🕐 Notificaciones con minutos (cron cada 5 minutos, selector con pasos de 5)

\- 📝 El badge de próximo riego muestra el día de la semana cuando faltan ≤4 días

\- ⚓ Anclaje del patrón de riego a fecha + intervalo semanal, para que no se desfasen

\- 🌀 Modo frecuencia pura para ciclos no semanales (5, 10, 12…), con aviso de que el patrón rotará

\- 🌨️ Los días fijos respetan la temporada (en invierno se riega menos automáticamente)

\- 🔧 Registro del service worker al cargar la app (imprescindible para las push)

\- 🩺 "Probar aviso" con diagnóstico: permiso, service worker y suscripción push



\### Cambiado

\- 💧 Cantidades de riego por tabla de referencia interpolada, coherente con la guía

\- 📅 Calendario y cron respetan el intervalo semanal anclado y la temporada



\### Corregido

\- 🐛 Cálculo de ml de riego (daba 0-1 ml)

\- 🐛 El calendario no respetaba los días fijos del sincronizador

\- 🐛 El sincronizador no anclaba bien al día del grupo y fallaba en silencio sin las columnas de BD

\- ⏱️ Las fracciones de día (<1) ya cuentan como "pendiente hoy" (frecuencias como 3,5 d)

\- 🐛 Varios errores de build (manifest.ts, import duplicado, case-sensitive en Linux, tipos de push)



\## \[0.10.0] - 2026-09-11



\### Añadido

\- 🗓️ Modo de riego por días fijos de la semana, anclado al día del grupo

\- 🔄 Sincronizador que convierte frecuencias no múltiplos en días fijos (p. ej. 4 d → martes + sábado)

\- 🧭 Ajuste de comportamiento ante retrasos en días fijos (mantener o re-anclar según umbral)

\- 🔕 Silenciar notificaciones push por 1, 3, 7, 14 o 30 días

\- 📅 Vista de calendario mensual (riegos hechos, previstos y tareas)

\- 🔔 Recordatorios personalizados recurrentes

\- 🌱 Plantilla automática de cuidados al elegir especie (editable)

\- 💚 Página "Acerca de" con licencia y autoría

\- 🎨 Restyling completo al estilo orgánico natural (crema, oliva, terracota, serif)

\- 🖼️ Nuevo logotipo en icono, launcher, notificaciones, login, cabeceras y menú



\### Cambiado

\- 🔄 El sincronizador ya no desfasa plantas de frecuencia no múltiplo: las ancla a días fijos



\## \[0.9.0] - 2026-09-09



\### Añadido

\- 📖 Catálogo ampliado a \*\*500 especies\*\* con aliases

\- 📊 Página "Tu año verde" con estadísticas anuales

\- 🔔 Hora personalizable para el aviso diario

\- ⏰ Posponer notificaciones 2h / 4h / 6h desde la propia notificación

\- 🩺 Protocolo científico de recuperación post-sequía (por tipo de planta y severidad)

\- 🏷️ Categoría general de planta visible en la ficha

\- 🧬 Tipo de planta para recuperación visible en la ficha

\- 📌 Cuidados clave accesibles desde la ficha (añadir/editar)

\- ＋ Botón "Más acciones" dentro de cada planta

\- 📝 Desplegables dependientes en observaciones (plaga, tratamiento, abono, ubicación)

\- 🚦 Semáforo de salud en observaciones

\- 📋 Tareas mensuales automáticas + personalizadas (página /tasks)

\- 🏆 Logros con progreso y barra visual

\- 🗺️ Mapa de arquitectura en la guía



\### Cambiado

\- 💧 Calculadora de cantidad de agua recalibrada (modelo troncocónico)

\- 📚 Guía actualizada con sección de recuperación y pulverizado

\- 🪦 Cementerio como página completa (no modal)

\- 🎨 Tamaños de tarjetas configurables (grande/medio/pequeño)



\## \[0.8.0] - 2026-09-07



\### Añadido

\- 🔄 Sincronización de riegos con subdivisiones (2-4 riegos por ciclo)

\- 🏠 Sistema de casas compartidas con código de invitación

\- 🔐 Autenticación completa (registro, recuperación, cambio con contraseña actual)

\- 📚 Guía integrada de cuidados

\- 🖨️ Fichas imprimibles en PDF



\## \[0.7.0] - 2026-09-06



\### Añadido

\- 🌿 Versión inicial funcional

\- 💧 Registro de riegos y frecuencias por estación

\- 📸 Fotos con compresión automática

\- 🪦 Cementerio de plantas con epitafio

\- 🔔 Notificaciones push con cron de Supabase

\- 💾 Backup nocturno en Raspberry Pi

