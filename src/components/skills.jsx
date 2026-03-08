import React from 'react'

const skillGroups = [
  {
    title: 'Web Development',
    skills: ['Fullstack', 'Tailwind CSS', 'React'],
  },
  {
    title: 'Data & Backend',
    skills: ['SQL', 'Python', 'NumPy', 'Pandas', 'sklearn', 'C++', 'Fast API'],
  },
  {
    title: 'DevOps & Infrastructure',
    skills: ['n8n', 'Cloudflare Tunnels', 'Linux Server'],
  },
]

function Skills() {
  return (
    <section id='skills' className='px-6 py-16 md:py-24 bg-surface-alt rounded-2xl shadow-2xl shadow-accent'>
      <h2 className='text-3xl font-bold text-white mb-12'>Skills</h2>
      <div className='flex flex-col md:flex-row gap-10 md:gap-12'>
        {skillGroups.map((group) => (
          <div key={group.title} className='flex-1'>
            <h3 className='text-accent font-semibold mb-4'>{group.title}</h3>
            <div className='flex flex-wrap gap-2'>
              {group.skills.map((skill) => (
                <span
                  key={skill}
                  className='px-3 py-1.5 rounded-lg bg-surface-elevated text-muted border border-white/10 text-sm'
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

export default Skills
