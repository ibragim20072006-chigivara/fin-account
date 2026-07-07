import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { initialTemplates, aiSuggestion, ROLES } from './data.js'
import { api, newId, setUnauthorizedHandler } from './api.js'
import { parseNumber } from './import.js'

const REFRESH_MS = 25000 // периодический рефетч: видеть чужие правки, обновлять роль/сессию

const AppContext = createContext(null)

export const STATUS = {
  processing: { label: 'в обработке…', tone: 'neutral' },
  review: { label: 'проверить', tone: 'warning' },
  ready: { label: 'готово', tone: 'success' },
  shipped: { label: 'отгружено', tone: 'muted' },
}

export const DOC_TYPES = ['накладная', 'чек', 'ведомость', 'акт']
export const DOC_TYPE_LABEL = {
  накладная: 'Накладная', чек: 'Чек', ведомость: 'Ведомость', акт: 'Акт', импорт: 'Импорт',
}

// Статус — производная от строк: документ «готов», только когда у всех строк есть сумма.
// Строка без суммы (ИИ не уверен, либо ручной/импортный ввод без цены) держит его в «проверить».
export function docStatus(doc) {
  if (doc.status === 'processing' || doc.status === 'shipped') return doc.status
  return doc.lines.some((l) => l.sum == null) ? 'review' : 'ready'
}

export function docTotal(doc) {
  let total = 0
  let unknown = false
  for (const l of doc.lines) {
    if (l.sum == null) unknown = true
    else total += l.sum
  }
  return { total, unknown }
}

const CHART_PALETTE = [
  'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)',
  'var(--chart-5)', 'var(--chart-g1)', 'var(--chart-g2)', 'var(--chart-g3)',
]

// Категория строки по ссылке (id), с фолбэком на имя для старых документов.
export function lineCategory(line, byId, byName) {
  if (line.categoryId && byId.has(line.categoryId)) return byId.get(line.categoryId)
  if (line.category && byName.has(line.category)) return byName.get(line.category)
  return null
}

function docsForCategory(shipped, catId, catOf) {
  const out = []
  for (const doc of shipped) {
    const sum = doc.lines.filter((l) => catOf(l)?.id === catId && l.sum != null).reduce((s, l) => s + l.sum, 0)
    if (sum > 0) out.push({ date: doc.date ?? '', name: doc.title, who: doc.uploadedBy ?? '', sum, queueId: doc.id })
  }
  return out
}

function groupByKind(shipped, catOf, kind) {
  const acc = new Map() // id -> { id, name, account, sum }
  for (const doc of shipped) {
    for (const l of doc.lines) {
      if (l.sum == null) continue
      const cat = catOf(l)
      if (!cat || cat.kind !== kind) continue
      const cur = acc.get(cat.id) ?? { id: cat.id, name: cat.name, account: cat.account ?? '', sum: 0 }
      cur.sum += l.sum
      acc.set(cat.id, cur)
    }
  }
  const items = [...acc.values()].sort((a, b) => b.sum - a.sum)
  const total = items.reduce((s, i) => s + i.sum, 0)
  return items.map((it, i) => ({
    ...it,
    pct: total ? Math.round((it.sum / total) * 100) : 0,
    color: CHART_PALETTE[i % CHART_PALETTE.length],
    docs: docsForCategory(shipped, it.id, catOf),
  }))
}

// Приход — поступления (income), Расход — выплаты (expense), Выручка = Приход − Расход.
export function computeReports(documents, categories) {
  const byId = new Map(categories.map((c) => [c.id, c]))
  const byName = new Map(categories.map((c) => [c.name, c]))
  const catOf = (l) => lineCategory(l, byId, byName)
  const shipped = documents.filter((d) => d.status === 'shipped')

  const receipts = groupByKind(shipped, catOf, 'income')
  const payments = groupByKind(shipped, catOf, 'expense')
  const prihod = receipts.reduce((s, i) => s + i.sum, 0)
  const rashod = payments.reduce((s, i) => s + i.sum, 0)

  return {
    hasData: prihod > 0 || rashod > 0,
    shippedCount: shipped.length,
    prihod, rashod, vyruchka: prihod - rashod,
    receipts, payments,
  }
}

