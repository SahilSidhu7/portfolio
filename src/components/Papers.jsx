import { useState } from 'react'
import { paperFileUrl } from '../api.js'
import SectionHead from './SectionHead.jsx'

const KIND_TINT = {
  Paper: 'bg-peri text-white',
  Findings: 'bg-amber text-coal',
  'Write-up': 'bg-mint text-coal',
  Notes: 'bg-blush text-coal',
}

function formatDate(value) {
  if (!value) return ''
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function PaperRow({ paper }) {
  return (
    <article className="corner grid gap-5 rounded-[26px] bg-white p-6 md:grid-cols-[180px_1fr_auto] md:items-start md:gap-8 md:p-8">
      <div className="flex items-center gap-3 md:flex-col md:items-start">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${KIND_TINT[paper.kind] || 'bg-canvas text-coal'}`}>
          {paper.kind}
        </span>
        <span className="font-mono text-xs text-mute">{formatDate(paper.published_on)}</span>
      </div>

      <div className="min-w-0">
        {paper.project && (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-peri">From {paper.project}</p>
        )}
        <h3 className="wide mt-1 text-xl font-bold leading-tight tracking-tight md:text-2xl">{paper.title}</h3>
        {paper.summary && <p className="mt-3 max-w-2xl leading-relaxed text-mute">{paper.summary}</p>}
        {paper.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {paper.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-rule px-2.5 py-1 font-mono text-[11px] text-graphite">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 md:flex-col md:items-stretch md:pt-8">
        {paper.has_file && (
          <a
            href={paperFileUrl(paper.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-coal px-5 py-2.5 text-center text-sm font-semibold text-paper transition-colors hover:bg-peri"
          >
            Read PDF ↗
          </a>
        )}
        {paper.external_url && (
          <a
            href={paper.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-coal/20 px-5 py-2.5 text-center text-sm font-semibold text-coal transition-colors hover:border-coal"
          >
            Open link ↗
          </a>
        )}
      </div>
    </article>
  )
}

export default function Papers({ papers, error }) {
  const [kind, setKind] = useState('All')
  const kinds = ['All', ...new Set((papers || []).map((p) => p.kind))]
  const visible = (papers || []).filter((p) => kind === 'All' || p.kind === kind)

  return (
    <section id="papers" className="scroll-mt-20 pt-20 md:pt-28">
      <SectionHead eyebrow="Papers & findings" title="What each build taught me.">
        {kinds.length > 2 && (
          <div className="flex flex-wrap gap-2">
            {kinds.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  kind === k ? 'bg-coal text-paper' : 'bg-white text-coal hover:bg-canvas'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        )}
      </SectionHead>
      <p className="mt-4 max-w-2xl text-mute">
        Write-ups, results and the failures that came with them, including the attempts that didn&apos;t work.
      </p>

      {error && <p className="mt-10 text-mute">Papers are temporarily unavailable.</p>}
      {!error && !papers && <p className="mt-10 text-mute">Loading papers&hellip;</p>}
      {!error && papers && papers.length === 0 && (
        <div className="corner mt-10 rounded-[26px] bg-amber/60 p-8">
          <p className="wide text-2xl font-bold">Nothing published yet.</p>
          <p className="mt-2 max-w-xl text-coal/75">
            Papers and findings from each project will appear here as they are written up.
          </p>
        </div>
      )}

      <ul className="mt-10 grid gap-5">
        {visible.map((paper) => (
          <li key={paper.id}>
            <PaperRow paper={paper} />
          </li>
        ))}
      </ul>
    </section>
  )
}
