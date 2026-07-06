// Клиент бэкенда: авторизация (токен) + данные через /api.

const TOKEN_KEY = 'km_token'

export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY) } catch { return null } }
const setToken = (t) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY) } catch { /* ignore */ } }

async function req(path, { method = 'GET', body } = {}) {
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Ошибка ${res.status}`)
  return data
}

export const api = {
  getToken,
  clearToken: () => setToken(null),

  status: () => req('/auth/status'),
  register: (b) => req('/auth/register', { method: 'POST', body: b }).then((r) => { setToken(r.token); return r.user }),
  login: (b) => req('/auth/login', { method: 'POST', body: b }).then((r) => { setToken(r.token); return r.user }),
  logout: () => req('/auth/logout', { method: 'POST' }).catch(() => {}).finally(() => setToken(null)),
  me: () => req('/auth/me').then((r) => r.user),

  listUsers: () => req('/users').then((r) => r.users),
  addUser: (b) => req('/users', { method: 'POST', body: b }).then((r) => r.user),
  setUserRole: (id, role) => req(`/users/${id}`, { method: 'PATCH', body: { role } }),
  removeUser: (id) => req(`/users/${id}`, { method: 'DELETE' }),

  getDocuments: () => req('/documents').then((r) => r.documents),
  putDocuments: (documents) => req('/documents', { method: 'PUT', body: { documents } }),
  getCategories: () => req('/categories').then((r) => r.categories),
  putCategories: (categories) => req('/categories', { method: 'PUT', body: { categories } }),
  getTemplates: () => req('/templates'),
  putTemplates: (templates, activeTemplateId) => req('/templates', { method: 'PUT', body: { templates, activeTemplateId } }),
}

export function initials(name) {
  const parts = String(name ?? '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '—'
  const chars = parts.length > 1 ? [parts[0][0], parts[1][0]] : [parts[0][0]]
  return chars.join('').toUpperCase()
}

export const newId = (p = 'id') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
