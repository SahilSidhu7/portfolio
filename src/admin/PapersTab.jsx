import { useEffect, useState } from 'react'
import { createPaper, deletePaper, getAdminPapers, paperFileUrl, updatePaper } from '../api.js'

const KINDS = ['Paper', 'Findings', 'Write-up', 'Notes']
const today = () => new Date().toISOString().slice(0, 10)
const EMPTY_FORM = {
  title: '', summary: '', kind: 'Findings', project: '', published_on: today(),
  tags: '', external_url: '', featured: true,
}
const inputCls =
  'mt-1 w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm text-snow outline-none focus:border-iris'

function PaperForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ? { ...initial, tags: initial.tags.join(', ') } : EMPTY_FORM)
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (!initial && !file && !form.external_url.trim()) {
      setError('Attach a PDF or give a link.')
      return
    }
    setSaving(true)
    try {
      await onSave(form, file)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const field = (label, key, type = 'text') => (
    <label className="block">
      <span className="text-xs text-fog">{label}</span>
      <input type={type} value={form[key]} onChange={(e) => set(key, e.target.value)} className={inputCls} />
    </label>
  )

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-xl border border-line bg-panel p-6">
      {field('Title', 'title')}
      <label className="block">
        <span className="text-xs text-fog">Summary (one or two sentences)</span>
        <textarea value={form.summary} onChange={(e) => set('summary', e.target.value)} rows={3} className={inputCls} />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="text-xs text-fog">Type</span>
          <select value={form.kind} onChange={(e) => set('kind', e.target.value)} className={inputCls}>
            {KINDS.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </label>
        {field('From project', 'project')}
        {field('Date', 'published_on', 'date')}
      </div>
      {field('Tags (comma-separated)', 'tags')}
      {field('Link (optional, e.g. GitHub write-up)', 'external_url')}
      {!initial && (
        <label className="block">
          <span className="text-xs text-fog">PDF (max 25 MB)</span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mt-1 block w-full text-sm text-fog file:mr-3 file:rounded-lg file:border-0 file:bg-iris file:px-3 file:py-2 file:text-sm file:font-semibold file:text-ink"
          />
        </label>
      )}
      <label className="flex items-center gap-2 text-sm text-snow">
        <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} />
        Visible on public site
      </label>
      {error && <p className="text-sm text-signal">{error}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-iris px-4 py-2 text-sm font-semibold text-ink hover:bg-iris-soft disabled:opacity-60"
        >
          {saving ? 'Saving…' : initial ? 'Save' : 'Upload'}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-line px-4 py-2 text-sm text-fog hover:text-snow">
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function PapersTab() {
  const [papers, setPapers] = useState([])
  const [editing, setEditing] = useState(null)
  const [adding, setAdding] = useState(false)

  const refresh = () => getAdminPapers().then(setPapers)

  useEffect(() => {
    refresh()
  }, [])

  async function handleCreate(form, file) {
    const data = new FormData()
    Object.entries(form).forEach(([key, value]) => data.append(key, String(value)))
    if (file) data.append('file', file)
    await createPaper(data)
    setAdding(false)
    refresh()
  }

  async function handleUpdate(form) {
    await updatePaper(editing.id, {
      title: form.title,
      summary: form.summary,
      kind: form.kind,
      project: form.project,
      published_on: form.published_on,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      external_url: form.external_url,
      featured: form.featured,
    })
    setEditing(null)
    refresh()
  }

  async function handleDelete(paper) {
    if (!window.confirm(`Delete "${paper.title}"? The uploaded PDF is removed too.`)) return
    await deletePaper(paper.id)
    refresh()
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">Papers &amp; findings</h2>
        {!adding && !editing && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded-lg bg-iris px-4 py-2 text-sm font-semibold text-ink hover:bg-iris-soft"
          >
            Upload paper
          </button>
        )}
      </div>

      {adding && <PaperForm onSave={handleCreate} onCancel={() => setAdding(false)} />}
      {editing && <PaperForm initial={editing} onSave={handleUpdate} onCancel={() => setEditing(null)} />}

      {papers.length === 0 && !adding && (
        <p className="text-sm text-fog">No papers yet. Upload a PDF or add a link to a write-up.</p>
      )}

      <ul className="grid gap-3">
        {papers.map((paper) => (
          <li key={paper.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-panel px-5 py-4">
            <div className="min-w-0">
              <p className="truncate font-semibold text-snow">{paper.title}</p>
              <p className="text-xs text-fog">
                {paper.kind} · {paper.project || 'no project'} · {paper.published_on}
                {paper.has_file ? ' · PDF' : ''}
                {!paper.featured && ' · hidden'}
              </p>
            </div>
            <div className="flex gap-2 text-sm">
              {paper.has_file && paper.featured && (
                <a href={paperFileUrl(paper.id)} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-line px-3 py-1.5 text-fog hover:text-snow">
                  Open
                </a>
              )}
              <button type="button" onClick={() => { setAdding(false); setEditing(paper) }} className="rounded-lg border border-line px-3 py-1.5 text-fog hover:text-snow">
                Edit
              </button>
              <button type="button" onClick={() => handleDelete(paper)} className="rounded-lg border border-line px-3 py-1.5 text-fog hover:text-signal">
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
