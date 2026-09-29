import { PROFILE } from '../site.js'

const LINKS = [
  { label: 'GitHub', href: PROFILE.github, text: 'github.com/SahilSidhu7' },
  { label: 'LinkedIn', href: PROFILE.linkedin, text: 'linkedin.com/in/sahil-sidhu-ai' },
  { label: 'Resume', href: PROFILE.resume, text: 'Sahilpreet-Singh-Sidhu-Resume.pdf' },
]

export default function About() {
  return (
    <footer id="contact" className="scroll-mt-20 pt-20 md:pt-28">
      <div className="corner overflow-hidden rounded-[30px] bg-coal p-7 text-paper md:p-12">
        <p className="text-sm font-semibold text-amber">Contact</p>
        <h2 className="wide mt-3 text-5xl font-black leading-[0.92] tracking-tight md:text-8xl">
          Let&apos;s build
          <br />
          something.
        </h2>
        <p className="mt-5 max-w-lg text-paper/70">
          I&apos;m looking for AI and software engineering roles. One email away.
        </p>
        <a
          href={`mailto:${PROFILE.email}`}
          className="mt-8 inline-flex items-center gap-3 rounded-full bg-amber px-6 py-3.5 text-base font-semibold text-coal transition-colors hover:bg-blush md:text-lg"
        >
          {PROFILE.email} <span aria-hidden>→</span>
        </a>

        <ul className="mt-12 grid gap-3 border-t border-white/15 pt-8 sm:grid-cols-3">
          {LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-2xl bg-white/5 p-4 transition-colors hover:bg-white/10"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-paper/50">{link.label}</span>
                <span className="mt-1 block truncate text-sm text-paper group-hover:text-amber">{link.text} ↗</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2 px-2 pb-2 pt-6 text-xs text-mute md:flex-row md:items-center md:justify-between">
        <span>
          © {new Date().getFullYear()} {PROFILE.name} · {PROFILE.location}
        </span>
        <span>React + Vite + Tailwind · the chat widget is my own RAG pipeline</span>
      </div>
    </footer>
  )
}