const LEGACY_KEYS = ['km_users', 'km_session', 'km_templates', 'km_active_template']
const nowLabel = () => new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

export function AppProvider({ children }) {
  const [screen, setScreen] = useState('queue')
  const [documents, setDocuments] = useState([])
  const [selectedDocId, setSelectedDocId] = useState(null)
  const [categories, setCategories] = useState([])
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [templates, setTemplates] = useState(initialTemplates)
  const [activeTemplateId, setActiveTemplateId] = useState(null)
  const [suggestion, setSuggestion] = useState(aiSuggestion)
  const [toast, setToast] = useState(null)

  const [currentUser, setCurrentUser] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const toastTimer = useRef(null)
  const saveTimers = useRef({}) // дебаунс частых текстовых правок (лейблы колонок)
  const sessionEpoch = useRef(0) // растёт при logout/401 — отложенные операции сверяются и не применяются

  const role = currentUser ? ROLES[currentUser.role] ?? ROLES.viewer : null
  const canEdit = !!role?.canEdit
  const isAdmin = !!role?.isAdmin

  // Резолв категории строки по id (с фолбэком на имя) — единый источник имени/счёта/типа.
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const catByName = useMemo(() => new Map(categories.map((c) => [c.name, c])), [categories])
  const getCategory = (id) => catById.get(id) ?? null
  const categoryOfLine = (line) => lineCategory(line, catById, catByName)

  const showToast = (text) => {
    setToast(text)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 3200)
  }

  // ===== Загрузка/рефетч данных =====
  const loadWorkspace = async () => {
    const [docs, cats, tpls] = await Promise.all([api.getDocuments(), api.getCategories(), api.getTemplates()])
    setDocuments(docs)
    setCategories(cats)
    setTemplates(tpls.templates.length ? tpls.templates : initialTemplates)
    setActiveTemplateId(tpls.activeTemplateId)
  }

  // Оптимистичный локальный апдейт уже сделан; фоново пишем на сервер, при ошибке — тост + рефетч (откат).
  const persistDoc = (doc) => api.saveDocument(doc).catch((e) => { showToast(e.message); refetch('documents') })
  const persistCat = (cat) => api.saveCategory(cat).catch((e) => { showToast(e.message); refetch('categories') })
  const removeDocRemote = (id) => api.deleteDocument(id).catch((e) => { showToast(e.message); refetch('documents') })

  const refetch = (kind) => {
    if (kind === 'documents') return api.getDocuments().then(setDocuments).catch(() => {})
    if (kind === 'categories') return api.getCategories().then(setCategories).catch(() => {})
    return api.getTemplates().then((t) => {
      setTemplates(t.templates.length ? t.templates : initialTemplates)
      setActiveTemplateId(t.activeTemplateId)
    }).catch(() => {})
  }

  const resetSession = () => {
    sessionEpoch.current += 1
    Object.values(saveTimers.current).forEach((t) => window.clearTimeout(t))
    saveTimers.current = {}
    setCurrentUser(null)
    setUsers([])
    setDocuments([])
    setCategories([])
    setTemplates(initialTemplates)
    setActiveTemplateId(null)
    setSelectedDocId(null)
    setSelectedCategoryId(null)
  }

  useEffect(() => {
    LEGACY_KEYS.forEach((k) => { try { window.localStorage.removeItem(k) } catch { /* ignore */ } })
    setUnauthorizedHandler(() => { resetSession(); showToast('Сессия завершена — войдите снова') })
    ;(async () => {
      if (api.getToken()) {
        try {
          setCurrentUser(await api.me())
          await loadWorkspace()
        } catch {
          api.clearToken()
        }
      }
      setLoading(false)
    })()
    return () => setUnauthorizedHandler(null)
  }, [])

  // Периодический рефетч: чужие правки + актуальная роль/сессия (api.me() при 401 сам вернёт на вход).
  useEffect(() => {
    if (!currentUser) return undefined
    const id = window.setInterval(async () => {
      try {
        setCurrentUser(await api.me())
        await loadWorkspace()
      } catch { /* ошибки (в т.ч. 401) обрабатываются в api */ }
    }, REFRESH_MS)
    return () => window.clearInterval(id)
  }, [currentUser?.id])

  // ===== Авторизация =====
  const register = async ({ name, login, password, role: chosen }) => {
    setCurrentUser(await api.register({ name, login, password, role: chosen }))
    await loadWorkspace()
  }
  const loginUser = async ({ login, password }) => {
    setCurrentUser(await api.login({ login, password }))
    await loadWorkspace()
  }
  const logout = async () => {
    await api.logout().catch(() => {})
    resetSession()
  }

  // ===== Пользователи (админ) =====
  const loadUsers = async () => {
    try { setUsers(await api.listUsers()) } catch (e) { showToast(e.message) }
  }
  const addUser = async ({ name, login, password, role: chosen }) => {
    await api.addUser({ name, login, password, role: chosen })
    await loadUsers()
    showToast(`Пользователь «${name}» добавлен`)
  }
  const setUserRole = async (id, nextRole) => {
    try {
      await api.setUserRole(id, nextRole)
      if (id === currentUser?.id) setCurrentUser((u) => ({ ...u, role: nextRole }))
      await loadUsers()
    } catch (e) { showToast(e.message) }
  }
  const removeUser = async (id) => {
    try {
      await api.removeUser(id)
      if (id === currentUser?.id) logout()
      else await loadUsers()
    } catch (e) { showToast(e.message) }
  }

  // ===== Документы =====
  const resolveLine = (docId, lineId, price) => {
    const doc = documents.find((d) => d.id === docId)
    if (!doc) return
    const by = currentUser?.name ?? ''
    const at = nowLabel()
    const lines = doc.lines.map((l) => {
      if (l.id !== lineId) return l
      const sum = Math.round((l.qtyValue ?? 1) * price)
      return { ...l, price, sum, resolvedBy: by, resolvedAt: at }
    })
    const updated = { ...doc, lines }
    setDocuments((docs) => docs.map((d) => (d.id === docId ? updated : d)))
    persistDoc(updated)
  }

  const shipDoc = (docId) => {
    const doc = documents.find((d) => d.id === docId)
    if (!doc || docTotal(doc).unknown) return
    const updated = { ...doc, status: 'shipped' }
    setDocuments((docs) => docs.map((d) => (d.id === docId ? updated : d)))
    persistDoc(updated)
    showToast('Документ отгружён в учёт')
  }

  const shipReady = () => {
    const ready = documents.filter((d) => docStatus(d) === 'ready' && !docTotal(d).unknown)
    if (!ready.length) return 0
    const shippedIds = new Set(ready.map((d) => d.id))
    setDocuments((docs) => docs.map((d) => (shippedIds.has(d.id) ? { ...d, status: 'shipped' } : d)))
    ready.forEach((d) => persistDoc({ ...d, status: 'shipped' }))
    showToast('Готовые документы отгружены в учёт')
    return ready.length
  }

  const openDocInQueue = (docId) => {
    setScreen('queue')
    if (docId) setSelectedDocId(docId)
  }

  const addDocument = ({ type = 'накладная', title, counterparty = '', date = '', lines }) => {
    const at = nowLabel()
    const id = newId('doc')
    const who = currentUser?.name ?? ''
    const cleanLines = lines.map((l, i) => ({
      id: `l${i}`,
      name: l.name,
      qty: l.qty ?? '',
      qtyValue: l.qtyValue ?? null,
      price: l.price ?? null,
      sum: l.sum ?? (l.qtyValue != null && l.price != null ? Math.round(l.qtyValue * l.price) : null),
      categoryId: l.categoryId ?? null,
    }))
    const doc = {
      id, type,
      title: title?.trim() || 'Документ',
      counterparty,
      subtitle: [counterparty, date].filter(Boolean).join(' · '),
      panelSubtitle: [counterparty, date, who && `добавил ${who}`].filter(Boolean).join(' · '),
      date,
      uploadedBy: who,
      uploadedAt: at,
      status: 'review',
      photoLabel: 'документ добавлен вручную',
      lines: cleanLines,
    }
    setDocuments((docs) => [doc, ...docs])
    setSelectedDocId(id)
    persistDoc(doc)
    showToast('Документ добавлен в очередь')
    return id
  }

  // Правка/удаление позиции — работает и для отгруженных документов (отчёты пересчитываются).
  const updateLine = (docId, lineId, { name, qty, price, categoryId }) => {
    const doc = documents.find((d) => d.id === docId)
    if (!doc) return
    const qtyValue = parseNumber(qty)
    const sum = price != null ? Math.round((qtyValue ?? 1) * price) : null
    const lines = doc.lines.map((l) => (l.id === lineId
      ? {
        ...l, name, qty, qtyValue, price, sum, categoryId: categoryId || null,
        flag: undefined, resolvedAt: undefined, resolvedBy: undefined, priceRaw: undefined, candidates: undefined,
      }
      : l))
    const updated = { ...doc, lines }
    setDocuments((docs) => docs.map((d) => (d.id === docId ? updated : d)))
    persistDoc(updated)
  }

  const removeLine = (docId, lineId) => {
    const doc = documents.find((d) => d.id === docId)
    if (!doc) return
    const updated = { ...doc, lines: doc.lines.filter((l) => l.id !== lineId) }
    setDocuments((docs) => docs.map((d) => (d.id === docId ? updated : d)))
    persistDoc(updated)
  }

  const addDocuments = (docs) => {
    if (!docs.length) return 0
    setDocuments((prev) => [...docs, ...prev])
    setSelectedDocId(docs[0].id)
    docs.forEach(persistDoc)
    return docs.length
  }

  // ===== Категории =====
  const addCategory = ({ name, kind, account }) => {
    const cat = {
      id: newId('cat'), kind: kind === 'income' ? 'income' : 'expense',
      name: name.trim(), account: (account ?? '').trim(),
      keywords: [], threshold: 90, matches: [], linesMonth: 0, sumMonth: 0,
    }
    setCategories((cats) => [...cats, cat])
    setSelectedCategoryId(cat.id)
    persistCat(cat)
    showToast(`Категория «${cat.name}» создана`)
    return cat.id
  }

  const removeCategory = (id) => {
    setCategories((cats) => cats.filter((c) => c.id !== id))
    if (id === selectedCategoryId) setSelectedCategoryId(null)
    api.deleteCategory(id).catch((e) => { showToast(e.message); refetch('categories') })
  }

  const addKeyword = (categoryId, word) => {
    const cat = categories.find((c) => c.id === categoryId)
    if (!cat || !word || cat.keywords.includes(word)) return
    const updated = { ...cat, keywords: [...cat.keywords, word] }
    setCategories((cats) => cats.map((c) => (c.id === categoryId ? updated : c)))
    persistCat(updated)
  }

  const setThreshold = (categoryId, threshold) => {
    const cat = categories.find((c) => c.id === categoryId)
    if (!cat) return
    const updated = { ...cat, threshold }
    setCategories((cats) => cats.map((c) => (c.id === categoryId ? updated : c)))
    persistCat(updated)
  }

  const createSuggestedCategory = () => {
    if (!suggestion) return
    const cat = {
      id: newId('cat'), kind: 'expense', name: suggestion.name, account: '60.01',
      linesMonth: suggestion.lines.length,
      sumMonth: suggestion.lines.reduce((s, l) => s + l.sum, 0),
      keywords: [], threshold: 90,
      matches: suggestion.lines.map((l) => ({ text: l.text, doc: l.doc, pct: 93 })),
    }
    setCategories((cats) => [...cats, cat])
    setSelectedCategoryId(cat.id)
    setSuggestion(null)
    persistCat(cat)
    showToast(`Категория «${cat.name}» создана`)
  }

  // ===== Шаблоны =====
  const activeTemplate = templates.find((t) => t.id === activeTemplateId)
    ?? templates.find((t) => t.isDefault) ?? templates[0]

  // Дебаунс на текстовые правки шаблона (лейблы колонок), чтобы не слать запрос на каждое нажатие.
  const saveTemplateDebounced = (tpl) => {
    const epoch = sessionEpoch.current
    window.clearTimeout(saveTimers.current[tpl.id])
    saveTimers.current[tpl.id] = window.setTimeout(() => {
      if (epoch !== sessionEpoch.current) return
      api.saveTemplate(tpl).catch((e) => { showToast(e.message); refetch('templates') })
    }, 400)
  }

  const addTemplate = (name) => {
    const tpl = {
      id: newId('tpl'),
      name: (name ?? '').trim() || 'Новый шаблон',
      isDefault: false,
      columns: activeTemplate?.columns?.map((c) => ({ ...c })) ?? [],
    }
    setTemplates((ts) => [...ts, tpl])
    api.saveTemplate(tpl).catch((e) => { showToast(e.message); refetch('templates') })
    return tpl.id
  }
  const renameTemplate = (id, name) => {
    const trimmed = (name ?? '').trim()
    const tpl = templates.find((t) => t.id === id)
    if (!trimmed || !tpl) return
    const updated = { ...tpl, name: trimmed }
    setTemplates((ts) => ts.map((t) => (t.id === id ? updated : t)))
    api.saveTemplate(updated).catch((e) => { showToast(e.message); refetch('templates') })
  }
  const updateTemplateColumns = (id, columns) => {
    if (!columns.length) return
    const tpl = templates.find((t) => t.id === id)
    if (!tpl) return
    const updated = { ...tpl, columns }
    setTemplates((ts) => ts.map((t) => (t.id === id ? updated : t)))
    saveTemplateDebounced(updated)
  }
  const removeTemplate = (id) => {
    if (templates.length <= 1) return
    setTemplates((ts) => ts.filter((t) => t.id !== id))
    api.deleteTemplate(id).catch((e) => { showToast(e.message); refetch('templates') })
    if (id === activeTemplateId) {
      setActiveTemplateId(null)
      api.setActiveTemplate(null).catch(() => {})
    }
  }
  const setActiveTemplate = (id) => {
    setActiveTemplateId(id)
    api.setActiveTemplate(id).catch((e) => { showToast(e.message); refetch('templates') })
  }

  const value = useMemo(() => ({
    loading,
    screen, setScreen,
    documents, selectedDocId, setSelectedDocId,
    categories, selectedCategoryId, setSelectedCategoryId,
    templates, activeTemplate, suggestion, setSuggestion,
    addTemplate, renameTemplate, updateTemplateColumns, removeTemplate, setActiveTemplate,
    currentUser, role, canEdit, isAdmin,
    users, loadUsers, register, login: loginUser, logout, addUser, setUserRole, removeUser,
    resolveLine, shipDoc, shipReady, openDocInQueue,
    addDocument, addDocuments, updateLine, removeLine,
    addCategory, removeCategory, addKeyword, setThreshold, createSuggestedCategory,
    getCategory, categoryOfLine,
    toast, showToast,
  }), [loading, screen, documents, selectedDocId, categories, selectedCategoryId,
    templates, activeTemplateId, suggestion, currentUser, users, toast])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => useContext(AppContext)
