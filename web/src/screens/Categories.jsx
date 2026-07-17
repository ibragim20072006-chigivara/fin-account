import { useState } from 'react'
import { useApp } from '../state.jsx'
import { Segment } from '../components/ui.jsx'
import CategoryForm from './CategoryForm.jsx'

// Категории, предложенные ИИ при распознавании фото. Создать одной кнопкой (тип подставлен, можно сменить).
function AiBanner() {
  const { suggestions, createSuggestion, dismissSuggestion, canEdit } = useApp()
  if (!canEdit || !suggestions.length) return null
  return (
    <>
      {suggestions.map((s) => (
        <div className="ai-banner" key={s.name}>
          <div className="ai-banner-text">
            <b>ИИ предлагает категорию «{s.name}»</b> — определил как «{s.kind === 'income' ? 'приход' : 'расход'}»
          </div>
          <div className="spacer" />
          <button className="btn-primary sm" onClick={() => createSuggestion(s)}>создать</button>
          <button className="team-link" style={{ fontSize: '12.5px' }} onClick={() => dismissSuggestion(s)}>скрыть</button>
        </div>
      ))}
    </>
  )
}

function CategoryDetail({ cat }) {
  const { addKeyword, removeKeyword, renameCategory, removeCategory, setThreshold, canEdit } = useApp()
  const [adding, setAdding] = useState(false)
  const [word, setWord] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const commit = () => {
    const w = word.trim()
    if (w) addKeyword(cat.id, w)
    setWord('')
    setAdding(false)
  }

  const startRename = () => { setNameDraft(cat.name); setRenaming(true) }
  const commitRename = () => { renameCategory(cat.id, nameDraft); setRenaming(false) }

  return (
    <div className="detail card">
      <div className="detail-head">
        {renaming ? (
          <input
            className="keyword-input"
            style={{ fontSize: 15, width: 220 }}
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenaming(false) }}
          />
        ) : (
          <div className="detail-title">{cat.name}</div>
        )}
        <span className="chip neutral">{cat.kind === 'income' ? 'приход' : 'расход'}</span>
        <div className="spacer" />
        {canEdit && !renaming && (
          <>
            <button className="btn-ghost sm" onClick={startRename}>переименовать</button>
            <button className="cat-delete" onClick={() => setConfirmingDelete(true)}>удалить</button>
          </>
        )}
      </div>

      <div className="field">
        <div className="section-label">КЛЮЧЕВЫЕ СЛОВА ДЛЯ ИИ</div>
        <div className="keyword-chips" style={{ marginTop: 4 }}>
          {cat.keywords.length === 0 && !canEdit && <span className="threshold-note">ключевых слов пока нет</span>}
          {cat.keywords.map((k) => (
            <span key={k} className="keyword">
              {k}
              {canEdit && <button className="keyword-del" title="Удалить" onClick={() => removeKeyword(cat.id, k)}>✕</button>}
            </span>
          ))}
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

      {confirmingDelete && (
        <div className="overlay" onClick={() => setConfirmingDelete(false)}>
          <div className="modal confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">Удалить категорию «{cat.name}»?</div>
              <div className="spacer" />
              <button className="modal-close" onClick={() => setConfirmingDelete(false)}>✕</button>
            </div>
            <div className="confirm-note">
              Строки в уже отгруженных документах потеряют эту категорию в отчётах. Действие необратимо.
            </div>
            <div className="modal-foot">
              <div className="spacer" />
              <button className="btn-ghost sm" onClick={() => setConfirmingDelete(false)}>Отмена</button>
              <button className="btn-danger sm" onClick={() => { removeCategory(cat.id); setConfirmingDelete(false) }}>Удалить</button>
            </div>
          </div>
        </div>
      )}
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
