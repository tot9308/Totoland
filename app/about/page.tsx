import Link from "next/link"

export const metadata = { title: "Acerca de · Totoland" }

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-stone-50 p-4 md:p-8">
      <header className="mb-6 flex items-center gap-3">
        <Link href="/" className="text-sm text-stone-600 hover:underline">← Volver</Link>
        <h1 className="text-2xl font-bold text-stone-800">💚 Acerca de Totoland</h1>
      </header>

      <section className="mb-6 rounded-xl bg-[#faf7f0] p-5 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold text-stone-800">Qué es</h2>
        <p className="text-sm text-stone-700">
          Totoland es una aplicación web para cuidar plantas en casa: registra riegos,
          tratamientos y fotos, avisa de lo que toca cada día y te acompaña en la recuperación
          de una planta tras una sequía. Nació como proyecto personal y familiar, y crece
          poco a poco en el tiempo libre.
        </p>
      </section>

      <section className="mb-6 rounded-xl bg-[#faf7f0] p-5 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold text-stone-800">Quién lo hace</h2>
        <p className="mt-2 text-sm text-stone-700">
          Es un proyecto personal y abierto: el código está disponible públicamente y cualquiera
          puede aprender de él o reutilizarlo.
        </p>
      </section>

      <section className="mb-6 rounded-xl bg-[#faf7f0] p-5 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold text-stone-800">Licencia</h2>
        <p className="text-sm text-stone-700">
          Totoland se publica bajo licencia <b>Apache 2.0</b>. Puedes usarlo, estudiarlo,
          modificarlo y compartirlo, incluso con fines comerciales, siempre que conserves el
          aviso de licencia y menciones los cambios. Sin garantías de ningún tipo.
        </p>
      </section>

      <section className="mb-6 rounded-xl bg-[#faf7f0] p-5 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold text-stone-800">Construido con</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-stone-700">
          <li>Next.js + React + TypeScript + TailwindCSS</li>
          <li>Supabase (PostgreSQL, Auth, Storage y tareas programadas)</li>
          <li>Vercel para el alojamiento</li>
          <li>Notificaciones Web Push y una Raspberry Pi para las copias de seguridad</li>
        </ul>
      </section>

      <section className="rounded-xl bg-[#faf7f0] p-5 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold text-stone-800">Detalles</h2>
        <p className="text-sm text-stone-700">
          Versión 0.9 · Código fuente en{" "}
          <a href="https://github.com/tot9308/Totoland" className="underline" target="_blank" rel="noopener">
            github.com/tot9308/Totoland
          </a>
        </p>
        <p className="mt-2 text-xs text-stone-500">
          Proyecto personal sin soporte comercial. Las fichas de especies son orientativas:
          manda siempre lo que observes en tu casa.
        </p>
      </section>
    </main>
  )
}