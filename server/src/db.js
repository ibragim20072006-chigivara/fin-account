import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const dbPath = process.env.DB_PATH || join(here, '..', 'data.db')

export const db = new DatabaseSync(dbPath)

db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    login TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS documents (id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at INTEGER);
  CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at INTEGER);
  CREATE TABLE IF NOT EXISTS templates (id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at INTEGER);
  CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
`)

// Миграция старых баз: добавить updated_at, если колонки ещё нет.
for (const table of ['categories', 'templates']) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all()
  if (!cols.some((c) => c.name === 'updated_at')) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN updated_at INTEGER`)
  }
}

// Дефолтный шаблон выгрузки — сид при пустой таблице (шаблоны «не удаляются»).
const EXPORT_COLUMNS = [
  { key: 'date', label: 'Дата' },
  { key: 'counterparty', label: 'Контрагент' },
  { key: 'category', label: 'Номенклатура' },
  { key: 'qty', label: 'Кол-во' },
  { key: 'price', label: 'Цена' },
  { key: 'sum', label: 'Сумма' },
  { key: 'account', label: 'Счёт учёта' },
]

if (db.prepare('SELECT COUNT(*) AS n FROM templates').get().n === 0) {
  const tpl = { id: 'main', name: 'шаблон_учёт', isDefault: true, columns: EXPORT_COLUMNS }
  db.prepare('INSERT INTO templates(id, data, updated_at) VALUES(?, ?, ?)').run(tpl.id, JSON.stringify(tpl), Date.now())
  db.prepare('INSERT OR REPLACE INTO settings(key, value) VALUES(?, ?)').run('activeTemplateId', JSON.stringify('main'))
}

// Коллекции документов/категорий/шаблонов хранятся как строки с JSON-полем data.
export function getCollection(table) {
  return db.prepare(`SELECT data FROM ${table}`).all().map((r) => JSON.parse(r.data))
}

// Поштучное сохранение: не трогает остальные строки — правки разных редакторов не затирают друг друга.
export function upsertItem(table, item) {
  db.prepare(`
    INSERT INTO ${table}(id, data, updated_at) VALUES(?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
  `).run(String(item.id), JSON.stringify(item), Date.now())
}

export function deleteItem(table, id) {
  db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(String(id))
}

export function getSetting(key) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key)
  return row ? JSON.parse(row.value) : null
}

export function setSetting(key, value) {
  db.prepare('INSERT OR REPLACE INTO settings(key, value) VALUES(?, ?)').run(key, JSON.stringify(value))
}
