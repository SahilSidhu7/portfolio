import { useEffect, useState } from 'react'
import SectionHead from './SectionHead.jsx'
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

const TINTS = ['bg-amber text-coal', 'bg-peri text-white', 'bg-mint text-coal', 'bg-violet text-white']

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
    <section id="credentials" className="scroll-mt-20 pt-20 md:pt-28">
      <SectionHead eyebrow="Credentials" title="Certified, with scores." />

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {SCORED.map((cert, i) => (
          <button
            key={cert.id}
            type="button"
            onClick={() => setPreview({ title: `${cert.issuer}: ${cert.name}`, image: cert.image })}
            className={`corner group flex cursor-pointer flex-col rounded-[26px] p-6 text-left transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-peri ${TINTS[i % TINTS.length]}`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">{cert.issuer}</p>
            <h3 className="mt-2 text-lg font-semibold leading-snug">{cert.name}</h3>
            <p className="wide mt-6 text-4xl font-extrabold leading-none">
              {cert.result}
              <span className="font-sans text-sm font-medium opacity-70">{cert.resultDetail}</span>
            </p>
            <p className="mt-5 flex items-center justify-between text-xs font-medium opacity-80">
              <span>{cert.date}</span>
              <span className="underline decoration-current/40 underline-offset-4 group-hover:decoration-current">
                View certificate
              </span>
            </p>
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div className="corner rounded-[26px] bg-white p-7">
          <h3 className="text-sm font-semibold text-mute">Full Stack Open, completed parts</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {FSO_PARTS.map((part) => (
              <button
                key={part.name}
                type="button"
                onClick={() => setPreview({ title: `Full Stack Open: ${part.name}`, image: part.image })}
                className="cursor-pointer rounded-full border border-rule px-3.5 py-1.5 text-sm font-medium text-coal transition-colors hover:bg-coal hover:text-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-peri"
              >
                {part.name} ↗
              </button>
            ))}
          </div>
        </div>
        <div className="corner rounded-[26px] bg-white p-7">
          <h3 className="text-sm font-semibold text-mute">Additional coursework</h3>
          <ul className="mt-4 space-y-1.5 text-coal">
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
              <p className="text-sm text-white/80">{preview.title}</p>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="cursor-pointer text-sm text-white/80 transition-colors hover:text-white"
              >
                Close (Esc)
              </button>
            </div>
            <img
              src={preview.image}
              alt={preview.title}
              className="max-h-[80vh] w-full rounded-2xl bg-white object-contain"
            />
          </div>
        </div>
      )}
    </section>
  )
}
