// Пользователи и сессия в localStorage (без бэкенда).

const USERS_KEY = 'km_users'
const SESSION_KEY = 'km_session'

function read(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export const loadUsers = () => read(USERS_KEY, [])
export const loadSession = () => read(SESSION_KEY, null)

export function saveUsers(users) {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function saveSession(userId) {
  if (userId) window.localStorage.setItem(SESSION_KEY, JSON.stringify(userId))
  else window.localStorage.removeItem(SESSION_KEY)
}

export function initials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '—'
  const chars = parts.length > 1 ? [parts[0][0], parts[1][0]] : [parts[0][0]]
  return chars.join('').toUpperCase()
}

export const newId = () => 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
