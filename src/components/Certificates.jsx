import React, { useEffect, useState } from 'react'
import certAi900 from '../assets/certificates/Cert113114552927-page-00001.jpg'
import certDp900 from '../assets/certificates/Cert570114553972-page-00001.jpg'
import certAz900 from '../assets/certificates/Cert958114555144-page-00001.jpg'
import certFullstack from '../assets/certificates/certificate-fullstack.png'
import certTypescript from '../assets/certificates/certificate-typescript.png'
import certGraphql from '../assets/certificates/certificate-graphql.png'
import certReactNative from '../assets/certificates/certificate-reactnative.png'
import certCicd from '../assets/certificates/certificate-cicd.png'

const SCORED = [
  {
    id: 'AZ-900',
    name: 'Azure Fundamentals',
    issuer: 'Microsoft Certified',
    result: '957',
    resultDetail: '/1000',
    date: 'Aug 2025',
    image: certAz900,
  },
  {
    id: 'AI-900',
    name: 'Azure AI Fundamentals',
    issuer: 'Microsoft Certified',
    result: '863',
    resultDetail: '/1000',
    date: 'Nov 2024',
    image: certAi900,
  },
  {
    id: 'DP-900',
    name: 'Azure Data Fundamentals',
    issuer: 'Microsoft Certified',
    result: '790',
    resultDetail: '/1000',
    date: 'Aug 2025',
    image: certDp900,
  },
  {
    id: 'FSO',
    name: 'Full Stack Open',
    issuer: 'University of Helsinki',
    result: '5/5',
    resultDetail: ' · 7 ECTS',
    date: '2025',
    image: certFullstack,
  },
]

const FSO_PARTS = [
  { name: 'TypeScript', image: certTypescript },
  { name: 'GraphQL', image: certGraphql },
  { name: 'React Native', image: certReactNative },
  { name: 'CI/CD', image: certCicd },
]

const COURSEWORK = [
  'Generative AI for Everyone — DeepLearning.AI',
  'AI For Everyone — DeepLearning.AI',
  'Data Analytics Foundations',
  'Cybersecurity for Everyone',
  'AI and Disaster Management',
]

export default function Certificates() {
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    if (!preview) return
    const onKey = (event) => {
      if (event.key === 'Escape') setPreview(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [preview])

  return (
    <section id="credentials" className="py-16 md:py-24">
      <p className="font-mono text-xs font-medium uppercase tracking-[0.25em] text-signal">
        Credentials
      </p>
      <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-snow">
        Certified, with the scores to show
      </h2>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SCORED.map((cert) => (
          <button
            key={cert.id}
            type="button"
            onClick={() => setPreview({ title: `${cert.issuer}: ${cert.name}`, image: cert.image })}
            className="group cursor-pointer rounded-xl border border-line bg-panel p-6 text-left transition-colors hover:border-iris/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-iris"
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fog">
              {cert.issuer}
            </p>
            <h3 className="mt-2 font-display text-lg font-bold leading-snug text-snow">
              {cert.name}
            </h3>
            <p className="mt-4 font-mono text-3xl font-semibold text-signal">
              {cert.result}
              <span className="text-sm text-fog">{cert.resultDetail}</span>
            </p>
            <p className="mt-4 flex items-center justify-between font-mono text-xs text-fog">
              <span>{cert.date}</span>
              <span className="text-iris-soft transition-colors group-hover:text-snow">
                View certificate →
              </span>
            </p>
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-panel p-6">
          <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-fog">
            Full Stack Open — completed parts
          </h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {FSO_PARTS.map((part) => (
              <button
                key={part.name}
                type="button"
                onClick={() => setPreview({ title: `Full Stack Open: ${part.name}`, image: part.image })}
                className="cursor-pointer rounded-md border border-line bg-panel-2 px-3 py-1.5 font-mono text-xs text-snow transition-colors hover:border-iris/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-iris"
              >
                {part.name} ↗
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-line bg-panel p-6">
          <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-fog">
            Additional coursework
          </h3>
          <ul className="mt-4 space-y-1.5 text-sm text-fog">
            {COURSEWORK.map((course) => (
              <li key={course}>{course}</li>
            ))}
          </ul>
        </div>
      </div>

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
          onClick={() => setPreview(null)}
          role="dialog"
          aria-modal="true"
          aria-label={preview.title}
        >
          <div className="w-full max-w-3xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <p className="font-mono text-sm text-fog">{preview.title}</p>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="cursor-pointer text-sm text-fog transition-colors hover:text-snow"
              >
                Close (Esc)
              </button>
            </div>
            <img
              src={preview.image}
              alt={preview.title}
              className="max-h-[80vh] w-full rounded-xl border border-line bg-panel object-contain"
            />
          </div>
        </div>
      )}
    </section>
  )
}
