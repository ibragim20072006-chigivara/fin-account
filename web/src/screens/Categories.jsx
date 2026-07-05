import { useState } from 'react'
import { useApp } from '../state.jsx'
import { Segment } from '../components/ui.jsx'
import { money, rub } from '../format.js'

function AiBanner() {
  const { suggestion, setSuggestion, createSuggestedCategory } = useApp()
  const [showLines, setShowLines] = useState(false)
  if (!suggestion) return null
  return (
    <div className="ai-banner">
      <div className="ai-banner-text">
        <b>ИИ предлагает категорию «{suggestion.name}»</b> — {suggestion.reason}
      </div>
      <div className="spacer" />
      <button className="btn-primary sm" onClick={createSuggestedCategory}>создать</button>
      <button className="link" style={{ fontSize: '12.5px' }} onClick={() => setShowLines((v) => !v)}>
        {showLines ? 'скрыть строки' : 'показать строки'}
      </button>
      <button className="team-link" style={{ fontSize: '12.5px' }} onClick={() => setSuggestion(null)}>скрыть</button>
      {showLines && (
        <div className="ai-banner-lines">
          {suggestion.lines.map((l, i) => (
            <div key={i} className="ai-banner-line">
              <span>{l.text}</span>
              <span className="mono">{l.doc}</span>
              <span className="spacer" />
              <span className="mono">{money(l.sum)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CategoryDetail({ cat }) {
  const { addKeyword, setThreshold, showToast } = useApp()
  const [adding, setAdding] = useState(false)
  const [word, setWord] = useState('')

  const commit = () => {
    const w = word.trim()
    if (w) addKeyword(cat.id, w)
    setWord('')
    setAdding(false)
  }

  return (
    <div className="detail card">
      <div className="detail-head">
        <div className="detail-title">{cat.name}</div>
        <span className="chip neutral">{cat.kind === 'income' ? 'доход' : 'расход'}</span>
        <div className="spacer" />
        <button className="btn-ghost sm" onClick={() => showToast('Переименование доступно владельцу категории')}>переименовать</button>
      </div>

      <div className="field-row">
        <div className="field">
          <div className="section-label">СЧЁТ УЧЁТА</div>
          <div className="field-value">{cat.account}</div>
        </div>
        <div className="field">
          <div className="section-label">ЗА ИЮНЬ</div>
          <div className="field-value">{cat.linesMonth} строк · {rub(cat.sumMonth)}</div>
        </div>
      </div>

      <div className="field">
        <div className="section-label">КЛЮЧЕВЫЕ СЛОВА ДЛЯ ИИ</div>
        <div className="keyword-chips" style={{ marginTop: 4 }}>
          {cat.keywords.map((k) => <span key={k} className="keyword">{k}</span>)}
          {adding ? (
            <input
              className="keyword-input"
              autoFocus
              value={word}
              placeholder="новое слово"
              onChange={(e) => setWord(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setAdding(false) }}
            />
          ) : (
            <button className="keyword-add" onClick={() => setAdding(true)}>+ слово</button>
          )}
        </div>
      </div>

      <div className="field">
        <div className="section-label">ПОРОГ УВЕРЕННОСТИ</div>
        <div className="threshold-row" style={{ marginTop: 4 }}>
          <Segment
            small
            items={[80, 90, 95].map((v) => ({ value: v, label: `${v}%` }))}
            value={cat.threshold}
            onChange={(v) => setThreshold(cat.id, v)}
          />
          <div className="threshold-note">ниже порога — строка уходит на проверку</div>
        </div>
      </div>

      <div className="field" style={{ flex: 1 }}>
        <div className="section-label">ПОСЛЕДНИЕ СОПОСТАВЛЕНИЯ</div>
        <div>
          {cat.matches.map((m, i) => (
            <div key={i} className="match-row">
              <div className="match-text">{m.text}</div>
              {m.review
                ? <span className="match-chip">на проверку</span>
                : <div className="match-doc">{m.doc}</div>}
              <div className={`match-pct${m.review ? ' warn' : ' good'}`}>{m.pct}%</div>
            </div>
          ))}
        </div>
      </div>

      <div className="detail-foot">правила применяются к новым документам сразу, старые не трогают</div>
    </div>
  )
}

export default function Categories() {
  const { categories, selectedCategoryId, setSelectedCategoryId, showToast } = useApp()
  const selected = categories.find((c) => c.id === selectedCategoryId) ?? categories[0]
  const income = categories.filter((c) => c.kind === 'income')
  const expense = categories.filter((c) => c.kind === 'expense')

  const row = (c) => (
    <button
      key={c.id}
      className={`cat-row${c.id === selected.id ? ' selected' : ''}`}
      onClick={() => setSelectedCategoryId(c.id)}
    >
      <div className="cat-row-name">{c.name}</div>
      <div className="cat-row-meta">{c.account} · {c.linesMonth} стр.</div>
    </button>
  )

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-title">Категории</div>
        <div className="page-count">{categories.length} категорий</div>
        <div className="spacer" />
        <button className="btn-outline-blue" onClick={() => showToast('Заполните название и счёт новой категории')}>+ категория</button>
      </div>

      <AiBanner />

      <div className="split">
        <div className="side-list card">
          <div className="cat-group-label">ВЫРУЧКА</div>
          {income.map(row)}
          <div className="cat-group-label">РАСХОДЫ</div>
          {expense.map(row)}
        </div>
        <CategoryDetail cat={selected} />
      </div>
    </div>
  )
}
