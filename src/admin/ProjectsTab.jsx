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
      <span className="text-xs text-fog">{label}</span>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        className="mt-1 w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm text-snow outline-none focus:border-iris"
      />
    </label>
  )

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-xl border border-line bg-panel p-6">
      {field('Title', 'title')}
      <label className="block">
        <span className="text-xs text-fog">Description</span>
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm text-snow outline-none focus:border-iris"
        />
      </label>
      <label className="block">
        <span className="text-xs text-fog">Category</span>
        <select
          value={form.category}
          onChange={(e) => set('category', e.target.value)}
          className="mt-1 w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm text-snow outline-none focus:border-iris"
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
      <label className="flex items-center gap-2 text-sm text-snow">
        <input
          type="checkbox"
          checked={form.featured}
          onChange={(e) => set('featured', e.target.checked)}
        />
        Visible on public site
      </label>
      <div className="flex gap-3">
        <button type="submit" className="rounded-lg bg-iris px-4 py-2 text-sm font-semibold text-ink hover:bg-iris-soft">
          Save
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-line px-4 py-2 text-sm text-fog hover:text-snow">
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
          <h2 className="font-display text-lg font-bold">Projects</h2>
          {!adding && !editing && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="rounded-lg bg-iris px-4 py-2 text-sm font-semibold text-ink hover:bg-iris-soft"
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
          <div className="overflow-hidden rounded-xl border border-line">
            <table className="w-full text-sm">
              <thead className="bg-panel-2 text-left text-xs uppercase tracking-wide text-fog">
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
                  <tr key={p.id} className="border-t border-line bg-panel">
                    <td className="px-4 py-2 text-snow">{p.title}</td>
                    <td className="px-4 py-2 text-fog">{p.category}</td>
                    <td className="px-4 py-2 text-fog">{p.featured ? 'Yes' : 'Draft'}</td>
                    <td className="px-4 py-2 text-fog">{p.source}</td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => setEditing(p)}
                        className="mr-3 text-iris-soft hover:text-snow"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        className="text-signal hover:text-snow"
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
        <h2 className="mb-3 font-display text-lg font-bold">Import from LinkedIn Showcase</h2>
        {importError && <p className="text-sm text-signal">{importError}</p>}
        {!importError && importable.length === 0 && (
          <p className="text-sm text-fog">Nothing new to import.</p>
        )}
        <ul className="flex flex-col gap-2">
          {importable.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-line bg-panel px-4 py-3"
            >
              <span className="text-sm text-snow">{p.title}</span>
              <button
                type="button"
                onClick={() => handleImport(p.id)}
                className="rounded-lg border border-iris px-3 py-1.5 text-xs font-medium text-iris-soft hover:bg-iris hover:text-ink"
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
