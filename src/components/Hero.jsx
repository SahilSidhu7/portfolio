import React from 'react'
import me from '../assets/Me.png'

/* The signature element: certification scores presented the way his own
   projects present model output — as a benchmark readout. */
const EVALS = [
  { id: 'AZ-900', name: 'Azure Fundamentals', score: 957, max: 1000, display: '957/1000' },
  { id: 'AI-900', name: 'Azure AI Fundamentals', score: 863, max: 1000, display: '863/1000' },
  { id: 'DP-900', name: 'Azure Data Fundamentals', score: 790, max: 1000, display: '790/1000' },
  { id: 'FSO', name: 'Full Stack Open · Helsinki', score: 1000, max: 1000, display: '5/5 · 7 ECTS' },
]

export default function Hero() {
  return (
    <section id="me" className="flex flex-col items-start gap-12 py-16 md:flex-row md:items-center md:justify-between md:py-24">
      <div className="max-w-xl">
        <div className="rise flex items-center gap-3">
          <img
            src={me}
            alt="Sahilpreet Singh Sidhu"
            className="h-10 w-10 rounded-full border border-line object-cover"
          />
          <span className="text-sm text-fog">Sahilpreet Singh Sidhu · Barnala, India</span>
        </div>

        <p className="rise rise-1 mt-6 font-mono text-xs font-medium uppercase tracking-[0.25em] text-signal">
          AI &amp; full-stack developer
        </p>
        <h1 className="rise rise-1 mt-3 font-display text-4xl font-bold leading-[1.08] tracking-tight text-snow md:text-6xl">
          Real AI systems,
          <br />
          built <span className="text-iris">end to end</span>.
        </h1>
        <p className="rise rise-2 mt-5 text-base leading-relaxed text-fog md:text-lg">
          CS undergrad who ships RAG pipelines, local-LLM apps, and full-stack tools —
          running on real hardware, not just in notebooks.
        </p>

        <div className="rise rise-3 mt-8 flex flex-wrap items-center gap-3">
          <a
            href="https://github.com/SahilSidhu7/Me/blob/main/SahilSidhu.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-iris px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-iris-soft"
          >
            Open resume
          </a>
          <a
            href="https://github.com/SahilSidhu7"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-line px-5 py-2.5 text-sm font-medium text-snow transition-colors hover:border-fog"
          >
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/sahil-sidhu-ai/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-line px-5 py-2.5 text-sm font-medium text-snow transition-colors hover:border-fog"
          >
            LinkedIn
          </a>
        </div>

        <p className="rise rise-4 mt-6 font-mono text-xs text-fog">
          Or ask the chat widget in the corner — I built it. It answers questions about me.
        </p>
      </div>

      <div className="rise rise-2 w-full max-w-md md:w-auto md:min-w-[26rem]">
        <div className="overflow-hidden rounded-xl border border-line bg-panel shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between border-b border-line bg-panel-2 px-4 py-2.5">
            <span className="font-mono text-xs text-fog">credentials.eval</span>
            <span className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-line" />
              <span className="h-2.5 w-2.5 rounded-full bg-line" />
              <span className="h-2.5 w-2.5 rounded-full bg-iris/60" />
            </span>
          </div>
          <ul className="divide-y divide-line/60 px-4">
            {EVALS.map((cert) => (
              <li key={cert.id} className="py-3.5">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-mono text-xs text-fog">
                    <span className="text-iris-soft">{cert.id}</span> · {cert.name}
                  </span>
                  <span className="shrink-0 font-mono text-sm font-semibold text-signal">
                    {cert.display}
                  </span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-line/60">
                  <div
                    className="h-full rounded-full bg-iris"
                    style={{ width: `${(cert.score / cert.max) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t border-line bg-panel-2 px-4 py-2.5 font-mono text-[11px] text-fog">
            verified · certiport.com &amp; mooc.fi
          </div>
        </div>
      </div>
    </section>
  )
}
