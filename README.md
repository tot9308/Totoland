# 🌿 Totoland

> ⚠️ **Proyecto en desarrollo activo.** La app funciona y es usable, pero está en constante evolución. Este README se actualizará cuando el proyecto esté más consolidado.

**El cuidado de tus plantas, en casa y en el bolsillo.**

Totoland es una aplicación web progresiva (PWA) para gestionar el cuidado de plantas en hogares compartidos: riegos, tratamientos, fotos, recuperación tras sequía y más. Pensada para familias pequeñas o aulas de primaria, con un catálogo de 500 especies y notificaciones inteligentes.

---

## ✨ Lo que ya funciona

- 📱 PWA instalable (móvil y escritorio) con notificaciones push
- 🏠 Casas compartidas con invitaciones por código
- 📖 Catálogo de **500 especies** con fichas estandarizadas
- 💧 Frecuencias de riego por estación (verano/invierno)
- 🔄 Sincronización de riegos en ciclos comunes
- 🩺 Protocolo de recuperación post-sequía por tipo de planta
- 📋 Tareas mensuales automáticas + personalizadas
- 🏆 Logros y rachas de puntualidad
- 🪦 Cementerio honesto (historial + epitafio)
- 📊 "Tu año verde" con estadísticas
- 🖨️ Fichas imprimibles en PDF
- 📚 Guía integrada de cuidados
- 💾 Backup nocturno automático en Raspberry Pi

## 🚧 En desarrollo

- 🔔 Recordatorios personalizados recurrentes
- 🌱 Plantillas automáticas de cuidados al crear planta
- 📸 Capturas y documentación visual

## 🗺️ Ideas futuras

Ver [`ROADMAP.md`](ROADMAP.md) para la lista completa de ideas pendientes.

---

## 🏗️ Stack

- **Frontend:** Next.js 16 + React + TypeScript + TailwindCSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage + cron)
- **Despliegue:** Vercel
- **Notificaciones:** Web Push (VAPID)
- **Backup:** Raspberry Pi + PostgreSQL + rclone

## 📂 Estructura
pp/ → Rutas (cada carpeta = una página)
components/ → Piezas de interfaz reutilizables
lib/ → Lógica y datos (catálogo, plantas, recuperación)
public/ → Icono, service worker (PWA + push)


## 🚀 Despliegue rápido

1. Clona el repo y ejecuta `schema.sql` en una instancia nueva de Supabase
2. Crea el bucket `plant-photos` en Storage (privado)
3. Configura las variables de entorno en Vercel (ver abajo)
4. Despliega con `git push` o conecta el repo a Vercel

### Variables de entorno necesarias
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
CRON_SECRET
NEXT_PUBLIC_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_SUBJECT


---

## 📜 Licencia

Apache 2.0 — ver [`LICENSE`](LICENSE).

## 👤 Autor

tot9308

Sin soporte comercial, mantenido en tiempo libre.

