import React, { useState } from 'react'
import port from "../assets/portfolio.png"

const scrollToSection = (id) => {
  if (typeof document === 'undefined') return
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  return (
    <header className='bg-surface-elevated text-white border-b border-white/10 rounded-2xl shadow-2xl shadow-accent mt-6'>
      <div className='flex justify-between items-center w-full max-w-6xl mx-auto px-6 md:px-8 py-4'>
        <img src={port} alt="portfolio" className='w-10 shadow shadow-accent'/>
        <nav className='hidden md:block'>
          <ul className='flex gap-6 text-sm'>
            <li>
              <button
                type='button'
                onClick={() => scrollToSection('me')}
                className='text-muted hover:text-accent transition-colors cursor-pointer bg-transparent border-none p-0'
              >
                Me
              </button>
            </li>
            <li>
              <button
                type='button'
                onClick={() => scrollToSection('projects')}
                className='text-muted hover:text-accent transition-colors cursor-pointer bg-transparent border-none p-0'
              >
                Projects
              </button>
            </li>
            <li>
              <button
                type='button'
                onClick={() => scrollToSection('skills')}
                className='text-muted hover:text-accent transition-colors cursor-pointer bg-transparent border-none p-0'
              >
                Skills
              </button>
            </li>
            <li>
              <button
                type='button'
                onClick={() => scrollToSection('contact')}
                className='text-muted hover:text-accent transition-colors cursor-pointer bg-transparent border-none p-0'
              >
                Contact
              </button>
            </li>
          </ul>
        </nav>
        <button
          type='button'
          onClick={toggleMenu}
          className='md:hidden text-muted hover:text-accent transition-colors'
          aria-label='Toggle menu'
        >
          <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
          </svg>
        </button>
      </div>
      {isMenuOpen && (
        <div className='md:hidden bg-surface-elevated border-t border-white/10'>
          <ul className='flex flex-col gap-4 px-6 py-4 text-sm'>
            <li>
              <button
                type='button'
                onClick={() => { scrollToSection('me'); setIsMenuOpen(false); }}
                className='text-muted hover:text-accent transition-colors cursor-pointer bg-transparent border-none p-0 w-full text-left'
              >
                Me
              </button>
            </li>
            <li>
              <button
                type='button'
                onClick={() => { scrollToSection('projects'); setIsMenuOpen(false); }}
                className='text-muted hover:text-accent transition-colors cursor-pointer bg-transparent border-none p-0 w-full text-left'
              >
                Projects
              </button>
            </li>
            <li>
              <button
                type='button'
                onClick={() => { scrollToSection('skills'); setIsMenuOpen(false); }}
                className='text-muted hover:text-accent transition-colors cursor-pointer bg-transparent border-none p-0 w-full text-left'
              >
                Skills
              </button>
            </li>
            <li>
              <button
                type='button'
                onClick={() => { scrollToSection('contact'); setIsMenuOpen(false); }}
                className='text-muted hover:text-accent transition-colors cursor-pointer bg-transparent border-none p-0 w-full text-left'
              >
                Contact
              </button>
            </li>
          </ul>
        </div>
      )}
    </header>
  )
}

export default Navbar