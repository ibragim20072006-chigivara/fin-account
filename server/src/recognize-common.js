// Общая логика распознавания первички, не зависящая от провайдера:
// промпт, парсинг JSON из ответа модели, нормализация в черновик формы «+ документ».

export function buildPrompt(categories) {
  const list = categories.map((c) => `- ${c.name} (${c.kind === 'income' ? 'приход' : 'расход'})`).join('\n') || '(категорий пока нет)'
  return `На фото — первичный бухгалтерский документ (накладная/чек/акт/ведомость).
Извлеки данные и верни СТРОГО JSON без пояснений и без markdown, по схеме:
{"type":"накладная|чек|акт|ведомость","counterparty":"кто выставил документ","date":"дд.мм.гггг","lines":[{"name":"позиция","qty":"количество как в документе","price":число или null,"category":"имя категории из списка ниже, либо короткое имя новой"}]}
Категории (подбери подходящую к каждой строке по смыслу; если ни одна не подходит — придумай короткое имя новой):
${list}
Нечитаемое поле — пустая строка или null. Числа — без пробелов и символов валют.`
}

export function parseJson(text) {
  let s = String(text).trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  const i = s.indexOf('{'); const j = s.lastIndexOf('}')
  if (i >= 0 && j > i) s = s.slice(i, j + 1)
  return JSON.parse(s)
}

const DOC_TYPES = ['накладная', 'чек', 'ведомость', 'акт']
const parseNumber = (v) => {
  if (typeof v === 'number') return v
  const m = String(v ?? '').replace(/\s/g, '').replace(',', '.').match(/-?\d+(\.\d+)?/)
  return m ? Number(m[0]) : null
}

export function normalize(obj, categories) {
  const byName = new Map(categories.map((c) => [String(c.name).toLowerCase(), c]))
  const suggested = []
  const seen = new Set()
  const lines = (Array.isArray(obj.lines) ? obj.lines : []).map((l) => {
    const price = parseNumber(l.price)
    const qtyValue = parseNumber(l.qty) ?? 1
    const catName = String(l.category ?? '').trim()
    let categoryId = null
    if (catName) {
      const hit = byName.get(catName.toLowerCase())
      if (hit) categoryId = hit.id
      else if (!seen.has(catName.toLowerCase())) {
        seen.add(catName.toLowerCase())
        const kind = /продаж|выруч|реализ|доход|приход/i.test(catName) ? 'income' : 'expense'
        suggested.push({ name: catName, kind })
      }
    }
    return {
      name: String(l.name ?? '').trim() || 'Позиция',
      qty: String(l.qty ?? '').trim() || '1',
      qtyValue,
      price,
      sum: price != null ? Math.round(qtyValue * price) : null,
      categoryId,
    }
  })
  return {
    type: DOC_TYPES.includes(String(obj.type)) ? obj.type : 'накладная',
    counterparty: String(obj.counterparty ?? '').trim(),
    date: String(obj.date ?? '').trim(),
    lines,
    suggestedCategories: suggested,
  }
}
