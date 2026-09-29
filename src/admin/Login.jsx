import React, { useState } from 'react'
import { login } from '../api.js'

export default function Login({ onLoggedIn }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(password)
      onLoggedIn()
    } catch {
      setError('Incorrect password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm overflow-hidden rounded-[26px] bg-paper p-2.5">
        <div className="corner rounded-[18px] bg-peri px-6 pb-6 pt-8 text-white">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/80">sahilsidhu.pro</p>
          <h1 className="wide mt-2 text-2xl font-extrabold">Admin login</h1>
        </div>
        <div className="px-4 pb-5 pt-5">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="w-full rounded-xl border border-rule bg-white px-4 py-2.5 text-coal outline-none focus:border-peri focus:ring-2 focus:ring-peri/25"
          />
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-full bg-coal px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-graphite disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </form>
    </div>
  )
}
