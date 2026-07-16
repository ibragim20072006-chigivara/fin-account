import express from 'express'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { db, getCollection, upsertItem, deleteItem, getSetting, setSetting } from './db.js'
import {
  ROLES, hashPassword, verifyPassword, createSession, deleteSession,
  tokenFromReq, requireAuth, requireEditor, requireAdmin,
} from './auth.js'
import { recognize, recognizeConfigured } from './recognize.js'

const here = dirname(fileURLToPath(import.meta.url))
try { process.loadEnvFile(join(here, '..', '.env')) } catch { /* .env необязателен */ }

const app = express()
// За cloudflared/Caddy (localhost + X-Forwarded-For) — иначе req.ip у всех был бы адресом прокси.
app.set('trust proxy', 'loopback')
app.use(express.json({ limit: '15mb' }))

const adminCount = () => db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'").get().n

const publicUser = (u) => ({ id: u.id, name: u.name, login: u.login, role: u.role })
const newId = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
const clean = (s) => (typeof s === 'string' ? s.trim() : '')

// ===== Авторизация =====
// Есть ли уже пользователи — чтобы клиент показал регистрацию (первый = админ) или вход.
app.get('/api/auth/status', (req, res) => {
  res.json({ hasUsers: db.prepare('SELECT COUNT(*) AS n FROM users').get().n > 0 })
})

// Регистрация — только «бутстрап» первого администратора. Дальше пользователей заводит админ.
app.post('/api/auth/register', (req, res) => {
  const name = clean(req.body?.name), login = clean(req.body?.login), password = req.body?.password
  if (!name || !login || !password) return res.status(400).json({ error: 'Заполните имя, логин и пароль' })
  if (db.prepare('SELECT COUNT(*) AS n FROM users').get().n > 0) {
    return res.status(403).json({ error: 'Регистрация закрыта — обратитесь к администратору' })
  }
  const user = { id: newId('u'), name, login, role: 'admin' }
  db.prepare('INSERT INTO users(id, name, login, password_hash, role, created_at) VALUES(?, ?, ?, ?, ?, ?)')
    .run(user.id, name, login, hashPassword(password), 'admin', Date.now())
  res.json({ token: createSession(user.id), user: publicUser(user) })
})

const loginFails = new Map()
app.post('/api/auth/login', (req, res) => {
  const login = clean(req.body?.login), password = req.body?.password
  const key = `${login}|${req.ip}`
  const rec = loginFails.get(key)
  if (rec && rec.count >= 5 && Date.now() - rec.ts < 5 * 60 * 1000) {
    return res.status(429).json({ error: 'Слишком много попыток, подождите несколько минут' })
  }
  const row = login ? db.prepare('SELECT * FROM users WHERE login = ?').get(login) : null
  if (!row || !verifyPassword(password ?? '', row.password_hash)) {
    loginFails.set(key, { count: (rec?.count || 0) + 1, ts: Date.now() })
    return res.status(401).json({ error: 'Неверный логин или пароль' })
  }
  loginFails.delete(key)
  res.json({ token: createSession(row.id), user: publicUser(row) })
})

app.post('/api/auth/logout', (req, res) => { deleteSession(tokenFromReq(req)); res.json({ ok: true }) })
app.get('/api/auth/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }))

// ===== Пользователи (админ) =====
app.get('/api/users', requireAdmin, (req, res) => {
  res.json({ users: db.prepare('SELECT id, name, login, role FROM users ORDER BY created_at').all() })
})

app.post('/api/users', requireAdmin, (req, res) => {
  const name = clean(req.body?.name), login = clean(req.body?.login), password = req.body?.password
  if (!name || !login || !password) return res.status(400).json({ error: 'Заполните имя, логин и пароль' })
  if (req.body?.role != null && !ROLES[req.body.role]) return res.status(400).json({ error: 'Неизвестная роль' })
  if (db.prepare('SELECT 1 FROM users WHERE login = ?').get(login)) return res.status(409).json({ error: 'Логин занят' })
  const role = req.body?.role || 'viewer'
  const user = { id: newId('u'), name, login, role }
  db.prepare('INSERT INTO users(id, name, login, password_hash, role, created_at) VALUES(?, ?, ?, ?, ?, ?)')
    .run(user.id, name, login, hashPassword(password), role, Date.now())
  res.json({ user: publicUser(user) })
})

app.patch('/api/users/:id', requireAdmin, (req, res) => {
  const role = req.body?.role
  if (!ROLES[role]) return res.status(400).json({ error: 'Неизвестная роль' })
  const target = db.prepare('SELECT role FROM users WHERE id = ?').get(req.params.id)
  if (!target) return res.status(404).json({ error: 'Пользователь не найден' })
  if (target.role === 'admin' && role !== 'admin' && adminCount() <= 1) {
    return res.status(409).json({ error: 'Нельзя убрать последнего администратора' })
  }
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id)
  res.json({ ok: true })
})

