import { useMemo, useRef, useState } from 'react'
import { Pencil, X } from 'lucide-react'
import { useApp, docStatus, docTotal } from '../state.jsx'
import { StatusChip, DocCard, plural } from '../components/ui.jsx'
import { parseCsv, rowsToDocuments, parseNumber } from '../import.js'
import { fileToDataUrl } from '../image.js'
import NewDocument from './NewDocument.jsx'
import { money } from '../format.js'

export function QueueList({ mobile = false }) {
  const { documents, selectedDocId, setSelectedDocId, shipReady, showToast, canEdit, addDocuments, recognizeAndAdd, currentUser, categories } = useApp()
  const [filter, setFilter] = useState('all')
  const [showNew, setShowNew] = useState(false)
  const [recognizing, setRecognizing] = useState(false)
  const fileRef = useRef(null)
  const galleryRef = useRef(null)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const text = await file.text()
    const docs = rowsToDocuments(parseCsv(text), currentUser?.name ?? '', categories)
    const n = addDocuments(docs)
    showToast(n ? `Импортировано документов: ${n}` : 'В файле не распознаны строки (ожидается CSV выгрузки)')
  }

  const handleGallery = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setRecognizing(true)
    try {
      await recognizeAndAdd(await fileToDataUrl(file))
    } catch (err) {
      showToast(err.message || 'Не удалось распознать документ')
    } finally {
      setRecognizing(false)
    }
  }

  const addControls = canEdit && (
    <>
      <button className={mobile ? 'mq-add' : 'queue-add'} onClick={() => galleryRef.current?.click()} disabled={recognizing}>
        {recognizing ? 'распознаю…' : 'из галереи'}
      </button>
      <button className={mobile ? 'mq-add' : 'queue-add'} onClick={() => setShowNew(true)}>+ документ</button>
      <button className={mobile ? 'mq-add' : 'queue-add'} onClick={() => fileRef.current?.click()}>из файла</button>
      <input ref={galleryRef} type="file" accept="image/*" hidden onChange={handleGallery} />
      <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={handleFile} />
    </>
  )

  const modal = showNew && <NewDocument onClose={() => setShowNew(false)} />

  const counts = useMemo(() => {
    const c = { review: 0, ready: 0 }
    for (const d of documents) {
      const s = docStatus(d)
      if (s === 'review') c.review += 1
      if (s === 'ready') c.ready += 1
    }
    return c
  }, [documents])

  const visible = documents.filter((d) => filter === 'all' || docStatus(d) === filter)

  const filters = (
    <>
      <button className={`pill${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>Все</button>
      <button className={`pill${filter === 'review' ? ' active' : ''}`} onClick={() => setFilter('review')}>
        Проверить · {counts.review}
      </button>
      <button className={`pill${filter === 'ready' ? ' active' : ''}`} onClick={() => setFilter('ready')}>
        Готово · {counts.ready}
      </button>
    </>
  )

  const cards = visible.length
    ? visible.map((d) => (
      <DocCard
        key={d.id}
        doc={d}
        status={docStatus(d)}
        selected={!mobile && d.id === selectedDocId}
        onClick={() => setSelectedDocId(d.id)}
      />
    ))
    : (
      <div className="list-empty">
        {documents.length ? 'Нет документов в этом фильтре' : 'Пока нет документов'}
      </div>
    )

  const batch = canEdit && counts.ready > 0 && (
    <button className="btn-primary" onClick={shipReady}>
      Выгрузить готовые ({counts.ready}) →
    </button>
  )

  if (mobile) {
    return (
      <>
        <div className="mq-head">
          <div className="mq-title">Очередь</div>
          <div className="mq-count">{documents.length}</div>
          <div className="spacer" />
          <div className="mq-actions">{addControls}</div>
        </div>
        <div className="mq-filters">{filters}</div>
        <div className="mq-list">{cards}</div>
        {batch && <div className="mq-batch">{batch}</div>}
        {modal}
      </>
    )
  }

  return (
    <div className="queue-list">
      <div className="queue-list-head">
        <div className="queue-list-title">Входящие</div>
        <div className="queue-count">{documents.length}</div>
      </div>
      {addControls && <div className="queue-actions-row">{addControls}</div>}
      <div className="queue-filters">{filters}</div>
      <div className="queue-scroll">{cards}</div>
      {batch && <div className="queue-batch">{batch}</div>}
      {modal}
    </div>
  )
}

const SOURCE_LABEL = { photo: 'распознано с фото (ИИ)', import: 'импорт из файла', manual: 'добавлено вручную' }

function PhotoPane({ doc }) {
  const [zoom, setZoom] = useState(100)
  const srcLabel = SOURCE_LABEL[doc.source] ?? 'документ'

  const openOriginal = () => {
    const w = window.open('', '_blank')
    if (!w) return
    w.document.body.style.margin = '0'
    const img = w.document.createElement('img')
    img.src = doc.photo
    img.style.maxWidth = '100%'
    w.document.body.appendChild(img)
  }

  if (doc.photo) {
    return (
      <div className="photo-pane card">
        <div className="photo-src">{srcLabel}{doc.source === 'photo' ? ' · сверьте строки с фото' : ''}</div>
        <div className="photo-view">
          <div className="photo-inner" style={{ transform: `scale(${zoom / 100})` }}>
            <img className="photo-img" src={doc.photo} alt="документ" />
          </div>
        </div>
        <div className="photo-bar">
          <div className="zoom">
            <button onClick={() => setZoom((z) => Math.max(50, z - 25))}>−</button>
            <div className="zoom-val">{zoom}%</div>
            <button onClick={() => setZoom((z) => Math.min(300, z + 25))}>+</button>
          </div>
          <div className="spacer" />
          <button className="link" onClick={openOriginal}>открыть оригинал ⤢</button>
        </div>
      </div>
    )
  }

  return (
    <div className="photo-pane card info-pane">
      <div className="info-pane-title">О документе</div>
      <div className="info-row"><span>Источник</span><b>{srcLabel}</b></div>
      <div className="info-row"><span>Тип</span><b>{doc.type}</b></div>
      {doc.counterparty && <div className="info-row"><span>Контрагент</span><b>{doc.counterparty}</b></div>}
      <div className="info-row"><span>Дата</span><b>{doc.date || '—'}</b></div>
      <div className="info-row"><span>Добавил</span><b>{doc.uploadedBy || '—'}</b></div>
      {doc.source === 'photo' && <div className="info-hint">Распознано ИИ — проверьте позиции и категории.</div>}
    </div>
  )
}

function CategorySelect({ value, onChange }) {
  const { categories } = useApp()
  const income = categories.filter((c) => c.kind === 'income')
  const expense = categories.filter((c) => c.kind === 'expense')
  return (
    <select className="role-select" value={value} onChange={onChange}>
      <option value="">— категория —</option>
      {income.length > 0 && <optgroup label="Приход">{income.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>}
      {expense.length > 0 && <optgroup label="Расход">{expense.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>}
    </select>
  )
}

// Позиция документа: просмотр + встроенная правка и удаление (работают и для отгруженных).
function EditableLine({ doc, line, resolved, catName }) {
  const { updateLine, removeLine, canEdit } = useApp()
  const [d, setD] = useState(null)

  const start = () => setD({
    name: line.name ?? '', qty: line.qty ?? '',
    price: line.price != null ? String(line.price) : '', categoryId: line.categoryId ?? '',
  })
  const save = () => {
    updateLine(doc.id, line.id, { name: d.name.trim() || line.name, qty: d.qty, price: parseNumber(d.price), categoryId: d.categoryId })
    setD(null)
  }

  return (
    <>
      <div className={`lines-grid line-row${resolved ? ' line-resolved' : ''}`}>
        <div className="line-name">
          {line.name}
          {resolved && <span className="line-note"> исправлено · {line.resolvedBy} {line.resolvedAt}</span>}
        </div>
        <div className="line-num">{line.qty}</div>
        <div className="line-num">{money(line.price)}</div>
        <div className="line-num">{money(line.sum)}</div>
        <div className="line-cat">{catName && <span className="cat-chip">{catName}</span>}</div>
        <div className="line-actions">
          {canEdit && !d && <button className="line-act" title="Редактировать" onClick={start}><Pencil size={13} strokeWidth={2} /></button>}
          {canEdit && <button className="line-act" title="Удалить позицию" onClick={() => removeLine(doc.id, line.id)}><X size={14} strokeWidth={2} /></button>}
        </div>
      </div>
      {d && (
        <div className="line-editor">
          <input className="nd-input" style={{ width: 170 }} autoFocus value={d.name} placeholder="Название" onChange={(e) => setD({ ...d, name: e.target.value })} />
          <input className="nd-input" style={{ width: 72 }} value={d.qty} placeholder="кол-во" onChange={(e) => setD({ ...d, qty: e.target.value })} />
          <input className="nd-input" style={{ width: 84 }} value={d.price} placeholder="цена" inputMode="numeric" onChange={(e) => setD({ ...d, price: e.target.value })} />
          <CategorySelect value={d.categoryId} onChange={(e) => setD({ ...d, categoryId: e.target.value })} />
          <button className="btn-primary sm" onClick={save}>Сохранить</button>
          <button className="btn-ghost sm" onClick={() => setD(null)}>Отмена</button>
        </div>
      )}
    </>
  )
}

function FlaggedLine({ doc, line }) {
  const { resolveLine, removeLine, canEdit } = useApp()
  const [custom, setCustom] = useState('')

  const apply = (price) => {
    if (Number.isFinite(price) && price > 0) resolveLine(doc.id, line.id, price)
  }

  return (
    <div className="line-flagged">
      <div className="lines-grid line-row">
        <div className="line-name">{line.name}</div>
        <div className="line-num">{line.qty}</div>
        <div className="line-num empty">—</div>
        <div className="line-num empty">—</div>
        <div className="line-cat"><span className="chip-red">уточнить цену</span></div>
        <div className="line-actions">
          {canEdit && <button className="line-act" title="Удалить позицию" onClick={() => removeLine(doc.id, line.id)}><X size={14} strokeWidth={2} /></button>}
        </div>
      </div>
      <div className="line-helper">
        <div className="line-helper-text">Укажите цену позиции:</div>
        {canEdit && (
          <input
            className="price-input"
            placeholder="своя цена"
            inputMode="numeric"
            value={custom}
            onChange={(e) => setCustom(e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => { if (e.key === 'Enter') apply(Number(custom)) }}
          />
        )}
      </div>
    </div>
  )
}

function VerifyPanel({ doc }) {
  const { shipDoc, removeDocument, canEdit, categoryOfLine } = useApp()
  const status = docStatus(doc)
  const { total, unknown } = docTotal(doc)
  const flaggedCount = doc.lines.filter((l) => l.sum == null && !l.resolvedAt).length
  const flaggedIdx = doc.lines.findIndex((l) => l.sum == null && !l.resolvedAt) + 1

  return (
    <div className="verify">
      <div className="verify-head">
        <div>
          <div className="verify-title-row">
            <div className="verify-title">{doc.title}</div>
            {status === 'review' && (
              <StatusChip status="review" label={`${flaggedCount} ${plural(flaggedCount, 'строка', 'строки', 'строк')} под вопросом`} />
            )}
            {status === 'ready' && <StatusChip status="ready" label="готово к отгрузке" />}
            {status === 'shipped' && <StatusChip status="shipped" />}
          </div>
          <div className="verify-sub">{doc.panelSubtitle}</div>
        </div>
        <div className="verify-head-actions">
          {canEdit && (
            <button className="btn-ghost verify-del" onClick={() => removeDocument(doc.id)}>
              <X size={14} strokeWidth={2} /> удалить документ
            </button>
          )}
        </div>
      </div>

      <div className="verify-body">
        <PhotoPane doc={doc} />

        <div className="lines-pane card">
          <div className="lines-grid lines-head">
            <div>ПОЗИЦИЯ</div>
            <div className="num-r">КОЛ-ВО</div>
            <div className="num-r">ЦЕНА</div>
            <div className="num-r">СУММА</div>
            <div className="pl12">КАТЕГОРИЯ</div>
            <div />
          </div>
          <div className="lines-scroll">
            {doc.lines.map((l) =>
              l.sum == null && !l.resolvedAt
                ? <FlaggedLine key={l.id} doc={doc} line={l} />
                : <EditableLine key={l.id} doc={doc} line={l} resolved={!!l.resolvedAt} catName={categoryOfLine(l)?.name ?? ''} />,
            )}
          </div>
          <div className="lines-footer">
            <div className="lines-footer-meta">
              {doc.lines.length} {plural(doc.lines.length, 'строка', 'строки', 'строк')} · без НДС
            </div>
            <div className="spacer" />
            {unknown ? (
              <>
                <div className="total-block">
                  <div className="total unknown">итого: {money(total)} + ?</div>
                  <div className="total-note">зависит от строки {flaggedIdx}</div>
                </div>
                {canEdit && <button className="btn-primary" disabled>отгрузить в учёт</button>}
              </>
            ) : (
              <>
                <div className="total">итого: {money(total)} ₽</div>
                {status === 'shipped'
                  ? <span className="chip success">отгружено</span>
                  : canEdit && <button className="btn-primary" onClick={() => shipDoc(doc.id)}>отгрузить в учёт →</button>}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Queue() {
  const { documents, selectedDocId } = useApp()
  const doc = documents.find((d) => d.id === selectedDocId) ?? documents[0]
  return (
    <div className="screen">
      <QueueList />
      {doc ? (
        <VerifyPanel doc={doc} />
      ) : (
        <div className="verify-empty">
          <div className="verify-empty-inner">
            {documents.length ? 'Выберите документ из списка' : 'Очередь пуста — документы появятся после съёмки и распознавания'}
          </div>
        </div>
      )}
    </div>
  )
}
