import React from 'react'

const PROFILE = {
  name: 'Sahilpreet Singh Sidhu',
  location: 'Barnala, India',
  email: 'sahilsidhu3127@gmail.com',
  github: 'https://github.com/SahilSidhu7',
  linkedin: 'https://www.linkedin.com/in/sahil-sidhu-ai/',
  resume: 'https://github.com/SahilSidhu7/Me/blob/main/SahilSidhu.pdf',
}

export default function About() {
  return (
    <footer id="contact" className="border-t border-line py-16 md:py-20">
      <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
        <div className="max-w-lg">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.25em] text-signal">
            Contact
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-snow md:text-4xl">
            Hiring interns who ship?
          </h2>
          <p className="mt-3 text-fog">
            I&apos;m looking for software and AI engineering internships. One email away.
          </p>
          <a
            href={`mailto:${PROFILE.email}`}
            className="mt-5 inline-block font-mono text-lg text-iris-soft underline decoration-line underline-offset-8 transition-colors hover:text-snow md:text-xl"
          >
            {PROFILE.email}
          </a>
        </div>

        <ul className="flex flex-col gap-2 font-mono text-sm md:text-right">
          <li>
            <a
              href={PROFILE.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-fog transition-colors hover:text-snow"
            >
              github.com/SahilSidhu7
            </a>
          </li>
          <li>
            <a
              href={PROFILE.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-fog transition-colors hover:text-snow"
            >
              linkedin.com/in/sahil-sidhu-ai
            </a>
          </li>
          <li>
            <a
              href={PROFILE.resume}
              target="_blank"
              rel="noopener noreferrer"
              className="text-fog transition-colors hover:text-snow"
            >
              resume.pdf ↗
            </a>
          </li>
        </ul>
      </div>

      <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 font-mono text-xs text-fog/70 md:flex-row md:items-center md:justify-between">
        <span>
          © {new Date().getFullYear()} {PROFILE.name} · {PROFILE.location}
        </span>
        <span>React + Vite + Tailwind · chatbot is my own RAG pipeline</span>
      </div>
    </footer>
  )
}
