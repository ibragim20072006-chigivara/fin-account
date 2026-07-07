import { useState } from 'react'
import { useApp, DOC_TYPES, DOC_TYPE_LABEL } from '../state.jsx'
import { parseNumber } from '../import.js'
import { money } from '../format.js'
import CategoryForm from './CategoryForm.jsx'

const emptyLine = () => ({ name: '', qty: '', price: '', categoryId: '' })

export default function NewDocument({ onClose }) {
  const { addDocument, categories } = useApp()
  const [type, setType] = useState('накладная')
  const [title, setTitle] = useState('')
  const [counterparty, setCounterparty] = useState('')
  const [date, setDate] = useState(() => new Date().toLocaleDateString('ru-RU'))
  const [lines, setLines] = useState([emptyLine()])
  const [showCatForm, setShowCatForm] = useState(false)

  const income = categories.filter((c) => c.kind === 'income')
  const expense = categories.filter((c) => c.kind === 'expense')

  const setLine = (i, patch) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)))
  const addLine = () => setLines((ls) => [...ls, emptyLine()])
  const removeLine = (i) => setLines((ls) => (ls.length > 1 ? ls.filter((_, j) => j !== i) : ls))

  const rows = lines.map((l) => {
    const qtyValue = parseNumber(l.qty)
    const price = parseNumber(l.price)
    const sum = qtyValue != null && price != null ? Math.round(qtyValue * price) : null
    return { ...l, qtyValue, price, sum }
  })
  const total = rows.reduce((s, r) => s + (r.sum ?? 0), 0)
  const valid = counterparty.trim() && rows.some((r) => r.name.trim())

  const submit = () => {
    if (!valid) return
    const payload = rows
      .filter((r) => r.name.trim())
      .map((r) => ({
        name: r.name.trim(),
        qty: qtyLabel(r.qty),
        qtyValue: r.qtyValue,
        price: r.price,
        sum: r.sum,
        categoryId: r.categoryId || null,
      }))
    addDocument({ type, title, counterparty, date, lines: payload })
    onClose()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal nd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">Новый документ</div>
          <div className="spacer" />
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body nd-body">
          <div className="nd-fields">
            <label className="nd-field">
              <div className="section-label">ТИП</div>
              <select className="role-select nd-select" value={type} onChange={(e) => setType(e.target.value)}>
                {DOC_TYPES.map((t) => <option key={t} value={t}>{DOC_TYPE_LABEL[t]}</option>)}
              </select>
            </label>
            <label className="nd-field grow">
              <div className="section-label">НАЗВАНИЕ / НОМЕР</div>
              <input className="nd-input" value={title} placeholder={DOC_TYPE_LABEL[type]} onChange={(e) => setTitle(e.target.value)} />
            </label>
          </div>
          <div className="nd-fields">
            <label className="nd-field grow">
              <div className="section-label">КОНТРАГЕНТ</div>
              <input className="nd-input" value={counterparty} placeholder="Кто выставил документ" onChange={(e) => setCounterparty(e.target.value)} />
            </label>
            <label className="nd-field">
              <div className="section-label">ДАТА</div>
              <input className="nd-input" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
          </div>

          <div className="section-label" style={{ marginTop: 6 }}>ПОЗИЦИИ</div>
          <div className="nd-lines">
            <div className="nd-line nd-line-head">
              <div>Название</div>
              <div>Кол-во</div>
              <div>Цена</div>
              <div>Категория</div>
              <div className="nd-sum-h">Сумма</div>
              <div />
            </div>
            {rows.map((r, i) => (
              <div className="nd-line" key={i}>
                <input className="nd-input" value={r.name} placeholder="Позиция" onChange={(e) => setLine(i, { name: e.target.value })} />
                <input className="nd-input" value={r.qty} placeholder="1" onChange={(e) => setLine(i, { qty: e.target.value })} />
                <input className="nd-input" value={r.price} placeholder="0" inputMode="numeric" onChange={(e) => setLine(i, { price: e.target.value })} />
                <select className="role-select nd-select" value={r.categoryId} onChange={(e) => setLine(i, { categoryId: e.target.value })}>
                  <option value="">— категория —</option>
                  {income.length > 0 && (
                    <optgroup label="Приход">
                      {income.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </optgroup>
                  )}
                  {expense.length > 0 && (
                    <optgroup label="Расход">
                      {expense.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </optgroup>
                  )}
                </select>
                <div className="nd-sum mono">{r.sum != null ? money(r.sum) : '—'}</div>
                <button className="nd-remove" onClick={() => removeLine(i)} title="Удалить" disabled={lines.length === 1}>✕</button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="keyword-add nd-addline" onClick={addLine}>+ позиция</button>
            {!showCatForm && <button className="keyword-add" onClick={() => setShowCatForm(true)}>＋ категория</button>}
          </div>
          {showCatForm && (
            <CategoryForm onDone={() => setShowCatForm(false)} onCancel={() => setShowCatForm(false)} />
          )}
        </div>

        <div className="modal-foot">
          <div className="total mono">итого: {money(total)} ₽</div>
          <div className="spacer" />
          <button className="btn-ghost sm" onClick={onClose}>Отмена</button>
          <button className="btn-primary sm" onClick={submit} disabled={!valid}>Добавить в очередь</button>
        </div>
      </div>
    </div>
  )
}

// Кол-во показываем как ввёл пользователь; пустое → "1".
function qtyLabel(raw) {
  const s = String(raw ?? '').trim()
  return s || '1'
}
