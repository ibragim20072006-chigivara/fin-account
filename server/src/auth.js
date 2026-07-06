import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { db } from './db.js'

export const ROLES = {
  viewer: { canEdit: false, admin: false },
  editor: { canEdit: true, admin: false },
  admin: { canEdit: true, admin: true },
}

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(String(password), salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':')
  if (!salt || !hash) return false
  const orig = Buffer.from(hash, 'hex')
  const test = scryptSync(String(password), salt, 64)
  return orig.length === test.length && timingSafeEqual(orig, test)
}

export function createSession(userId) {
  const token = randomBytes(32).toString('hex')
  db.prepare('INSERT INTO sessions(token, user_id, created_at) VALUES(?, ?, ?)').run(token, userId, Date.now())
  return token
}

export function deleteSession(token) {
  if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token)
}

export function tokenFromReq(req) {
  const h = req.headers.authorization || ''
  return h.startsWith('Bearer ') ? h.slice(7) : null
}

export function userFromToken(token) {
  if (!token) return null
  const s = db.prepare('SELECT user_id FROM sessions WHERE token = ?').get(token)
  if (!s) return null
  return db.prepare('SELECT id, name, login, role, created_at FROM users WHERE id = ?').get(s.user_id) || null
}

export function requireAuth(req, res, next) {
  const user = userFromToken(tokenFromReq(req))
  if (!user) return res.status(401).json({ error: 'Требуется вход' })
  req.user = user
  next()
}

export function requireEditor(req, res, next) {
  requireAuth(req, res, () => {
    if (!ROLES[req.user.role]?.canEdit) return res.status(403).json({ error: 'Недостаточно прав' })
    next()
  })
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (!ROLES[req.user.role]?.admin) return res.status(403).json({ error: 'Только для администратора' })
    next()
  })
}
