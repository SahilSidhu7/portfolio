import React from 'react'

const SKILL_GROUPS = [
  {
    title: 'Languages',
    skills: ['Python', 'JavaScript', 'TypeScript', 'C++', 'SQL'],
  },
  {
    title: 'Frontend',
    skills: ['React', 'React Native', 'Vite', 'Tailwind CSS'],
  },
  {
    title: 'Backend & AI',
    skills: [
      'FastAPI',
      'REST APIs',
      'Ollama (local LLMs)',
      'RAG',
      'FAISS',
      'Prompt engineering',
      'NumPy',
      'Pandas',
      'Scikit-learn',
      'pytest',
    ],
  },
  {
    title: 'Cloud & DevOps',
    skills: ['Microsoft Azure (certified)', 'n8n automation', 'Linux servers', 'Cloudflare Tunnels', 'Git', 'CI/CD'],
  },
]

export default function Skills() {
  return (
    <section id="skills" className="py-16 md:py-24">
      <p className="font-mono text-xs font-medium uppercase tracking-[0.25em] text-signal">Skills</p>
      <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-snow">
        The stack I actually ship with
      </h2>

      <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
        {SKILL_GROUPS.map((group) => (
          <div key={group.title} className="bg-panel p-6 md:p-8">
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-fog">{group.title}</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {group.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-md border border-line bg-panel-2 px-2.5 py-1 font-mono text-xs text-snow"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
