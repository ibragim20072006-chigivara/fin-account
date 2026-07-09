import { useMemo, useState } from 'react'
import { useApp, computeReports } from '../state.jsx'
import { Segment } from '../components/ui.jsx'
import { downloadShipmentCsv } from '../export.js'
import { money, rub } from '../format.js'

export function StackBar({ items }) {
  return (
    <div className="stack-bar">
      {items.map((it) => (
        <div key={it.id} style={{ width: `${it.pct}%`, background: it.color }} />
      ))}
    </div>
  )
}

export function Legend({ items, twoCol, onSelect }) {
  return (
    <div className={`legend${twoCol ? ' two-col' : ''}`}>
      {items.map((it) => {
        const inner = (
          <>
            <div className="legend-dot" style={{ background: it.color }} />
            <div className="legend-name">{it.name}</div>
            <div className="legend-sum">{money(it.sum)}</div>
            <div className="legend-pct">{it.pct}%</div>
          </>
        )
        return onSelect
          ? <button key={it.id} className="legend-row" onClick={() => onSelect(it)}>{inner}</button>
          : <div key={it.id} className="legend-row">{inner}</div>
      })}
    </div>
  )
}

function DrillModal({ article, onClose }) {
  const { openDocInQueue, showToast } = useApp()
  const docs = article.docs ?? []

  const open = (d) => {
    onClose()
    if (d.queueId) openDocInQueue(d.queueId)
    else showToast('Документ отгружён ранее')
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="modal-title">{article.name}</div>
            <div className="modal-sub">{docs.length} документов</div>
          </div>
          <div className="spacer" />
          <div className="modal-sum">{rub(article.sum)}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {docs.map((d, i) => (
            <div key={i} className="modal-row">
              <div className="modal-row-date">{d.date}</div>
              <div className="modal-row-name">{d.name}</div>
              <div className="modal-row-who">{d.who}</div>
              <div className="modal-row-sum">{money(d.sum)}</div>
              <div className="modal-row-open"><button className="link" onClick={() => open(d)}>открыть</button></div>
            </div>
          ))}
        </div>
        <div className="modal-foot">
          <div className="modal-foot-note">«открыть» показывает документ в очереди со сверкой</div>
        </div>
      </div>
    </div>
  )
}

function ReportsEmpty() {
  const { setScreen, canEdit } = useApp()
  return (
    <div className="page-empty card">
      Отчёт появится после первой отгрузки документов
      {canEdit && (
        <>
          {' — '}
          <button className="link" onClick={() => setScreen('queue')}>перейти в очередь</button>
        </>
      )}
    </div>
  )
}

function OpuView({ data, onDrill }) {
  return (
    <>
      <div className="kpi-grid two">
        <div className="kpi card">
          <div className="kpi-label">ПРИХОД</div>
          <div className="kpi-value">{rub(data.prihod)}</div>
        </div>
        <div className="kpi card">
          <div className="kpi-label">ВЫРУЧКА</div>
          <div className="kpi-value blue">{rub(data.vyruchka)}</div>
        </div>
      </div>

      <div className="breakdown card">
        <div className="breakdown-head">
          <div className="breakdown-title">Расход по статьям</div>
          <div className="breakdown-total">{rub(data.rashod)}</div>
        </div>
        {data.payments.length ? (
          <>
            <StackBar items={data.payments} />
            <Legend items={data.payments} twoCol onSelect={onDrill} />
            <div className="breakdown-hint">клик по статье → из каких документов сложилась сумма</div>
          </>
        ) : (
          <div className="breakdown-hint">нет расхода за период</div>
        )}
      </div>
    </>
  )
}

function DdsView({ data, onDrill }) {
  return (
    <>
      <div className="kpi-grid three">
        <div className="kpi card">
          <div className="kpi-label">ПРИХОД</div>
          <div className="kpi-value">{rub(data.prihod)}</div>
        </div>
        <div className="kpi card">
          <div className="kpi-label">РАСХОД</div>
          <div className="kpi-value">{rub(data.rashod)}</div>
        </div>
        <div className="kpi card">
          <div className="kpi-label">ВЫРУЧКА</div>
          <div className="kpi-value blue">{rub(data.vyruchka)}</div>
        </div>
      </div>

      <div className="report-grid half">
        <div className="breakdown card">
          <div className="breakdown-head">
            <div className="breakdown-title">Приход по статьям</div>
            <div className="breakdown-total">{rub(data.prihod)}</div>
          </div>
          {data.receipts.length ? (
            <><StackBar items={data.receipts} /><Legend items={data.receipts} onSelect={onDrill} /></>
          ) : <div className="breakdown-hint">нет прихода за период</div>}
        </div>
        <div className="breakdown card">
          <div className="breakdown-head">
            <div className="breakdown-title">Расход по статьям</div>
            <div className="breakdown-total">{rub(data.rashod)}</div>
          </div>
          {data.payments.length ? (
            <><StackBar items={data.payments} /><Legend items={data.payments} onSelect={onDrill} /></>
          ) : <div className="breakdown-hint">нет расхода за период</div>}
        </div>
      </div>
    </>
  )
}

export default function Reports() {
  const { documents, categories, showToast } = useApp()
  const [tab, setTab] = useState('opu')
  const [drill, setDrill] = useState(null)

  const report = useMemo(() => computeReports(documents, categories), [documents, categories])

  const download = () => {
    const rows = downloadShipmentCsv(documents, categories)
    showToast(rows ? `Скачано строк: ${rows}` : 'Нет отгруженных документов для выгрузки')
  }

  return (
    <div className="reports">
      <div className="reports-head">
        <div className="reports-title">Отчёты</div>
        <Segment
          items={[{ value: 'opu', label: 'ОПиУ' }, { value: 'dds', label: 'ДДС' }]}
          value={tab}
          onChange={setTab}
        />
        <div className="spacer" />
        <button className="btn-ghost" onClick={download}>скачать .csv ⤓</button>
      </div>

      {!report.hasData ? (
        <ReportsEmpty />
      ) : tab === 'opu' ? (
        <OpuView data={report} onDrill={setDrill} />
      ) : (
        <DdsView data={report} onDrill={setDrill} />
      )}

      {drill && (
        <DrillModal
          article={drill}
          onClose={() => setDrill(null)}
        />
      )}
    </div>
  )
}
