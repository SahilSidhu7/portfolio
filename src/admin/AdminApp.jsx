import React, { useEffect, useState } from 'react'
import { whoami, logout } from '../api.js'
import Login from './Login.jsx'
import ProjectsTab from './ProjectsTab.jsx'
import ProfileTab from './ProfileTab.jsx'
import PapersTab from './PapersTab.jsx'

export default function AdminApp() {
  const [checking, setChecking] = useState(true)
  const [authed, setAuthed] = useState(false)
  const [view, setView] = useState('projects')

  useEffect(() => {
    whoami()
      .then(() => setAuthed(true))
      .catch(() => setAuthed(false))
      .finally(() => setChecking(false))
  }, [])

  async function handleLogout() {
    await logout()
    setAuthed(false)
  }

  if (checking) {
    return <div className="flex min-h-screen items-center justify-center bg-canvas font-mono text-sm text-mute">Loading&hellip;</div>
  }

  if (!authed) {
    return <Login onLoggedIn={() => setAuthed(true)} />
  }

  const tabs = [
    ['projects', 'Projects'],
    ['papers', 'Papers'],
    ['profile', 'Profile'],
  ]

  return (
    <div className="min-h-screen bg-canvas text-coal">
      <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-8">
        <header className="corner flex flex-wrap items-center justify-between gap-4 rounded-[22px] bg-peri px-6 py-5 text-white">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/80">sahilsidhu.pro</p>
            <h1 className="wide mt-1 text-xl font-extrabold md:text-2xl">Portfolio Admin</h1>
          </div>
          <nav className="mr-6 flex flex-wrap gap-2">
            {tabs.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setView(key)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${view === key ? 'bg-coal text-paper' : 'bg-white/15 text-white hover:bg-white/30'}`}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-white/50 px-4 py-2 text-sm text-white hover:bg-white hover:text-coal"
            >
              Log out
            </button>
          </nav>
        </header>
        <main className="mt-6 rounded-[26px] bg-paper p-5 md:p-8">
          {view === 'projects' && <ProjectsTab />}
          {view === 'papers' && <PapersTab />}
          {view === 'profile' && <ProfileTab />}
        </main>
      </div>
    </div>
  )
}
