import { createContext, useContext, useMemo, useState } from 'react'
import { initialDocuments, initialCategories, initialTemplates, aiSuggestion, ROLES } from './data.js'
import { loadUsers, saveUsers, loadSession, saveSession, newId } from './auth.js'

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

function docsForCategory(shipped, name) {
  const out = []
  for (const doc of shipped) {
    const sum = doc.lines.filter((l) => l.category === name && l.sum != null).reduce((s, l) => s + l.sum, 0)
    if (sum > 0) out.push({ date: doc.date ?? '', name: doc.title, who: doc.uploadedBy ?? '', sum, queueId: doc.id })
  }
  return out
}

// Отчёты агрегируются из отгруженных документов и категорий (kind: доход/расход).
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

export function AppProvider({ children }) {
  const [screen, setScreen] = useState('queue')
  const [documents, setDocuments] = useState(initialDocuments)
  const [selectedDocId, setSelectedDocId] = useState(null)
  const [categories, setCategories] = useState(initialCategories)
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [templates] = useState(initialTemplates)
  const [suggestion, setSuggestion] = useState(aiSuggestion)
  const [toast, setToast] = useState(null)

  const [users, setUsers] = useState(loadUsers)
  const [sessionUserId, setSessionUserId] = useState(loadSession)

  const currentUser = users.find((u) => u.id === sessionUserId) ?? null
  const role = currentUser ? ROLES[currentUser.role] ?? ROLES.viewer : null
  const canEdit = !!role?.canEdit
  const isAdmin = !!role?.isAdmin

  const persistUsers = (next) => { setUsers(next); saveUsers(next) }
  const persistSession = (id) => { setSessionUserId(id); saveSession(id) }

  const showToast = (text) => {
    setToast(text)
    window.clearTimeout(showToast._t)
    showToast._t = window.setTimeout(() => setToast(null), 3200)
  }

  const register = ({ name, role: chosen }) => {
    const trimmed = name.trim()
    if (!trimmed) return
    // Первый пользователь всегда администратор — чтобы было кому управлять доступом.
    const finalRole = users.length === 0 ? 'admin' : (ROLES[chosen] ? chosen : 'viewer')
    const user = { id: newId(), name: trimmed, role: finalRole }
    persistUsers([...users, user])
    persistSession(user.id)
  }

  const login = (userId) => persistSession(userId)
  const logout = () => persistSession(null)

  const addUser = ({ name, role: chosen }) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const user = { id: newId(), name: trimmed, role: ROLES[chosen] ? chosen : 'viewer' }
    persistUsers([...users, user])
    showToast(`Пользователь «${trimmed}» добавлен`)
  }

  const setUserRole = (userId, nextRole) => {
    persistUsers(users.map((u) => (u.id === userId ? { ...u, role: nextRole } : u)))
  }

  const removeUser = (userId) => {
    persistUsers(users.filter((u) => u.id !== userId))
    if (userId === sessionUserId) persistSession(null)
  }

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
    const id = 'doc' + Date.now().toString(36)
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
      id: 'rent', kind: 'expense', name: suggestion.name, account: '60.01',
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

  const value = useMemo(() => ({
    screen, setScreen,
    documents, selectedDocId, setSelectedDocId,
    categories, selectedCategoryId, setSelectedCategoryId,
    templates, suggestion, setSuggestion,
    users, currentUser, role, canEdit, isAdmin,
    register, login, logout, addUser, setUserRole, removeUser,
    resolveLine, shipDoc, shipReady, openDocInQueue,
    addDocument, addDocuments,
    addKeyword, setThreshold, createSuggestedCategory,
    toast, showToast,
  }), [screen, documents, selectedDocId, categories, selectedCategoryId,
    templates, suggestion, users, sessionUserId, toast])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => useContext(AppContext)
