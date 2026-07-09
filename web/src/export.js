import { EXPORT_COLUMNS } from './data.js'

// Строки выгрузки по отгруженным документам (одна строка на позицию документа).
// catOf(line) → объект категории (имя берём из него; фолбэк на старое line.category).
export function buildExportRows(documents, catOf = () => null) {
  const rows = []
  for (const doc of documents) {
    if (doc.status !== 'shipped') continue
    for (const line of doc.lines) {
      const cat = catOf(line)
      rows.push({
        date: doc.date ?? '',
        counterparty: doc.counterparty ?? '',
        category: cat?.name ?? line.category ?? '',
        kind: cat ? (cat.kind === 'income' ? 'Приход' : 'Расход') : '',
        qty: line.qtyValue ?? line.qty ?? '',
        price: line.price ?? '',
        sum: line.sum ?? '',
      })
    }
  }
  return rows
}

function csvCell(value) {
  const s = String(value ?? '')
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(rows, columns = EXPORT_COLUMNS) {
  const header = columns.map((c) => c.label)
  const body = rows.map((r) => columns.map((c) => csvCell(r[c.key])))
  return [header, ...body].map((cols) => cols.join(';')).join('\r\n')
}

// Скачивает CSV-отчёт из отгруженных документов (фиксированный набор колонок).
// Возвращает число строк (0 — скачивать нечего).
export function downloadShipmentCsv(documents, categories = [], filename = 'отчёт.csv') {
  const byId = new Map(categories.map((c) => [c.id, c]))
  const byName = new Map(categories.map((c) => [c.name, c]))
  const catOf = (l) => (l.categoryId && byId.get(l.categoryId)) || (l.category && byName.get(l.category)) || null
  const rows = buildExportRows(documents, catOf)
  if (!rows.length) return 0

  const blob = new Blob(['﻿' + toCsv(rows, EXPORT_COLUMNS)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  return rows.length
}
