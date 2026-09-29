// src/api.js
const BASE_URL = import.meta.env.VITE_API_BASE || 'https://adminport.sahilsidhu.pro'

async function request(path, options = {}) {
  const isForm = options.body instanceof FormData
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: isForm ? {} : { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `Request failed: ${res.status}`)
  }
  if (res.status === 204) return null
  return res.json()
}

export const getProfile = () => request('/profile')
export const getProjects = () => request('/projects')
export const login = (password) =>
  request('/admin/login', { method: 'POST', body: JSON.stringify({ password }) })
export const logout = () => request('/admin/logout', { method: 'POST' })
export const whoami = () => request('/admin/whoami')
export const saveProfile = (data) =>
  request('/admin/profile', { method: 'PUT', body: JSON.stringify(data) })
export const getAdminProjects = () => request('/admin/projects')
export const createProject = (data) =>
  request('/admin/projects', { method: 'POST', body: JSON.stringify(data) })
export const updateProject = (id, data) =>
  request(`/admin/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteProject = (id) =>
  request(`/admin/projects/${id}`, { method: 'DELETE' })
export const getImportable = () => request('/admin/showcase-importable')
export const importProject = (id) =>
  request(`/admin/projects/import/${id}`, { method: 'POST' })

export const getPapers = () => request('/papers')
export const paperFileUrl = (id) => `${BASE_URL}/papers/${id}/file`
export const getAdminPapers = () => request('/admin/papers')
export const createPaper = (formData) =>
  request('/admin/papers', { method: 'POST', body: formData })
export const updatePaper = (id, data) =>
  request(`/admin/papers/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deletePaper = (id) =>
  request(`/admin/papers/${id}`, { method: 'DELETE' })
