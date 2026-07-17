// Распознавание фото первички через Google Gemini (AI Studio). Провайдер сменный — экспортирует recognize().
// Из РФ до google обычно нужен VPN/прокси на самом сервере; адрес вынесен в GEMINI_BASE_URL.
import { buildPrompt, parseJson, normalize } from './recognize-common.js'

// env читаем лениво: loadEnvFile вызывается после импортов.
const base = () => process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com'
const apiKey = () => process.env.GEMINI_API_KEY || ''
const model = () => process.env.GEMINI_MODEL || 'gemini-3.5-flash'

export const geminiConfigured = () => !!apiKey()

// Понятное сообщение об ошибке по HTTP-статусу (уходит в тост пользователю).
function statusMessage(status) {
  if (status === 429) return 'превышен лимит запросов Gemini — повторите позже или проверьте квоту'
  if (status === 401 || status === 403) return 'ключ Gemini недействителен или нет доступа'
  return null
}

async function generate(parts) {
  const url = `${base()}/v1beta/models/${model()}:generateContent`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'x-goog-api-key': apiKey(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { temperature: 0, responseMimeType: 'application/json' },
    }),
  })
  if (!res.ok) throw new Error(statusMessage(res.status) || `распознавание Gemini (${res.status})`)
  const data = await res.json()
  return (data.candidates?.[0]?.content?.parts || []).map((p) => p.text ?? '').join('')
}

// Распознаёт документ по фото. categories — [{id,name,kind}]. Возвращает черновик формы «+ документ».
export async function recognize(buffer, mime, categories = []) {
  const image = { inline_data: { mime_type: mime, data: buffer.toString('base64') } }
  const parts = [{ text: buildPrompt(categories) }, image]
  let raw = await generate(parts)
  try {
    return normalize(parseJson(raw), categories)
  } catch {
    raw = await generate([{ text: `${buildPrompt(categories)}\nВерни ТОЛЬКО валидный JSON, ничего кроме него.` }, image])
    return normalize(parseJson(raw), categories)
  }
}
