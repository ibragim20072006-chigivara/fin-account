// Распознавание фото первички через GigaChat (Сбер). Провайдер сменный — экспортирует recognize().
// TLS: сертификаты Сбера (НУЦ Минцифры) — доверие через NODE_EXTRA_CA_CERTS (см. DEPLOY.md).
import { randomUUID } from 'node:crypto'

const OAUTH_URL = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth'
const BASE = 'https://gigachat.devices.sberbank.ru/api/v1'

// env читаем лениво: в index.js loadEnvFile вызывается после импортов.
const authKey = () => process.env.GIGACHAT_AUTH_KEY || ''
const scope = () => process.env.GIGACHAT_SCOPE || 'GIGACHAT_API_PERS'
const model = () => process.env.GIGACHAT_MODEL || 'GigaChat-2-Max'

export const gigachatConfigured = () => !!authKey()

let cached = { token: null, exp: 0 }
let inflight = null

async function getToken() {
  const now = Date.now()
  if (cached.token && now < cached.exp - 60000) return cached.token
  if (inflight) return inflight
  inflight = (async () => {
    const res = await fetch(OAUTH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authKey()}`,
        RqUID: randomUUID(),
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: `scope=${encodeURIComponent(scope())}`,
    })
    if (!res.ok) throw new Error(`OAuth ${res.status}`)
    const data = await res.json()
    cached = { token: data.access_token, exp: Number(data.expires_at) || (now + 25 * 60000) }
    return cached.token
  })().finally(() => { inflight = null })
  return inflight
}

async function uploadImage(buffer, mime, token) {
  const form = new FormData()
  form.append('purpose', 'general')
  form.append('file', new Blob([buffer], { type: mime }), 'doc.jpg')
  const res = await fetch(`${BASE}/files`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    body: form,
  })
  if (!res.ok) throw new Error(`upload ${res.status}`)
  return (await res.json()).id
}

async function complete(fileId, prompt, token) {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      model: model(),
      temperature: 0,
      messages: [{ role: 'user', content: prompt, attachments: [fileId] }],
    }),
  })
  if (!res.ok) throw new Error(`chat ${res.status}`)
  return (await res.json()).choices?.[0]?.message?.content ?? ''
}

function buildPrompt(categories) {
  const list = categories.map((c) => `- ${c.name} (${c.kind === 'income' ? 'приход' : 'расход'})`).join('\n') || '(категорий пока нет)'
  return `На фото — первичный бухгалтерский документ (накладная/чек/акт/ведомость).
Извлеки данные и верни СТРОГО JSON без пояснений и без markdown, по схеме:
{"type":"накладная|чек|акт|ведомость","counterparty":"кто выставил документ","date":"дд.мм.гггг","lines":[{"name":"позиция","qty":"количество как в документе","price":число или null,"category":"имя категории из списка ниже, либо короткое имя новой"}]}
Категории (подбери подходящую к каждой строке по смыслу; если ни одна не подходит — придумай короткое имя новой):
${list}
Нечитаемое поле — пустая строка или null. Числа — без пробелов и символов валют.`
}

function parseJson(text) {
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

function normalize(obj, categories) {
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

// Распознаёт документ по фото. categories — [{id,name,kind}]. Возвращает черновик формы «+ документ».
export async function recognize(buffer, mime, categories = []) {
  const token = await getToken()
  const fileId = await uploadImage(buffer, mime, token)
  const prompt = buildPrompt(categories)
  let raw = await complete(fileId, prompt, token)
  try {
    return normalize(parseJson(raw), categories)
  } catch {
    raw = await complete(fileId, `${prompt}\nВНИМАНИЕ: верни ТОЛЬКО валидный JSON, ничего кроме него.`, token)
    return normalize(parseJson(raw), categories)
  }
}
