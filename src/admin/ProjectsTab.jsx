import React, { useEffect, useState } from 'react'
import {
  getAdminProjects,
  createProject,
  updateProject,
  deleteProject,
  getImportable,
  importProject,
} from '../api.js'

const CATEGORIES = ['AI/ML', 'Web Dev', 'Automation', 'Uncategorized']
const EMPTY_FORM = {
  title: '', description: '', category: 'AI/ML', tech_stack: '', github_url: '',
  image_url: '', proof_line: '', featured: true,
}

function ProjectForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial
      ? { ...initial, tech_stack: initial.tech_stack.join(', ') }
      : EMPTY_FORM
  )

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    await onSave({
      ...form,
      tech_stack: form.tech_stack.split(',').map((t) => t.trim()).filter(Boolean),
      source: initial?.source || 'manual',
      source_id: initial?.source_id ?? null,
    })
  }

  const field = (label, key, type = 'text') => (
    <label className="block">
      <span className="text-xs text-mute">{label}</span>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        className="mt-1 w-full rounded-xl border border-rule bg-white px-3 py-2 text-sm text-coal outline-none transition-shadow focus:border-peri focus:ring-2 focus:ring-peri/25"
      />
    </label>
  )

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-[22px] border border-rule bg-white p-6 md:p-7">
      {field('Title', 'title')}
      <label className="block">
        <span className="text-xs text-mute">Description</span>
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border border-rule bg-white px-3 py-2 text-sm text-coal outline-none transition-shadow focus:border-peri focus:ring-2 focus:ring-peri/25"
        />
      </label>
      <label className="block">
        <span className="text-xs text-mute">Category</span>
        <select
          value={form.category}
          onChange={(e) => set('category', e.target.value)}
          className="mt-1 w-full rounded-xl border border-rule bg-white px-3 py-2 text-sm text-coal outline-none transition-shadow focus:border-peri focus:ring-2 focus:ring-peri/25"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>
      {field('Tech stack (comma-separated)', 'tech_stack')}
      {field('GitHub URL', 'github_url')}
      {field('Image URL', 'image_url')}
      {field('Proof line', 'proof_line')}
      <label className="flex items-center gap-2 text-sm text-coal">
        <input
          type="checkbox"
          checked={form.featured}
          onChange={(e) => set('featured', e.target.checked)}
        />
        Visible on public site
      </label>
      <div className="flex gap-3">
        <button type="submit" className="rounded-full bg-coal px-4 py-2 text-sm font-semibold text-paper hover:bg-graphite">
          Save
        </button>
        <button type="button" onClick={onCancel} className="rounded-full border border-rule bg-white px-4 py-2 text-sm text-mute hover:text-coal">
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function ProjectsTab() {
  const [projects, setProjects] = useState([])
  const [importable, setImportable] = useState([])
  const [editing, setEditing] = useState(null)
  const [adding, setAdding] = useState(false)
  const [importError, setImportError] = useState('')

  function refresh() {
    getAdminProjects().then(setProjects)
  }

  function refreshImportable() {
    setImportError('')
    getImportable()
      .then(setImportable)
      .catch((err) => setImportError(err.message))
  }

  useEffect(() => {
    refresh()
    refreshImportable()
  }, [])

  async function handleCreate(data) {
    await createProject(data)
    setAdding(false)
    refresh()
  }

  async function handleUpdate(data) {
    await updateProject(editing.id, data)
    setEditing(null)
    refresh()
  }

  async function handleDelete(id) {
    await deleteProject(id)
    refresh()
  }

  async function handleImport(showcaseId) {
    await importProject(showcaseId)
    refresh()
    refreshImportable()
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="wide text-lg font-bold">Projects</h2>
          {!adding && !editing && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="rounded-full bg-coal px-4 py-2 text-sm font-semibold text-paper hover:bg-graphite"
            >
              Add project
            </button>
          )}
        </div>

        {adding && <ProjectForm onSave={handleCreate} onCancel={() => setAdding(false)} />}
        {editing && (
          <ProjectForm initial={editing} onSave={handleUpdate} onCancel={() => setEditing(null)} />
        )}

        {!adding && !editing && (
          <div className="overflow-hidden rounded-[22px] border border-rule">
            <table className="w-full text-sm">
              <thead className="bg-canvas text-left text-xs uppercase tracking-wide text-mute">
                <tr>
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2">Visible</th>
                  <th className="px-4 py-2">Source</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id} className="border-t border-rule bg-white">
                    <td className="px-4 py-2 text-coal">{p.title}</td>
                    <td className="px-4 py-2 text-mute">{p.category}</td>
                    <td className="px-4 py-2 text-mute">{p.featured ? 'Yes' : 'Draft'}</td>
                    <td className="px-4 py-2 text-mute">{p.source}</td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => setEditing(p)}
                        className="mr-3 text-peri hover:text-coal"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        className="text-red-600 hover:text-coal"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 wide text-lg font-bold">Import from LinkedIn Showcase</h2>
        {importError && <p className="text-sm text-red-600">{importError}</p>}
        {!importError && importable.length === 0 && (
          <p className="text-sm text-mute">Nothing new to import.</p>
        )}
        <ul className="flex flex-col gap-2">
          {importable.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-2xl border border-rule bg-white px-4 py-3"
            >
              <span className="text-sm text-coal">{p.title}</span>
              <button
                type="button"
                onClick={() => handleImport(p.id)}
                className="rounded-full border border-coal px-3 py-1.5 text-xs font-medium text-peri hover:bg-coal hover:text-paper"
              >
                Import
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
