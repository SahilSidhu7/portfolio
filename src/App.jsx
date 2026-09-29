import { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import AboutIntro from './components/AboutIntro'
import Skills from './components/skills.jsx'
import Certificates from './components/Certificates'
import Projects from './components/Projects'
import Papers from './components/Papers'
import About from './components/About'
import AdminApp from './admin/AdminApp.jsx'
import { getPapers, getProfile, getProjects } from './api.js'

const FALLBACK_PROFILE = {
  hero_tagline: 'AI software engineer',
  hero_headline: 'Real AI systems, built end to end.',
  hero_subtext:
    'CS undergrad who ships local LLM agents, RAG pipelines and full-stack tools, running on real hardware, not just in notebooks.',
  bio_paragraphs: [
    "I'm a computer science student at Chitkara University (B.Tech, 2028). Instead of collecting tutorials, I build complete systems: data in, model or logic in the middle, a working product out, deployed on a real server.",
    'Most of my work runs local models: agents with tool calling and MCP, RAG over FAISS, and ML pipelines for log anomaly detection, served by FastAPI with React on the front.',
  ],
  currently_building: [
    'Sentinal: local-first security monitoring (team of 4)',
    'VirtualBuddy: a local AI desktop agent',
    'Open to AI / software engineering internships',
  ],
}

function PublicSite() {
  const [profile, setProfile] = useState(FALLBACK_PROFILE)
  const [projects, setProjects] = useState(null)
  const [projectsError, setProjectsError] = useState(false)
  const [papers, setPapers] = useState(null)
  const [papersError, setPapersError] = useState(false)

  useEffect(() => {
    getProfile()
      .then((p) => setProfile({ ...FALLBACK_PROFILE, ...p }))
      .catch(() => {})
    getProjects()
      .then(setProjects)
      .catch(() => setProjectsError(true))
    getPapers()
      .then(setPapers)
      .catch(() => setPapersError(true))
  }, [])

  return (
    <div className="min-h-screen p-2 sm:p-4 md:p-6">
      <div className="mx-auto max-w-[1280px] overflow-hidden rounded-[28px] bg-paper shadow-[0_30px_80px_-40px_rgba(0,0,0,0.35)] md:rounded-[36px]">
        <div className="md:grid md:grid-cols-[76px_1fr]">
          <Navbar />
          <main className="px-4 pb-6 sm:px-6 md:px-8 md:pl-2 lg:px-12 lg:pl-4">
            <Hero profile={profile} projects={projects} papers={papers} />
            <AboutIntro profile={profile} />
            <Projects projects={projects} error={projectsError} />
            <Papers papers={papers} error={papersError} />
            <Skills />
            <Certificates />
            <About />
          </main>
        </div>
      </div>
    </div>
  )
}

function App() {
  if (typeof window !== 'undefined' && window.location.pathname.replace(/\/$/, '') === '/admin') {
    return <AdminApp />
  }
  return <PublicSite />
}

export default App
