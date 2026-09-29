import { useState } from 'react'
import { PROFILE, SECTIONS, scrollToSection } from '../site.js'

function Mark() {
  return (
    <button
      type="button"
      onClick={() => scrollToSection('me')}
      aria-label="Back to top"
      className="wide flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-coal text-sm font-extrabold text-paper"
    >
      S
    </button>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)

  const go = (id) => {
    scrollToSection(id)
    setOpen(false)
  }

  return (
    <>
      {/* Desktop: vertical rail, labels read bottom-to-top like the reference */}
      <aside className="hidden md:block">
        <div className="sticky top-0 flex h-screen max-h-[900px] flex-col items-center justify-between py-10">
          <Mark />
          <nav className="flex flex-col items-center gap-10">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => go(s.id)}
                className="rotate-180 cursor-pointer text-sm font-medium text-coal/80 transition-colors [writing-mode:vertical-rl] hover:text-peri"
              >
                {s.label}
              </button>
            ))}
          </nav>
          <a
            href={PROFILE.resume}
            target="_blank"
            rel="noopener noreferrer"
            className="rotate-180 rounded-full border border-coal/15 px-2 py-4 text-xs font-semibold tracking-wide text-coal transition-colors [writing-mode:vertical-rl] hover:bg-coal hover:text-paper"
          >
            Resume ↗
          </a>
        </div>
      </aside>

      {/* Mobile: slim top bar. Solid background (no backdrop-filter, it froze Chrome here). */}
      <header className="sticky top-0 z-40 border-b border-rule bg-paper md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Mark />
          <div className="flex items-center gap-2">
            <a
              href={PROFILE.resume}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-coal px-4 py-2 text-xs font-semibold text-paper"
            >
              Resume
            </a>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-rule text-coal"
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={open ? 'M6 18L18 6M6 6l12 12' : 'M4 7h16M4 12h16M4 17h16'}
                />
              </svg>
            </button>
          </div>
        </div>
        {open && (
          <nav className="grid grid-cols-2 gap-2 border-t border-rule px-4 py-3">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => go(s.id)}
                className="rounded-xl bg-canvas/60 px-4 py-3 text-left text-sm font-medium text-coal"
              >
                {s.label}
              </button>
            ))}
          </nav>
        )}
      </header>
    </>
  )
}
