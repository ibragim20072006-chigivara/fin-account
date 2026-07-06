// Шаблоны выгрузки и активный шаблон в localStorage.

const TEMPLATES_KEY = 'km_templates'
const ACTIVE_KEY = 'km_active_template'

function read(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export const loadTemplates = (fallback) => read(TEMPLATES_KEY, fallback)
export const loadActiveTemplateId = () => read(ACTIVE_KEY, null)

export function saveTemplates(list) {
  window.localStorage.setItem(TEMPLATES_KEY, JSON.stringify(list))
}

export function saveActiveTemplateId(id) {
  if (id) window.localStorage.setItem(ACTIVE_KEY, JSON.stringify(id))
  else window.localStorage.removeItem(ACTIVE_KEY)
}

export const newTemplateId = () => 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
