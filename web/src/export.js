import { EXPORT_COLUMNS } from './data.js'

// Строки выгрузки по отгруженным документам (одна строка на позицию документа).
export function buildExportRows(documents) {
  const rows = []
  for (const doc of documents) {
    if (doc.status !== 'shipped') continue
    for (const line of doc.lines) {
      rows.push({
        date: doc.date ?? '',
        counterparty: doc.counterparty ?? '',
        category: line.category ?? '',
        qty: line.qtyValue ?? line.qty ?? '',
        price: line.price ?? '',
        sum: line.sum ?? '',
        account: accountOf(line),
      })
    }
  }
  return rows
}

function accountOf(line) {
  return line.account ?? ''
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

// Скачивает CSV из отгруженных документов по колонкам активного шаблона.
// Возвращает число строк (0 — скачивать нечего).
export function downloadShipmentCsv(documents, template, filename = 'выгрузка.csv') {
  const rows = buildExportRows(documents)
  if (!rows.length) return 0

  const columns = template?.columns ?? EXPORT_COLUMNS
  const blob = new Blob(['﻿' + toCsv(rows, columns)], { type: 'text/csv;charset=utf-8;' })
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
