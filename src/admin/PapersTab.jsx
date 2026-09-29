import { useEffect, useState } from 'react'
import { createPaper, deletePaper, getAdminPapers, paperFileUrl, updatePaper } from '../api.js'

const KINDS = ['Paper', 'Findings', 'Write-up', 'Notes']
const today = () => new Date().toISOString().slice(0, 10)
const EMPTY_FORM = {
  title: '', summary: '', kind: 'Findings', project: '', published_on: today(),
  tags: '', external_url: '', featured: true,
}
const inputCls =
  'mt-1 w-full rounded-xl border border-rule bg-white px-3 py-2 text-sm text-coal outline-none transition-shadow focus:border-peri focus:ring-2 focus:ring-peri/25'

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
      <span className="text-xs text-mute">{label}</span>
      <input type={type} value={form[key]} onChange={(e) => set(key, e.target.value)} className={inputCls} />
    </label>
  )

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-[22px] border border-rule bg-white p-6 md:p-7">
      {field('Title', 'title')}
      <label className="block">
        <span className="text-xs text-mute">Summary (one or two sentences)</span>
        <textarea value={form.summary} onChange={(e) => set('summary', e.target.value)} rows={3} className={inputCls} />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="text-xs text-mute">Type</span>
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
          <span className="text-xs text-mute">PDF (max 25 MB)</span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mt-1 block w-full text-sm text-mute file:mr-3 file:rounded-full file:border-0 file:bg-coal file:px-3 file:py-2 file:text-sm file:font-semibold file:text-paper"
          />
        </label>
      )}
      <label className="flex items-center gap-2 text-sm text-coal">
        <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} />
        Visible on public site
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-coal px-4 py-2 text-sm font-semibold text-paper hover:bg-graphite disabled:opacity-60"
        >
          {saving ? 'Saving…' : initial ? 'Save' : 'Upload'}
        </button>
        <button type="button" onClick={onCancel} className="rounded-full border border-rule bg-white px-4 py-2 text-sm text-mute hover:text-coal">
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
        <h2 className="wide text-xl font-bold">Papers &amp; findings</h2>
        {!adding && !editing && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded-full bg-coal px-4 py-2 text-sm font-semibold text-paper hover:bg-graphite"
          >
            Upload paper
          </button>
        )}
      </div>

      {adding && <PaperForm onSave={handleCreate} onCancel={() => setAdding(false)} />}
      {editing && <PaperForm initial={editing} onSave={handleUpdate} onCancel={() => setEditing(null)} />}

      {papers.length === 0 && !adding && (
        <p className="text-sm text-mute">No papers yet. Upload a PDF or add a link to a write-up.</p>
      )}

      <ul className="grid gap-3">
        {papers.map((paper) => (
          <li key={paper.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rule bg-white px-5 py-4">
            <div className="min-w-0">
              <p className="truncate font-semibold text-coal">{paper.title}</p>
              <p className="text-xs text-mute">
                {paper.kind} · {paper.project || 'no project'} · {paper.published_on}
                {paper.has_file ? ' · PDF' : ''}
                {!paper.featured && ' · hidden'}
              </p>
            </div>
            <div className="flex gap-2 text-sm">
              {paper.has_file && paper.featured && (
                <a href={paperFileUrl(paper.id)} target="_blank" rel="noopener noreferrer" className="rounded-full border border-rule bg-white px-3 py-1.5 text-mute hover:text-coal">
                  Open
                </a>
              )}
              <button type="button" onClick={() => { setAdding(false); setEditing(paper) }} className="rounded-full border border-rule bg-white px-3 py-1.5 text-mute hover:text-coal">
                Edit
              </button>
              <button type="button" onClick={() => handleDelete(paper)} className="rounded-full border border-rule bg-white px-3 py-1.5 text-mute hover:text-red-600">
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
