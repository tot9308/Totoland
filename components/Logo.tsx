export default function Logo({ size = 40, showText = true, textClass = "text-2xl font-bold text-stone-800" }: {
  size?: number
  showText?: boolean
  textClass?: string
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <img src="/icon-transparent.png" alt="Totoland" style={{ width: size, height: size }} />
      {showText && <span className={textClass}>Totoland</span>}
    </span>
  )
}