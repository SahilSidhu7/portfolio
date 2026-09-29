export default function SectionHead({ eyebrow, title, children }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-sm font-semibold text-peri">{eyebrow}</p>
        <h2 className="wide mt-2 text-4xl font-black leading-[0.95] tracking-tight md:text-6xl">{title}</h2>
      </div>
      {children}
    </div>
  )
}
