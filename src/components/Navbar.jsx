import React, { useState } from 'react'

const LINKS = [
  { id: 'projects', label: 'Projects' },
  { id: 'skills', label: 'Skills' },
  { id: 'credentials', label: 'Credentials' },
  { id: 'contact', label: 'Contact' },
]

const scrollToSection = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const go = (id) => {
    scrollToSection(id)
    setIsMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/95">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-3.5 md:px-8">
        <button
          type="button"
          onClick={() => go('me')}
          className="cursor-pointer font-display text-base font-bold tracking-tight text-snow"
        >
          sahil<span className="text-iris">.</span>sidhu
        </button>

        <nav className="hidden items-center gap-7 md:flex">
          {LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => go(link.id)}
              className="cursor-pointer text-sm text-fog transition-colors hover:text-snow"
            >
              {link.label}
            </button>
          ))}
          <a
            href="https://github.com/SahilSidhu7/Me/blob/main/SahilSidhu.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-iris px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-iris-soft"
          >
            Resume
          </a>
        </nav>

        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          className="text-fog transition-colors hover:text-snow md:hidden"
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
            />
          </svg>
        </button>
      </div>

      {isMenuOpen && (
        <nav className="border-t border-line bg-ink px-6 py-4 md:hidden">
          <ul className="flex flex-col gap-4 text-sm">
            {LINKS.map((link) => (
              <li key={link.id}>
                <button
                  type="button"
                  onClick={() => go(link.id)}
                  className="w-full text-left text-fog transition-colors hover:text-snow"
                >
                  {link.label}
                </button>
              </li>
            ))}
            <li>
              <a
                href="https://github.com/SahilSidhu7/Me/blob/main/SahilSidhu.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-lg bg-iris px-4 py-2 font-semibold text-ink"
              >
                Resume
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}
