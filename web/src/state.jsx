import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { initialTemplates, aiSuggestion, ROLES } from './data.js'
import { api, newId } from './api.js'

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

export function docStatus(doc) {
  if (doc.status === 'review' && !doc.lines.some((l) => l.flag && !l.resolvedAt)) return 'ready'
  return doc.status
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

function docsForCategory(shipped, name) {
  const out = []
  for (const doc of shipped) {
    const sum = doc.lines.filter((l) => l.category === name && l.sum != null).reduce((s, l) => s + l.sum, 0)
    if (sum > 0) out.push({ date: doc.date ?? '', name: doc.title, who: doc.uploadedBy ?? '', sum, queueId: doc.id })
  }
  return out
}

function groupByCategory(shipped, kindByName, kind) {
  const sums = new Map()
  for (const doc of shipped) {
    for (const l of doc.lines) {
      if (l.sum == null || kindByName[l.category] !== kind) continue
      sums.set(l.category, (sums.get(l.category) ?? 0) + l.sum)
    }
  }
  const items = [...sums.entries()].map(([name, sum]) => ({ name, sum })).sort((a, b) => b.sum - a.sum)
  const total = items.reduce((s, i) => s + i.sum, 0)
  return items.map((it, i) => ({
    ...it,
    pct: total ? Math.round((it.sum / total) * 100) : 0,
    color: CHART_PALETTE[i % CHART_PALETTE.length],
    docs: docsForCategory(shipped, it.name),
  }))
}

export function computeReports(documents, categories) {
  const kindByName = {}
  for (const c of categories) kindByName[c.name] = c.kind
  const shipped = documents.filter((d) => d.status === 'shipped')

  const receipts = groupByCategory(shipped, kindByName, 'income')
  const payments = groupByCategory(shipped, kindByName, 'expense')
  const revenue = receipts.reduce((s, i) => s + i.sum, 0)
  const expensesTotal = payments.reduce((s, i) => s + i.sum, 0)

  return {
    hasData: revenue > 0 || expensesTotal > 0,
    shippedCount: shipped.length,
    opu: { revenue, expensesTotal, profit: revenue - expensesTotal, expenses: payments },
    dds: { inflow: revenue, outflow: expensesTotal, receipts, payments },
  }
}

const LEGACY_KEYS = ['km_users', 'km_session', 'km_templates', 'km_active_template']

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

  const readyRef = useRef(false)
  const saveTimers = useRef({})

  const role = currentUser ? ROLES[currentUser.role] ?? ROLES.viewer : null
  const canEdit = !!role?.canEdit
  const isAdmin = !!role?.isAdmin

  const showToast = (text) => {
    setToast(text)
    window.clearTimeout(showToast._t)
    showToast._t = window.setTimeout(() => setToast(null), 3200)
  }

  // ===== Загрузка сессии и данных =====
  const loadWorkspace = async () => {
    const [docs, cats, tpls] = await Promise.all([api.getDocuments(), api.getCategories(), api.getTemplates()])
    setDocuments(docs)
    setCategories(cats)
    setTemplates(tpls.templates.length ? tpls.templates : initialTemplates)
    setActiveTemplateId(tpls.activeTemplateId)
    // ready включаем на следующий тик, чтобы автосейв не сработал на только что загруженных данных
    window.setTimeout(() => { readyRef.current = true }, 0)
  }

  useEffect(() => {
    LEGACY_KEYS.forEach((k) => { try { window.localStorage.removeItem(k) } catch { /* ignore */ } })
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
  }, [])

  // ===== Автосохранение коллекций (дебаунс) =====
  const scheduleSave = (kind, fn) => {
    if (!readyRef.current) return
    window.clearTimeout(saveTimers.current[kind])
    saveTimers.current[kind] = window.setTimeout(() => {
      fn().catch((e) => showToast(e.message))
    }, 500)
  }
  useEffect(() => { scheduleSave('documents', () => api.putDocuments(documents)) }, [documents])
  useEffect(() => { scheduleSave('categories', () => api.putCategories(categories)) }, [categories])
  useEffect(() => { scheduleSave('templates', () => api.putTemplates(templates, activeTemplateId)) }, [templates, activeTemplateId])

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
    await api.logout()
    readyRef.current = false
    setCurrentUser(null)
    setUsers([])
    setDocuments([])
    setCategories([])
    setTemplates(initialTemplates)
    setActiveTemplateId(null)
    setSelectedDocId(null)
    setSelectedCategoryId(null)
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
    await api.setUserRole(id, nextRole)
    await loadUsers()
  }
  const removeUser = async (id) => {
    await api.removeUser(id)
    if (id === currentUser?.id) logout()
    else await loadUsers()
  }

  // ===== Документы =====
  const resolveLine = (docId, lineId, price) => {
    const at = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    const by = currentUser?.name ?? ''
    setDocuments((docs) => docs.map((d) => {
      if (d.id !== docId) return d
      const lines = d.lines.map((l) => {
        if (l.id !== lineId) return l
        const sum = Math.round((l.qtyValue ?? 1) * price)
        return { ...l, price, sum, resolvedBy: by, resolvedAt: at }
      })
      return { ...d, lines }
    }))
  }

  const shipDoc = (docId) => {
    setDocuments((docs) => docs.map((d) => (d.id === docId ? { ...d, status: 'shipped' } : d)))
    showToast('Документ отгружён в учёт')
  }

  const shipReady = () => {
    let n = 0
    setDocuments((docs) => docs.map((d) => {
      if (docStatus(d) === 'ready') { n += 1; return { ...d, status: 'shipped' } }
      return d
    }))
    showToast('Готовые документы отгружены в учёт')
    return n
  }

  const openDocInQueue = (docId) => {
    setScreen('queue')
    if (docId) setSelectedDocId(docId)
  }

  const accountOfCategory = (name) => categories.find((c) => c.name === name)?.account ?? ''

  const addDocument = ({ type = 'накладная', title, counterparty, date, lines }) => {
    const at = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    const id = newId('doc')
    const cleanLines = lines.map((l, i) => ({
      id: `l${i}`,
      name: l.name,
      qty: l.qty ?? '',
      qtyValue: l.qtyValue ?? null,
      price: l.price ?? null,
      sum: l.sum ?? (l.qtyValue != null && l.price != null ? Math.round(l.qtyValue * l.price) : null),
      category: l.category ?? '',
      account: l.account || accountOfCategory(l.category ?? ''),
    }))
    const doc = {
      id, type,
      title: title?.trim() || DOC_TYPE_LABEL[type] || 'Документ',
      counterparty: counterparty ?? '',
      subtitle: counterparty ?? '',
      panelSubtitle: `${counterparty ?? ''} · ${date ?? ''} · добавил ${currentUser?.name ?? ''}`,
      date: date ?? '',
      uploadedBy: currentUser?.name ?? '',
      uploadedAt: at,
      status: 'ready',
      photoLabel: 'документ добавлен вручную',
      lines: cleanLines,
    }
    setDocuments((docs) => [doc, ...docs])
    setSelectedDocId(id)
    showToast('Документ добавлен в очередь')
    return id
  }

  const addDocuments = (docs) => {
    if (!docs.length) return 0
    const withAccount = docs.map((d) => ({
      ...d,
      lines: d.lines.map((l) => ({ ...l, account: l.account || accountOfCategory(l.category) })),
    }))
    setDocuments((prev) => [...withAccount, ...prev])
    setSelectedDocId(withAccount[0].id)
    return withAccount.length
  }

  // ===== Категории =====
  const addKeyword = (categoryId, word) => {
    setCategories((cats) => cats.map((c) => (
      c.id === categoryId && word && !c.keywords.includes(word)
        ? { ...c, keywords: [...c.keywords, word] }
        : c
    )))
  }

  const setThreshold = (categoryId, threshold) => {
    setCategories((cats) => cats.map((c) => (c.id === categoryId ? { ...c, threshold } : c)))
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
    showToast(`Категория «${cat.name}» создана`)
  }

  // ===== Шаблоны =====
  const activeTemplate = templates.find((t) => t.id === activeTemplateId)
    ?? templates.find((t) => t.isDefault) ?? templates[0]

  const addTemplate = (name) => {
    const tpl = {
      id: newId('tpl'),
      name: (name ?? '').trim() || 'Новый шаблон',
      isDefault: false,
      columns: activeTemplate?.columns?.map((c) => ({ ...c })) ?? [],
    }
    setTemplates((ts) => [...ts, tpl])
    return tpl.id
  }
  const renameTemplate = (id, name) => {
    const trimmed = (name ?? '').trim()
    if (!trimmed) return
    setTemplates((ts) => ts.map((t) => (t.id === id ? { ...t, name: trimmed } : t)))
  }
  const updateTemplateColumns = (id, columns) => {
    if (!columns.length) return
    setTemplates((ts) => ts.map((t) => (t.id === id ? { ...t, columns } : t)))
  }
  const removeTemplate = (id) => {
    setTemplates((ts) => (ts.length <= 1 ? ts : ts.filter((t) => t.id !== id)))
    if (id === activeTemplateId) setActiveTemplateId(null)
  }
  const setActiveTemplate = (id) => setActiveTemplateId(id)

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
    addDocument, addDocuments,
    addKeyword, setThreshold, createSuggestedCategory,
    toast, showToast,
  }), [loading, screen, documents, selectedDocId, categories, selectedCategoryId,
    templates, activeTemplateId, suggestion, currentUser, users, toast])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => useContext(AppContext)
