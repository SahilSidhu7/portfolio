import { useState } from 'react'
import SectionHead from './SectionHead.jsx'

const CATEGORIES = ['All', 'AI/ML', 'Web Dev', 'Automation']
const TINTS = ['bg-peri', 'bg-mint', 'bg-violet', 'bg-amber', 'bg-blush', 'bg-graphite']

function ProjectCard({ project, index }) {
  const number = String(index + 1).padStart(2, '0')
  const tint = TINTS[index % TINTS.length]

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[26px] bg-white">
      <div className={`corner relative h-56 overflow-hidden ${tint} ${tint === 'bg-graphite' ? 'text-white' : 'text-coal'}`}>
        {project.image_url ? (
          <img
            src={project.image_url}
            alt={`${project.title} screenshot`}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <span className="wide absolute bottom-4 left-6 text-7xl font-black opacity-90">{number}</span>
        )}
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-coal">
          {project.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6 md:p-7">
        <h3 className="wide text-xl font-bold leading-tight tracking-tight md:text-2xl">{project.title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-mute">{project.description}</p>
        {project.proof_line && (
          <p className="mt-4 rounded-xl bg-amber/35 px-3 py-2 text-sm font-medium text-coal">{project.proof_line}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.tech_stack.map((tech) => (
            <span key={tech} className="rounded-full border border-rule px-2.5 py-1 font-mono text-[11px] text-graphite">
              {tech}
            </span>
          ))}
        </div>
        {project.github_url && (
          <a
            href={project.github_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto inline-flex w-fit items-center gap-2 pt-6 text-sm font-semibold text-coal transition-colors hover:text-peri"
          >
            View repository <span aria-hidden>↗</span>
          </a>
        )}
      </div>
    </article>
  )
}

export default function Projects({ projects, error }) {
  const [category, setCategory] = useState('All')
  const visible = (projects || []).filter((p) => category === 'All' || p.category === category)

  return (
    <section id="projects" className="scroll-mt-20 pt-20 md:pt-28">
      <SectionHead eyebrow="Projects" title="Built end to end.">
        {projects && projects.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  category === cat ? 'bg-coal text-paper' : 'bg-white text-coal hover:bg-canvas'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </SectionHead>

      {error && <p className="mt-10 text-mute">Projects are temporarily unavailable.</p>}
      {!error && !projects && <p className="mt-10 text-mute">Loading projects&hellip;</p>}
      {!error && projects && visible.length === 0 && (
        <p className="mt-10 text-mute">No projects in this category yet.</p>
      )}

      <ul className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((project, index) => (
          <li key={project.id}>
            <ProjectCard project={project} index={index} />
          </li>
        ))}
      </ul>
    </section>
  )
}
