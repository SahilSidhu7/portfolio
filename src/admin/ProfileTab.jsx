import React, { useEffect, useState } from 'react'
import { getProfile, saveProfile } from '../api.js'

export default function ProfileTab() {
  const [profile, setProfile] = useState(null)
  const [bioText, setBioText] = useState('')
  const [buildingText, setBuildingText] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    getProfile().then((data) => {
      setProfile(data)
      setBioText(data.bio_paragraphs.join('\n\n'))
      setBuildingText(data.currently_building.join('\n'))
    })
  }, [])

  async function handleSave() {
    setMessage('')
    const updated = {
      ...profile,
      bio_paragraphs: bioText.split('\n\n').map((p) => p.trim()).filter(Boolean),
      currently_building: buildingText.split('\n').map((l) => l.trim()).filter(Boolean),
    }
    try {
      const saved = await saveProfile(updated)
      setProfile(saved)
      setMessage('Saved.')
    } catch (err) {
      setMessage(err.message)
    }
  }

  if (!profile) return <p className="text-fog">Loading&hellip;</p>

  const field = (label, key) => (
    <label className="block">
      <span className="text-xs text-fog">{label}</span>
      <input
        type="text"
        value={profile[key] || ''}
        onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}
        className="mt-1 w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm text-snow outline-none focus:border-iris"
      />
    </label>
  )

  const socialField = (label, key) => (
    <label className="block">
      <span className="text-xs text-fog">{label}</span>
      <input
        type="text"
        value={profile.social_links[key] || ''}
        onChange={(e) =>
          setProfile({ ...profile, social_links: { ...profile.social_links, [key]: e.target.value } })
        }
        className="mt-1 w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm text-snow outline-none focus:border-iris"
      />
    </label>
  )

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line bg-panel p-6">
      {field('Hero tagline', 'hero_tagline')}
      {field('Hero headline', 'hero_headline')}
      <label className="block">
        <span className="text-xs text-fog">Hero subtext</span>
        <textarea
          value={profile.hero_subtext || ''}
          onChange={(e) => setProfile({ ...profile, hero_subtext: e.target.value })}
          rows={2}
          className="mt-1 w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm text-snow outline-none focus:border-iris"
        />
      </label>
      <label className="block">
        <span className="text-xs text-fog">Bio paragraphs (blank line between paragraphs)</span>
        <textarea
          value={bioText}
          onChange={(e) => setBioText(e.target.value)}
          rows={6}
          className="mt-1 w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm text-snow outline-none focus:border-iris"
        />
      </label>
      <label className="block">
        <span className="text-xs text-fog">Currently building (one per line)</span>
        <textarea
          value={buildingText}
          onChange={(e) => setBuildingText(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm text-snow outline-none focus:border-iris"
        />
      </label>
      {socialField('GitHub URL', 'github')}
      {socialField('LinkedIn URL', 'linkedin')}
      {socialField('Email', 'email')}
      <div>
        <button
          type="button"
          onClick={handleSave}
          className="rounded-lg bg-iris px-5 py-2.5 text-sm font-semibold text-ink hover:bg-iris-soft"
        >
          Save profile
        </button>
        {message && <span className="ml-3 text-sm text-fog">{message}</span>}
      </div>
    </div>
  )
}
