// Распознавание фото первички через GigaChat (Сбер). Провайдер сменный — экспортирует recognize().
// TLS: сертификаты Сбера (НУЦ Минцифры) — доверие через NODE_EXTRA_CA_CERTS (см. DEPLOY.md).
import { randomUUID } from 'node:crypto'
import { buildPrompt, parseJson, normalize } from './recognize-common.js'

const OAUTH_URL = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth'
const BASE = 'https://gigachat.devices.sberbank.ru/api/v1'

// env читаем лениво: в index.js loadEnvFile вызывается после импортов.
const authKey = () => process.env.GIGACHAT_AUTH_KEY || ''
const scope = () => process.env.GIGACHAT_SCOPE || 'GIGACHAT_API_PERS'
const model = () => process.env.GIGACHAT_MODEL || 'GigaChat-2-Max'

export const gigachatConfigured = () => !!authKey()

// Понятное сообщение об ошибке GigaChat по HTTP-статусу (уходит в тост пользователю).
function statusMessage(status) {
  if (status === 402) return 'закончился баланс GigaChat — пополните в личном кабинете Сбера'
  if (status === 429) return 'слишком много запросов к GigaChat — повторите через минуту'
  if (status === 401 || status === 403) return 'ключ GigaChat недействителен или истёк'
  return null
}

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
    if (!res.ok) throw new Error(statusMessage(res.status) || `авторизация GigaChat (${res.status})`)
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
  if (!res.ok) throw new Error(statusMessage(res.status) || `загрузка фото (${res.status})`)
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
  if (!res.ok) throw new Error(statusMessage(res.status) || `распознавание (${res.status})`)
  return (await res.json()).choices?.[0]?.message?.content ?? ''
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
