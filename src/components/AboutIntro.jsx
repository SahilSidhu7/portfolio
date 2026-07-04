import React from 'react'

export default function AboutIntro() {
  return (
    <section className="py-10 md:py-14">
      <div className="grid gap-10 rounded-xl border border-line bg-panel px-6 py-8 md:grid-cols-[3fr_2fr] md:gap-14 md:px-10 md:py-10">
        <div>
          <p className="font-mono text-xs font-medium uppercase tracking-[0.25em] text-signal">
            About
          </p>
          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-snow md:text-3xl">
            I learn by shipping the whole thing.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-fog md:text-base">
            I&apos;m a computer science student at Chitkara University (B.Tech, 2028). Instead of
            collecting tutorials, I build complete systems: scrape the data, build the pipeline,
            serve the API, design the frontend, and put it on a real server behind Cloudflare.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-fog md:text-base">
            Most of my work runs local LLMs with Ollama — RAG pipelines over FAISS, automation
            workflows in n8n, and FastAPI backends with React frontends. The chatbot on this page
            is one of them.
          </p>
        </div>

        <div className="flex flex-col gap-6 text-sm md:border-l md:border-line md:pl-10">
          <div>
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-fog">Now</h3>
            <ul className="mt-3 space-y-2 text-snow">
              <li>
                Building <span className="font-medium">Cricket AI Assistant</span> — RAG Q&amp;A
                over cricket stats
              </li>
              <li>B.Tech CS @ Chitkara University · class of 2028</li>
              <li>Open to software / AI engineering internships</li>
            </ul>
          </div>
          <div>
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-fog">How I work</h3>
            <ul className="mt-3 space-y-2 text-snow">
              <li>End to end — data, backend, frontend, deploy</li>
              <li>Test-driven where it counts</li>
              <li>Local-first AI: private, cheap, always on</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
