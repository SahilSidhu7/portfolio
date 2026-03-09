import React, { useState } from 'react'

// Add your projects here. Use image paths from public folder (e.g. /projects/thumb.png) or import from assets.
const PROJECTS = [
  {
    title: 'AI Chatbot Pop-Up',
    description: 'An AI-powered chatbot that answers questions about a website by scraping its content and using Retrieval Augmented Generation (RAG). The chatbot can be embedded into any website as a floating chat widget.',
    tech: ['Python', 'FastAPI', 'React', 'Ollama', 'FAISS', 'BeautifulSoup', 'Requests', 'AI/RAG'],
    githubUrl: 'https://github.com/SahilSidhu7/ai-website-chatbot',
    image: 'https://github.com/SahilSidhu7/ai-website-chatbot/blob/main/screenshots/chatthinking.png?raw=true', // replace with your image: e.g. '/projects/project1.png' or import
  },
  {
    title: 'AI Lead Generator',
    description: 'Built an AI-powered lead generation system using Python, FastAPI, React, and Ollama (Phi-3). The system scrapes websites, analyzes businesses using AI, and generates personalized outreach emails.',
    tech: ['Python', 'FastAPI', 'React', 'Ollama'],
    githubUrl: 'https://github.com/SahilSidhu7/AI-Lead-Generator.git',
    image: 'https://github.com/SahilSidhu7/AI-Lead-Generator/blob/main/screenshots/UIDashboard.png?raw=true', // replace with your image: e.g. '/projects/project1.png' or import
  },
  {
    title: 'AI Email Assistant Automation',
    description: 'Built an AI automation workflow using n8n and Ollama that automatically summarizes incoming emails and generates reply drafts.',
    tech: ['n8n', 'Ollama'],
    githubUrl: 'https://github.com/SahilSidhu7/AI-Email-Assistant-Automation.git',
    image: 'https://github.com/SahilSidhu7/AI-Email-Assistant-Automation/blob/main/Screenshots/telegram.png?raw=true',
  },
  {
    title: 'AI Search Assistant',
    description: 'Built an AI-powered search assistant that retrieves relevant information from multiple sources and generates intelligent responses using a local LLM. The system combines search with AI reasoning to provide contextual answers to user queries.',
    tech: ['React Native', 'TypeScript', 'LLM'],
    githubUrl: 'https://github.com/SahilSidhu7/AI-Search_Assistant.git',
    image: 'https://github.com/SahilSidhu7/AI-Search_Assistant/blob/main/Screenshots/image2.png?raw=true',
  },
  {
    title: 'Learn Flow Coder',
    description: 'learn-flow-coder is a developer learning project focused on improving programming skills through structured coding workflows, practice problems, and implementation of core computer science concepts. The repository serves as a personal learning environment for experimenting with algorithms, programming patterns, and practical coding exercises.',
    tech: ['Typescript', 'supabase'],
    githubUrl: 'https://github.com/SahilSidhu7/learn-flow-coder.git',
    image: 'https://github.com/SahilSidhu7/learn-flow-coder/blob/main/screenshots/mainpage.png?raw=true',
  },
]

function ProjectCard({ project, index }) {
  const isOdd = index % 2 === 0 // 1st, 3rd, 5th = image on right; 2nd, 4th = image on left

  return (
    <article
      className={`group flex flex-col md:flex-row gap-6 md:gap-0 items-stretch w-full overflow-hidden rounded-2xl border border-white/10 bg-surface-alt transition-[box-shadow,border-color,transform] duration-300 ${
        isOdd ? 'md:flex-row' : 'md:flex-row-reverse'
      } hover:border-white/20 hover:shadow-[0_0_0_1px_rgba(139,92,246,0.25),0_0_48px_rgba(139,92,246,0.25)]`}
    >
      {/* Image side — square, smaller */}
      <div className="relative w-full md:w-75 md:h-70 overflow-hidden">
        <img
          src={project.image}
          alt={project.title}
          className="w-full h-full justify-center items-center object-cover rounded-2xl"
        />
      </div>

      {/* Text block — overlaps the image */}
      <div
        className={`relative z-10 w-full md:flex-1 flex flex-col justify-center p-6 md:p-8 rounded-2xl border border-white/10 bg-surface-elevated shadow-xl transition-shadow duration-300 group-hover:shadow-[0_0_36px_rgba(139,92,246,0.20)] ${
          isOdd ? 'md:-mr-12 md:pl-6' : 'md:-ml-1 md:pr-6'
        }`}
      >
        <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
          {project.title}
        </h3>
        <p className="text-muted text-sm md:text-base mb-4 line-clamp-3">
          {project.description}
        </p>
        <div className="flex flex-wrap gap-2 mb-5">
          {project.tech.map((t) => (
            <span
              key={t}
              className="px-2.5 py-1 rounded-lg bg-surface border border-white/10 text-muted text-xs"
            >
              {t}
            </span>
          ))}
        </div>
        <a
          href={project.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 w-fit px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
          </svg>
          View repo
        </a>
      </div>
    </article>
  )
}

export default function Projects() {
  const [visibleCount, setVisibleCount] = useState(Math.min(3, PROJECTS.length))

  if (!PROJECTS.length) {
    return (
      <section id="projects" className="py-16 md:py-24">
        <h2 className="text-3xl font-bold text-white mb-4">Projects</h2>
        <p className="text-muted">Add items to the PROJECTS array in Projects.jsx.</p>
      </section>
    )
  }

  const visibleProjects = PROJECTS.slice(0, visibleCount)
  const hasMore = visibleCount < PROJECTS.length

  return (
    <section id="projects" className="py-16 md:py-24">
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-white">Projects</h2>
        <p className="text-muted mt-2">Things I’ve built and shipped.</p>
      </div>
      <ul className="flex flex-col gap-12 md:gap-16">
        {visibleProjects.map((project, index) => (
          <li key={project.title + index}>
            <ProjectCard project={project} index={index} />
          </li>
        ))}
      </ul>
      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() =>
              setVisibleCount((count) => Math.min(count + 2, PROJECTS.length))
            }
            className="px-4 py-2 rounded-lg bg-surface-elevated border border-white/20 text-sm text-muted hover:text-white hover:border-white/40 hover:bg-surface-elevated/80 transition-colors"
          >
            Load more projects
          </button>
        </div>
      )}
    </section>
  )
}
