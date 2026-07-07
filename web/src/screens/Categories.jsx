import { useState } from 'react'
import { X } from 'lucide-react'
import { useApp } from '../state.jsx'
import { Segment } from '../components/ui.jsx'
import { money, rub } from '../format.js'
import CategoryForm from './CategoryForm.jsx'

function AiBanner() {
  const { suggestion, setSuggestion, createSuggestedCategory, canEdit } = useApp()
  const [showLines, setShowLines] = useState(false)
  if (!suggestion || !canEdit) return null
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
  const { addKeyword, setThreshold, removeCategory, showToast, canEdit } = useApp()
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
        <span className="chip neutral">{cat.kind === 'income' ? 'приход' : 'расход'}</span>
        {canEdit && (
          <button className="cat-del" title="Удалить категорию" onClick={() => removeCategory(cat.id)}>
            <X size={14} strokeWidth={2} />
          </button>
        )}
        <div className="spacer" />
        {canEdit && <button className="btn-ghost sm" onClick={() => showToast('Переименование доступно владельцу категории')}>переименовать</button>}
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
          {cat.keywords.length === 0 && !canEdit && <span className="threshold-note">ключевых слов пока нет</span>}
          {cat.keywords.map((k) => <span key={k} className="keyword">{k}</span>)}
          {canEdit && (adding ? (
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
          ))}
        </div>
      </div>

      <div className="field">
        <div className="section-label">ПОРОГ УВЕРЕННОСТИ</div>
        <div className="threshold-row" style={{ marginTop: 4 }}>
          {canEdit ? (
            <Segment
              small
              items={[80, 90, 95].map((v) => ({ value: v, label: `${v}%` }))}
              value={cat.threshold}
              onChange={(v) => setThreshold(cat.id, v)}
            />
          ) : (
            <span className="field-value">{cat.threshold}%</span>
          )}
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
  const { categories, selectedCategoryId, setSelectedCategoryId, canEdit } = useApp()
  const [creating, setCreating] = useState(false)
  const selected = categories.find((c) => c.id === selectedCategoryId) ?? categories[0]
  const income = categories.filter((c) => c.kind === 'income')
  const expense = categories.filter((c) => c.kind === 'expense')

  const row = (c) => (
    <button
      key={c.id}
      className={`cat-row${c.id === selected?.id ? ' selected' : ''}`}
      onClick={() => setSelectedCategoryId(c.id)}
    >
      <div className="cat-row-name">{c.name}</div>
      <div className="cat-row-meta">{c.account} · {c.linesMonth ?? 0} стр.</div>
    </button>
  )

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-title">Категории</div>
        <div className="page-count">{categories.length} категорий</div>
        <div className="spacer" />
        {canEdit && !creating && <button className="btn-outline-blue" onClick={() => setCreating(true)}>+ категория</button>}
      </div>

      {creating && (
        <div className="card" style={{ padding: 14 }}>
          <CategoryForm
            onDone={(id) => { setCreating(false); if (id) setSelectedCategoryId(id) }}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      <AiBanner />

      {categories.length === 0 ? (
        <div className="page-empty card">
          Пока нет категорий{canEdit ? ' — добавьте первую кнопкой «+ категория»' : ''}
        </div>
      ) : (
        <div className="split">
          <div className="side-list card">
            {income.length > 0 && <div className="cat-group-label">ПРИХОД</div>}
            {income.map(row)}
            {expense.length > 0 && <div className="cat-group-label">РАСХОД</div>}
            {expense.map(row)}
          </div>
          {selected && <CategoryDetail cat={selected} />}
        </div>
      )}
    </div>
  )
}
