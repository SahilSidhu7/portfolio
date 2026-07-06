// src/api.js
const BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:8002'

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
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
