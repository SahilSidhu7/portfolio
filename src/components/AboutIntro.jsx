import React from 'react'

function AboutIntro() {
  return (
    <section className="py-10 md:py-14">
      <div className="rounded-2xl border border-white/10 bg-surface-alt/80 backdrop-blur-sm px-6 py-8 md:px-8 md:py-9 flex flex-col md:flex-row gap-8 md:gap-10">
        <div className="flex-1">
          <p className="text-accent font-semibold text-xs tracking-[0.2em] uppercase mb-3">
            About me
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Turning ideas into reliable systems.
          </h2>
          <p className="text-muted text-sm md:text-base mb-3">
            I&apos;m a student at Chitkara University, graduating in 2028, focused on
            building full‑stack web experiences and backend systems that feel fast,
            reliable, and thoughtful.
          </p>
          <p className="text-muted text-sm md:text-base">
            Right now I&apos;m sharpening my skills in React, Tailwind CSS, modern
            JavaScript/TypeScript, Python, SQL, and automation tools like n8n,
            while also learning more about APIs, cloud infra, and Linux servers.
          </p>
        </div>
        <div className="flex-1 flex flex-col justify-between gap-4 md:items-end text-sm">
          <div>
            <h3 className="text-white font-semibold mb-2">Currently</h3>
            <p className="text-muted">
              🎓 Student &mdash; Chitkara University (B.Tech, graduating 2028)
            </p>
            <p className="text-muted mt-1">
              💻 Exploring fullstack development, Artificial Intelligence, automation workflows, and backend
              services.
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-2">What I enjoy</h3>
            <ul className="text-muted space-y-1 list-disc list-inside">
              <li>Designing clean, responsive UIs.</li>
              <li>Automating repetitive work with n8n and scripts.</li>
              <li>Deploying services on Linux servers and using Cloudflare.</li>
              <li>Learning by building real projects end‑to‑end.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AboutIntro

