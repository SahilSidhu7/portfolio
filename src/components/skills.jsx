import SectionHead from './SectionHead.jsx'

const SKILL_GROUPS = [
  {
    title: 'AI & ML',
    tint: 'bg-peri text-white',
    chip: 'bg-white/20 text-white',
    skills: ['LLM agents', 'Tool calling', 'MCP', 'RAG', 'FAISS', 'Ollama', 'scikit-learn', 'Hugging Face Transformers', 'Evaluation harnesses'],
  },
  {
    title: 'Languages',
    tint: 'bg-mint text-coal',
    chip: 'bg-white/60 text-coal',
    skills: ['Python', 'TypeScript', 'JavaScript', 'Rust', 'C++', 'Java', 'SQL'],
  },
  {
    title: 'Backend & Web',
    tint: 'bg-white text-coal',
    chip: 'border border-rule text-graphite',
    skills: ['FastAPI', 'REST APIs', 'WebSockets', 'React', 'React Native', 'Tailwind CSS', 'SQLite', 'pytest'],
  },
  {
    title: 'Infra',
    tint: 'bg-coal text-paper',
    chip: 'bg-white/10 text-paper',
    skills: ['Docker', 'Linux', 'systemd', 'GitHub Actions', 'Cloudflare Tunnels', 'Microsoft Azure'],
  },
]

export default function Skills() {
  return (
    <section id="skills" className="scroll-mt-20 pt-20 md:pt-28">
      <SectionHead eyebrow="Skills" title="The stack I ship with." />
      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {SKILL_GROUPS.map((group) => (
          <div key={group.title} className={`corner rounded-[26px] p-7 md:p-8 ${group.tint}`}>
            <h3 className="wide text-lg font-bold">{group.title}</h3>
            <div className="mt-5 flex flex-wrap gap-2">
              {group.skills.map((skill) => (
                <span key={skill} className={`rounded-full px-3 py-1.5 text-sm font-medium ${group.chip}`}>
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
