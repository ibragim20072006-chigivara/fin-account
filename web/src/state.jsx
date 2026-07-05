import { createContext, useContext, useMemo, useState } from 'react'
import {
  initialDocuments, initialCategories, initialTemplates,
  initialNotifications, aiSuggestion,
} from './data.js'

const AppContext = createContext(null)

export const STATUS = {
  processing: { label: 'в обработке…', tone: 'neutral' },
  review: { label: 'проверить', tone: 'warning' },
  ready: { label: 'готово', tone: 'success' },
  shipped: { label: 'отгружено', tone: 'muted' },
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

export function AppProvider({ children }) {
  const [screen, setScreen] = useState('queue')
  const [documents, setDocuments] = useState(initialDocuments)
  const [selectedDocId, setSelectedDocId] = useState('d214')
  const [categories, setCategories] = useState(initialCategories)
  const [selectedCategoryId, setSelectedCategoryId] = useState('fuel')
  const [templates] = useState(initialTemplates)
  const [suggestion, setSuggestion] = useState(aiSuggestion)
  const [notifications, setNotifications] = useState(initialNotifications)
  const [exportMode, setExportMode] = useState('instant')
  const [toast, setToast] = useState(null)

  const showToast = (text) => {
    setToast(text)
    window.clearTimeout(showToast._t)
    showToast._t = window.setTimeout(() => setToast(null), 3200)
  }

  const resolveLine = (docId, lineId, price, by = 'Мария') => {
    const at = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
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
    showToast('Документ отгружен в учёт — шаблон_учёт.xlsx отправлен')
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
      keywords: ['аренда', 'экскаватор', 'бульдозер', 'автокран'],
      threshold: 90,
      matches: suggestion.lines.map((l) => ({ text: l.text, doc: l.doc, pct: 93 })),
    }
    setCategories((cats) => [...cats, cat])
    setSelectedCategoryId(cat.id)
    setSuggestion(null)
    showToast(`Категория «${cat.name}» создана`)
  }

  const toggleNotification = (id) => {
    setNotifications((ns) => ns.map((n) => (n.id === id ? { ...n, on: !n.on } : n)))
  }

  const value = useMemo(() => ({
    screen, setScreen,
    documents, selectedDocId, setSelectedDocId,
    categories, selectedCategoryId, setSelectedCategoryId,
    templates, suggestion, setSuggestion,
    notifications, toggleNotification,
    exportMode, setExportMode,
    resolveLine, shipDoc, shipReady, openDocInQueue,
    addKeyword, setThreshold, createSuggestedCategory,
    toast, showToast,
  }), [screen, documents, selectedDocId, categories, selectedCategoryId,
    templates, suggestion, notifications, exportMode, toast])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => useContext(AppContext)
