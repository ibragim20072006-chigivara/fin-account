import { useMemo, useRef, useState } from 'react'
import { useApp, docStatus, docTotal } from '../state.jsx'
import { StatusChip, DocCard, plural } from '../components/ui.jsx'
import { parseCsv, rowsToDocuments } from '../import.js'
import NewDocument from './NewDocument.jsx'
import { money } from '../format.js'

export function QueueList({ mobile = false }) {
  const { documents, selectedDocId, setSelectedDocId, shipReady, showToast, canEdit, addDocuments, currentUser, activeTemplate } = useApp()
  const [filter, setFilter] = useState('all')
  const [showNew, setShowNew] = useState(false)
  const fileRef = useRef(null)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const text = await file.text()
    const docs = rowsToDocuments(parseCsv(text, activeTemplate), currentUser?.name ?? '')
    const n = addDocuments(docs)
    showToast(n ? `Импортировано документов: ${n}` : 'В файле не распознаны строки (ожидается CSV выгрузки)')
  }

  const addControls = canEdit && (
    <>
      <button className={mobile ? 'mq-add' : 'queue-add'} onClick={() => setShowNew(true)}>+ документ</button>
      <button className={mobile ? 'mq-add' : 'queue-add'} onClick={() => fileRef.current?.click()}>из файла</button>
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
        <div className="spacer" />
        <div className="queue-actions">{addControls}</div>
      </div>
      <div className="queue-filters">{filters}</div>
      <div className="queue-scroll">{cards}</div>
      {batch && <div className="queue-batch">{batch}</div>}
      {modal}
    </div>
  )
}

function PhotoPane({ doc, flash }) {
  const [zoom, setZoom] = useState(100)
  const line = doc.lines.find((l) => l.photoRect)
  const idx = line ? doc.lines.indexOf(line) + 1 : null
  return (
    <div className="photo-pane card">
      <div className="photo-view">
        <div className="photo-inner" style={{ transform: `scale(${zoom / 100})` }}>
          {line && (
            <div
              className={`photo-frame${flash ? ' flash' : ''}`}
              style={{ left: line.photoRect.left, right: line.photoRect.right, top: line.photoRect.top }}
            >
              <span className="photo-frame-tag">строка {idx}</span>
            </div>
          )}
        </div>
        <div className="photo-label">{doc.photoLabel}</div>
      </div>
      <div className="photo-bar">
        <div className="zoom">
          <button onClick={() => setZoom((z) => Math.max(50, z - 25))}>−</button>
          <div className="zoom-val">{zoom}%</div>
          <button onClick={() => setZoom((z) => Math.min(200, z + 25))}>+</button>
        </div>
        <div className="spacer" />
        <span className="link">открыть оригинал ⤢</span>
      </div>
    </div>
  )
}

function LineRow({ line, resolved }) {
  return (
    <div className={`lines-grid line-row${resolved ? ' line-resolved' : ''}`}>
      <div className="line-name">
        {line.name}
        {resolved && <span className="line-note"> исправлено · {line.resolvedBy} {line.resolvedAt}</span>}
      </div>
      <div className="line-num">{line.qty}</div>
      <div className="line-num">{money(line.price)}</div>
      <div className="line-num">{money(line.sum)}</div>
      <div className="line-cat"><span className="cat-chip">{line.category}</span></div>
    </div>
  )
}

function FlaggedLine({ doc, line, onFlash }) {
  const { resolveLine, canEdit } = useApp()
  const [custom, setCustom] = useState('')

  const apply = (price) => {
    if (Number.isFinite(price) && price > 0) resolveLine(doc.id, line.id, price)
  }

  return (
    <div className="line-flagged">
      <div className="lines-grid line-row">
        <div className="line-name">{line.name}</div>
        <div className="line-num">{line.qty}</div>
        <div className="line-num bad">{line.priceRaw}</div>
        <div className="line-num empty">—</div>
        <div className="line-cat"><span className="chip-red">уточнить цену</span></div>
      </div>
      <div className="line-helper">
        <div className="line-helper-text">ИИ не уверен в цене — на фото:</div>
        {canEdit && line.candidates.map((p) => (
          <button key={p} className="price-variant" onClick={() => apply(p)}>{p} ₽</button>
        ))}
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
        <button className="link" onClick={onFlash}>показать на фото</button>
      </div>
    </div>
  )
}

function VerifyPanel({ doc }) {
  const { shipDoc, canEdit } = useApp()
  const [flash, setFlash] = useState(false)
  const status = docStatus(doc)
  const { total, unknown } = docTotal(doc)
  const flaggedCount = doc.lines.filter((l) => l.flag && !l.resolvedAt).length
  const flaggedIdx = doc.lines.findIndex((l) => l.flag && !l.resolvedAt) + 1

  const doFlash = () => {
    setFlash(false)
    requestAnimationFrame(() => setFlash(true))
    window.setTimeout(() => setFlash(false), 1100)
  }

  if (status === 'processing') {
    return (
      <div className="verify">
        <div className="verify-head">
          <div>
            <div className="verify-title-row">
              <div className="verify-title">{doc.title}</div>
              <StatusChip status="processing" />
            </div>
            <div className="verify-sub">{doc.panelSubtitle}</div>
          </div>
        </div>
        <div className="verify-empty card">
          <div className="verify-empty-inner">
            <div className="photo-label">{doc.photoLabel}</div>
            <div>ИИ распознаёт строки документа · ~40 сек</div>
          </div>
        </div>
      </div>
    )
  }

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
          <button className="btn-ghost">шаблон_учёт.xlsx ⤓</button>
          <button className="btn-ghost">история</button>
        </div>
      </div>

      <div className="verify-body">
        <PhotoPane doc={doc} flash={flash} />

        <div className="lines-pane card">
          <div className="lines-grid lines-head">
            <div>ПОЗИЦИЯ</div>
            <div className="num-r">КОЛ-ВО</div>
            <div className="num-r">ЦЕНА</div>
            <div className="num-r">СУММА</div>
            <div className="pl12">КАТЕГОРИЯ</div>
          </div>
          <div className="lines-scroll">
            {doc.lines.map((l) =>
              l.flag && !l.resolvedAt
                ? <FlaggedLine key={l.id} doc={doc} line={l} onFlash={doFlash} />
                : <LineRow key={l.id} line={l} resolved={!!l.resolvedAt} />,
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