app.delete('/api/users/:id', requireAdmin, (req, res) => {
  const target = db.prepare('SELECT role FROM users WHERE id = ?').get(req.params.id)
  if (target?.role === 'admin' && adminCount() <= 1) {
    return res.status(409).json({ error: 'Нельзя удалить последнего администратора' })
  }
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(req.params.id)
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// ===== Данные (общая база) — поштучно, чтобы правки разных редакторов не затирали друг друга =====
function collectionRoutes(name, role) {
  app.get(`/api/${name}`, requireAuth, (req, res) => res.json({ [name]: getCollection(name) }))
  app.put(`/api/${name}/:id`, role, (req, res) => {
    const item = req.body?.item
    if (!item || item.id == null) return res.status(400).json({ error: 'Нет элемента' })
    if (String(item.id) !== req.params.id) return res.status(400).json({ error: 'id не совпадает' })
    upsertItem(name, item)
    res.json({ ok: true })
  })
  app.delete(`/api/${name}/:id`, role, (req, res) => {
    deleteItem(name, req.params.id)
    res.json({ ok: true })
  })
}
collectionRoutes('documents', requireEditor)
collectionRoutes('categories', requireEditor)

// templates: GET отдаёт и активный шаблон; PUT/DELETE — поштучно; активный — отдельным роутом.
app.get('/api/templates', requireAuth, (req, res) => {
  res.json({ templates: getCollection('templates'), activeTemplateId: getSetting('activeTemplateId') })
})
app.put('/api/templates/:id', requireEditor, (req, res) => {
  const item = req.body?.item
  if (!item || item.id == null) return res.status(400).json({ error: 'Нет элемента' })
  if (String(item.id) !== req.params.id) return res.status(400).json({ error: 'id не совпадает' })
  upsertItem('templates', item)
  res.json({ ok: true })
})
app.delete('/api/templates/:id', requireEditor, (req, res) => {
  deleteItem('templates', req.params.id)
  res.json({ ok: true })
})
app.put('/api/active-template', requireEditor, (req, res) => {
  setSetting('activeTemplateId', req.body?.activeTemplateId ?? null)
  res.json({ ok: true })
})

// ===== Распознавание фото документа (провайдер выбирается в recognize.js) =====
app.post('/api/recognize', requireEditor, async (req, res) => {
  if (!recognizeConfigured()) return res.status(503).json({ error: 'Распознавание не настроено (нет ключа провайдера)' })
  const m = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(req.body?.image || '')
  if (!m) return res.status(400).json({ error: 'Нужно изображение (data URL base64)' })
  try {
    const draft = await recognize(Buffer.from(m[2], 'base64'), m[1], getCollection('categories'))
    res.json({ draft })
  } catch (e) {
    res.status(502).json({ error: `Распознавание не удалось: ${e.message}` })
  }
})

app.use('/api', (req, res) => res.status(404).json({ error: 'Неизвестный метод API' }))

// ===== Раздача собранного фронта =====
const distDir = join(here, '..', '..', 'web', 'dist')
const indexHtml = join(distDir, 'index.html')
app.use(express.static(distDir))
app.use((req, res) => {
  if (req.method !== 'GET') return res.status(404).end()
  if (!existsSync(indexHtml)) {
    return res.status(503).send('Фронтенд не собран. Выполните: cd web && npm run build')
  }
  res.sendFile(indexHtml)
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Карьер-менеджер: сервер на http://localhost:${PORT}`))
