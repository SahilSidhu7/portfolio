import React, { useEffect, useState } from 'react'
import { getProjects } from '../api.js'

const CATEGORIES = ['All', 'AI/ML', 'Web Dev', 'Automation']

function ProjectCard({ project, index }) {
  const number = String(index + 1).padStart(2, '0')

  return (
    <article className="group grid overflow-hidden rounded-xl border border-line bg-panel transition-colors hover:border-iris/40 md:grid-cols-[2fr_3fr]">
      {project.image_url ? (
        <div className="relative min-h-52 overflow-hidden border-b border-line md:border-b-0 md:border-r">
          <img
            src={project.image_url}
            alt={`${project.title} screenshot`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
      ) : (
        <div className="flex min-h-40 items-center justify-center border-b border-line bg-panel-2 md:min-h-52 md:border-b-0 md:border-r">
          <div className="text-center">
            <p className="font-mono text-5xl font-semibold text-line">{number}</p>
            <p className="mt-3 inline-block rounded-md border border-signal/40 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.15em] text-signal">
              {project.category}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col justify-center p-6 md:p-8">
        <h3 className="font-display text-xl font-bold tracking-tight text-snow md:text-2xl">
          {project.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-fog">{project.description}</p>
        {project.proof_line && (
          <p className="mt-3 font-mono text-xs text-signal">&rarr; {project.proof_line}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {project.tech_stack.map((tech) => (
            <span
              key={tech}
              className="rounded-md border border-line bg-panel-2 px-2.5 py-1 font-mono text-xs text-fog"
            >
              {tech}
            </span>
          ))}
        </div>
        {project.github_url && (
          <a
            href={project.github_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex w-fit items-center gap-2 text-sm font-medium text-iris-soft transition-colors hover:text-snow"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
            View repository
          </a>
        )}
      </div>
    </article>
  )
}

export default function Projects() {
  const [projects, setProjects] = useState(null)
  const [error, setError] = useState(false)
  const [category, setCategory] = useState('All')

  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch(() => setError(true))
  }, [])

  const visible = (projects || []).filter(
    (p) => category === 'All' || p.category === category
  )

  return (
    <section id="projects" className="py-16 md:py-24">
      <p className="font-mono text-xs font-medium uppercase tracking-[0.25em] text-signal">Projects</p>
      <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-snow">
        Built end to end, not from templates
      </h2>
      <p className="mt-2 text-fog">
        Every project here covers the whole stack: data in, model or logic in the middle, working UI out.
      </p>

      {projects && projects.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                category === cat
                  ? 'border-iris bg-iris text-ink'
                  : 'border-line text-fog hover:border-fog hover:text-snow'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-10 text-sm text-fog">Projects are temporarily unavailable.</p>
      )}

      {!error && !projects && <p className="mt-10 text-sm text-fog">Loading projects&hellip;</p>}

      {!error && projects && visible.length === 0 && (
        <p className="mt-10 text-sm text-fog">No projects in this category yet.</p>
      )}

      <ul className="mt-10 flex flex-col gap-6">
        {visible.map((project, index) => (
          <li key={project.id}>
            <ProjectCard project={project} index={index} />
          </li>
        ))}
      </ul>
    </section>
  )
}
