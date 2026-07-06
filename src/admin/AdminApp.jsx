import React, { useEffect, useState } from 'react'
import { whoami, logout } from '../api.js'
import Login from './Login.jsx'
import ProjectsTab from './ProjectsTab.jsx'
import ProfileTab from './ProfileTab.jsx'

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
    return <div className="flex min-h-screen items-center justify-center bg-ink text-fog">Loading&hellip;</div>
  }

  if (!authed) {
    return <Login onLoggedIn={() => setAuthed(true)} />
  }

  return (
    <div className="min-h-screen bg-ink text-snow">
      <header className="flex items-center justify-between border-b border-line px-6 py-4">
        <h1 className="font-display text-lg font-bold">Portfolio Admin</h1>
        <nav className="flex gap-2">
          <button
            type="button"
            onClick={() => setView('projects')}
            className={`rounded-lg px-4 py-2 text-sm ${view === 'projects' ? 'bg-iris text-ink' : 'text-fog hover:text-snow'}`}
          >
            Projects
          </button>
          <button
            type="button"
            onClick={() => setView('profile')}
            className={`rounded-lg px-4 py-2 text-sm ${view === 'profile' ? 'bg-iris text-ink' : 'text-fog hover:text-snow'}`}
          >
            Profile
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-line px-4 py-2 text-sm text-fog hover:text-snow"
          >
            Log out
          </button>
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">
        {view === 'projects' && <ProjectsTab />}
        {view === 'profile' && <ProfileTab />}
      </main>
    </div>
  )
}
