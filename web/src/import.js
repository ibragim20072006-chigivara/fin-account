import { EXPORT_COLUMNS } from './data.js'

// Первое число из строки: "26,4 т" → 26.4, "3 200" → 3200.
export function parseNumber(value) {
  if (typeof value === 'number') return value
  const s = String(value ?? '').replace(/\s/g, '').replace(',', '.')
  const m = s.match(/-?\d+(\.\d+)?/)
  return m ? Number(m[0]) : null
}

function splitCsvLine(line, delim) {
  const cells = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++ }
      else if (ch === '"') inQuotes = false
      else cur += ch
    } else if (ch === '"') inQuotes = true
    else if (ch === delim) { cells.push(cur); cur = '' }
    else cur += ch
  }
  cells.push(cur)
  return cells.map((c) => c.trim())
}

// Сопоставляет заголовок столбца с полем: подписи активного шаблона, затем
// стандартные подписи каталога, затем ключи каталога.
function headerToKey(header, template) {
  const h = header.trim().toLowerCase()
  const fromTemplate = template?.columns?.find((c) => (c.label ?? '').toLowerCase() === h)
  if (fromTemplate) return fromTemplate.key
  const fromCatalog = EXPORT_COLUMNS.find((c) => c.label.toLowerCase() === h || c.key.toLowerCase() === h)
  return fromCatalog ? fromCatalog.key : null
}

// CSV → массив строк-объектов по полям каталога (по совпадению заголовков).
export function parseCsv(text, template) {
  const clean = String(text).replace(/^﻿/, '')
  const lines = clean.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []

  const delim = lines[0].includes(';') ? ';' : ','
  const header = splitCsvLine(lines[0], delim)
  const keys = header.map((h) => headerToKey(h, template))

  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line, delim)
    const row = {}
    keys.forEach((k, i) => { if (k) row[k] = cells[i] ?? '' })
    return row
  })
}

// Строки группируются в документы по (дата + контрагент).
export function rowsToDocuments(rows, uploadedBy = '') {
  const at = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  const groups = new Map()

  for (const row of rows) {
    const date = row.date ?? ''
    const counterparty = row.counterparty ?? ''
    const key = `${date}|${counterparty}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(row)
  }

  const docs = []
  let n = 0
  for (const [key, groupRows] of groups) {
    const [date, counterparty] = key.split('|')
    const lines = groupRows.map((r, i) => {
      const qtyValue = parseNumber(r.qty)
      const price = parseNumber(r.price)
      const sum = parseNumber(r.sum) ?? (qtyValue != null && price != null ? Math.round(qtyValue * price) : null)
      return {
        id: `l${i}`,
        name: r.category || 'Позиция',
        qty: r.qty ?? '',
        qtyValue,
        price,
        sum,
        category: r.category || '',
        account: r.account || '',
      }
    })
    docs.push({
      id: `imp${Date.now().toString(36)}_${n++}`,
      type: 'импорт',
      title: counterparty ? `Импорт · ${counterparty}` : 'Импорт',
      counterparty,
      subtitle: counterparty,
      panelSubtitle: `${counterparty} · ${date} · импорт из файла`,
      date,
      uploadedBy,
      uploadedAt: at,
      status: 'ready',
      photoLabel: 'импортировано из файла',
      lines,
    })
  }
  return docs
}
