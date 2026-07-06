import { useMemo, useState } from 'react'
import { useApp, computeReports } from '../state.jsx'
import { Segment } from '../components/ui.jsx'
import { downloadShipmentCsv } from '../export.js'
import { money, rub } from '../format.js'

export function StackBar({ items }) {
  return (
    <div className="stack-bar">
      {items.map((it) => (
        <div key={it.name} style={{ width: `${it.pct}%`, background: it.color }} />
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
          ? <button key={it.name} className="legend-row" onClick={() => onSelect(it)}>{inner}</button>
          : <div key={it.name} className="legend-row">{inner}</div>
      })}
    </div>
  )
}

function DrillModal({ article, account, onClose }) {
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
            <div className="modal-sub">{docs.length} документов · счёт {account}</div>
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
          <div className="kpi-label">ВЫРУЧКА</div>
          <div className="kpi-value">{rub(data.revenue)}</div>
        </div>
        <div className="kpi card">
          <div className="kpi-label">ЧИСТАЯ ПРИБЫЛЬ</div>
          <div className="kpi-value blue">{rub(data.profit)}</div>
        </div>
      </div>

      <div className="breakdown card">
        <div className="breakdown-head">
          <div className="breakdown-title">Расходы по статьям</div>
          <div className="breakdown-total">{rub(data.expensesTotal)}</div>
        </div>
        {data.expenses.length ? (
          <>
            <StackBar items={data.expenses} />
            <Legend items={data.expenses} twoCol onSelect={onDrill} />
            <div className="breakdown-hint">клик по статье → из каких документов сложилась сумма</div>
          </>
        ) : (
          <div className="breakdown-hint">нет расходов за период</div>
        )}
      </div>
    </>
  )
}

function DdsView({ data }) {
  return (
    <>
      <div className="kpi-grid three">
        <div className="kpi card">
          <div className="kpi-label">ПОСТУПЛЕНИЯ</div>
          <div className="kpi-value">{rub(data.inflow)}</div>
        </div>
        <div className="kpi card">
          <div className="kpi-label">ВЫПЛАТЫ</div>
          <div className="kpi-value">{rub(data.outflow)}</div>
        </div>
        <div className="kpi card">
          <div className="kpi-label">ДЕНЕЖНЫЙ ПОТОК</div>
          <div className="kpi-value blue">{rub(data.inflow - data.outflow)}</div>
        </div>
      </div>

      <div className="report-grid half">
        <div className="breakdown card">
          <div className="breakdown-head">
            <div className="breakdown-title">Поступления</div>
            <div className="breakdown-total">{rub(data.inflow)}</div>
          </div>
          {data.receipts.length ? (
            <><StackBar items={data.receipts} /><Legend items={data.receipts} /></>
          ) : <div className="breakdown-hint">нет поступлений за период</div>}
        </div>
        <div className="breakdown card">
          <div className="breakdown-head">
            <div className="breakdown-title">Выплаты</div>
            <div className="breakdown-total">{rub(data.outflow)}</div>
          </div>
          {data.payments.length ? (
            <><StackBar items={data.payments} /><Legend items={data.payments} /></>
          ) : <div className="breakdown-hint">нет выплат за период</div>}
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
    const rows = downloadShipmentCsv(documents)
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
        <OpuView data={report.opu} onDrill={setDrill} />
      ) : (
        <DdsView data={report.dds} />
      )}

      {drill && (
        <DrillModal
          article={drill}
          account={categories.find((c) => c.name === drill.name)?.account ?? '—'}
          onClose={() => setDrill(null)}
        />
      )}
    </div>
  )
}
