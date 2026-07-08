import { useState } from 'react'
import { useApp } from '../state.jsx'
import { EXPORT_COLUMNS } from '../data.js'

const SAMPLE = {
  date: '14.06.2026', counterparty: 'СтройБаза Юг', category: 'Щебень 5–20',
  qty: '26,4', price: '850', sum: '22 440',
}

function ColumnEditor({ columns, onChange }) {
  const setCol = (i, patch) => onChange(columns.map((c, j) => (j === i ? { ...c, ...patch } : c)))
  const move = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= columns.length) return
    const next = [...columns]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  const remove = (i) => { if (columns.length > 1) onChange(columns.filter((_, j) => j !== i)) }
  const used = new Set(columns.map((c) => c.key))
  const freeField = EXPORT_COLUMNS.find((f) => !used.has(f.key))
  const add = () => {
    if (!freeField) return
    onChange([...columns, { key: freeField.key, label: freeField.label }])
  }

  return (
    <div className="col-editor">
      <div className="section-label">КОЛОНКИ ФАЙЛА</div>
      <div className="ce-row ce-head">
        <div>Поле (данные)</div>
        <div>Заголовок в файле</div>
        <div />
      </div>
      {columns.map((c, i) => (
        <div className="ce-row" key={i}>
          <select className="role-select ce-field" value={c.key} onChange={(e) => setCol(i, { key: e.target.value })}>
            {EXPORT_COLUMNS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
          <input className="nd-input" value={c.label} onChange={(e) => setCol(i, { label: e.target.value })} />
          <div className="ce-actions">
            <button className="ce-btn" onClick={() => move(i, -1)} disabled={i === 0} title="Выше">↑</button>
            <button className="ce-btn" onClick={() => move(i, 1)} disabled={i === columns.length - 1} title="Ниже">↓</button>
            <button className="ce-btn ce-remove" onClick={() => remove(i)} disabled={columns.length <= 1} title="Удалить">✕</button>
          </div>
        </div>
      ))}
      <button className="keyword-add" onClick={add} disabled={!freeField}>+ колонка</button>
    </div>
  )
}

function ReadonlyMapping({ columns }) {
  return (
    <div className="map-table">
      <div className="map-row head">
        <div>КОЛОНКА ФАЙЛА</div>
        <div>ОТКУДА БЕРЁТСЯ</div>
      </div>
      {columns.map((c, i) => {
        const field = EXPORT_COLUMNS.find((f) => f.key === c.key)
        return (
          <div className="map-row" key={i}>
            <div className="map-col">{String.fromCharCode(65 + i)} · {c.label}</div>
            <div className="map-src">{field?.source ?? '—'}</div>
          </div>
        )
      })}
    </div>
  )
}

function Preview({ columns }) {
  const header = columns.map((c) => c.label).join(';')
  const row = columns.map((c) => SAMPLE[c.key] ?? '').join(';')
  return (
    <div className="field">
      <div className="section-label">ПРЕВЬЮ ФАЙЛА</div>
      <div className="example-box" style={{ whiteSpace: 'pre', overflowX: 'auto', textOverflow: 'clip', marginTop: 8 }}>
        {header + '\n' + row}
      </div>
    </div>
  )
}

export default function Templates() {
  const {
    templates, activeTemplate, canEdit,
    addTemplate, renameTemplate, updateTemplateColumns, removeTemplate, setActiveTemplate,
  } = useApp()
  const [selectedId, setSelectedId] = useState(activeTemplate?.id ?? templates[0]?.id)
  const [renaming, setRenaming] = useState(false)
  const [nameDraft, setNameDraft] = useState('')

  const tpl = templates.find((t) => t.id === selectedId) ?? activeTemplate ?? templates[0]
  const isActive = tpl.id === activeTemplate.id

  const startRename = () => { setNameDraft(tpl.name); setRenaming(true) }
  const commitRename = () => { renameTemplate(tpl.id, nameDraft); setRenaming(false) }

  const create = () => { setSelectedId(addTemplate('Новый шаблон')); setRenaming(false) }
  const del = () => {
    const rest = templates.filter((t) => t.id !== tpl.id)
    removeTemplate(tpl.id)
    setSelectedId(rest[0]?.id)
  }

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-title">Шаблоны выгрузки</div>
        <div className="page-sub">формат, в котором отгрузки скачиваются в учёт</div>
        <div className="spacer" />
        {canEdit && <button className="btn-outline-blue" onClick={create}>+ шаблон</button>}
      </div>

      <div className="split">
        <div className="side-list card">
          {templates.map((t) => (
            <button
              key={t.id}
              className={`tpl-row${t.id === selectedId ? ' selected' : ''}`}
              onClick={() => { setSelectedId(t.id); setRenaming(false) }}
            >
              <div className="tpl-row-top">
                <div className="tpl-row-name">{t.name}</div>
                {t.id === activeTemplate.id && <span className="chip success green-sm">основной</span>}
              </div>
              <div className="tpl-row-meta">{t.columns.length} колонок</div>
            </button>
          ))}
        </div>

        <div className="detail card">
          <div className="detail-head">
            {renaming ? (
              <input
                className="nd-input"
                style={{ maxWidth: 240 }}
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenaming(false) }}
              />
            ) : (
              <div className="detail-title">{tpl.name}</div>
            )}
            {isActive && <span className="chip success green-sm">основной</span>}
            <div className="spacer" />
            {canEdit && !renaming && <button className="btn-ghost sm" onClick={startRename}>переименовать</button>}
            {canEdit && !isActive && <button className="btn-ghost sm" onClick={() => setActiveTemplate(tpl.id)}>сделать основным</button>}
            {canEdit && templates.length > 1 && <button className="btn-ghost sm" onClick={del}>удалить</button>}
          </div>

          {canEdit
            ? <ColumnEditor columns={tpl.columns} onChange={(cols) => updateTemplateColumns(tpl.id, cols)} />
            : <ReadonlyMapping columns={tpl.columns} />}

          <Preview columns={tpl.columns} />

          <div className="detail-foot">
            {isActive
              ? 'по этому шаблону отгрузки скачиваются и импортируются (CSV)'
              : 'чтобы использовать этот формат — нажмите «сделать основным»'}
          </div>
        </div>
      </div>
    </div>
  )
}
