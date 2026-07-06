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
  CREATE TABLE IF NOT EXISTS documents (id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, data TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS templates (id TEXT PRIMARY KEY, data TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
`)

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
  db.prepare('INSERT INTO templates(id, data) VALUES(?, ?)').run(tpl.id, JSON.stringify(tpl))
  db.prepare('INSERT OR REPLACE INTO settings(key, value) VALUES(?, ?)').run('activeTemplateId', JSON.stringify('main'))
}

// Коллекции документов/категорий/шаблонов хранятся как строки с JSON-полем data.
export function getCollection(table) {
  return db.prepare(`SELECT data FROM ${table}`).all().map((r) => JSON.parse(r.data))
}

export function putCollection(table, items, withUpdated = false) {
  db.exec('BEGIN')
  try {
    db.prepare(`DELETE FROM ${table}`).run()
    const sql = withUpdated
      ? `INSERT INTO ${table}(id, data, updated_at) VALUES(?, ?, ?)`
      : `INSERT INTO ${table}(id, data) VALUES(?, ?)`
    const insert = db.prepare(sql)
    for (const it of items) {
      if (!it || it.id == null) continue
      if (withUpdated) insert.run(String(it.id), JSON.stringify(it), Date.now())
      else insert.run(String(it.id), JSON.stringify(it))
    }
    db.exec('COMMIT')
  } catch (e) {
    db.exec('ROLLBACK')
    throw e
  }
}

export function getSetting(key) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key)
  return row ? JSON.parse(row.value) : null
}

export function setSetting(key, value) {
  db.prepare('INSERT OR REPLACE INTO settings(key, value) VALUES(?, ?)').run(key, JSON.stringify(value))
}
