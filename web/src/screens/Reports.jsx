import { useState } from 'react'
import { useApp } from '../state.jsx'
import { Segment } from '../components/ui.jsx'
import { reports, monthOrder } from '../data.js'
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

function Bars({ bars, mini }) {
  if (mini) {
    return (
      <div className="kpi-bars">
        {bars.map((b, i) => (
          <div
            key={b.m}
            className={b.current ? 'cur' : i === bars.length - 2 ? 'prev' : ''}
            style={{ height: `${b.h}%` }}
          />
        ))}
      </div>
    )
  }
  return (
    <div className="dynamics-bars">
      {bars.map((b, i) => (
        <div key={b.m} className="dyn-col">
          {b.label && <div className="dyn-value">{b.label}</div>}
          <div
            className={`dyn-bar${b.current ? ' cur' : i === bars.length - 2 ? ' prev' : ''}`}
            style={{ height: `${b.h}%`, maxHeight: b.label ? 'calc(100% - 40px)' : undefined }}
          />
          <div className={`dyn-label${b.current ? ' cur' : ''}`}>{b.m}</div>
        </div>
      ))}
    </div>
  )
}

function DrillModal({ article, monthLabel, account, onClose }) {
  const { openDocInQueue, showToast } = useApp()
  const [expanded, setExpanded] = useState(false)
  const hidden = article.drill.hidden ?? []
  const hiddenSum = hidden.reduce((s, d) => s + d.sum, 0)
  const rows = expanded ? [...article.drill.docs, ...hidden] : article.drill.docs

  const open = (d) => {
    onClose()
    if (d.queueId) openDocInQueue(d.queueId)
    else {
      openDocInQueue(null)
      showToast('Документ отгружен ранее — смотрите историю очереди')
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="modal-title">{article.name} · {monthLabel.toLowerCase()}</div>
            <div className="modal-sub">{article.docsCount} документов · счёт {account}</div>
          </div>
          <div className="spacer" />
          <div className="modal-sum">{rub(article.sum)}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {rows.map((d, i) => (
            <div key={i} className="modal-row">
              <div className="modal-row-date">{d.date}</div>
              <div className="modal-row-name">{d.name}</div>
              <div className="modal-row-who">{d.who}</div>
              <div className="modal-row-sum">{money(d.sum)}</div>
              <div className="modal-row-open"><button className="link" onClick={() => open(d)}>открыть</button></div>
            </div>
          ))}
          {hidden.length > 0 && !expanded && (
            <button className="modal-more" onClick={() => setExpanded(true)}>
              <span className="modal-more-label">показать ещё {hidden.length} документа</span>
              <span className="modal-more-sum">{rub(hiddenSum)}</span>
            </button>
          )}
        </div>
        <div className="modal-foot">
          <div className="modal-foot-note">«открыть» показывает документ в очереди со сверкой</div>
          <div className="spacer" />
          <button className="btn-ghost sm" onClick={() => showToast('Список сохранён в .xlsx')}>скачать список ⤓</button>
        </div>
      </div>
    </div>
  )
}

function OpuView({ data, monthLabel, onDrill }) {
  const { setScreen } = useApp()
  return (
    <>
      <div className="kpi-grid two">
        <div className="kpi row card">
          <div className="kpi-main">
            <div className="kpi-label">ВЫРУЧКА</div>
            <div className="kpi-value">{rub(data.revenue)}</div>
            <div className="kpi-delta up">{data.revenueDelta}</div>
          </div>
          <Bars bars={data.revenueBars} mini />
        </div>
        <div className="kpi card">
          <div className="kpi-label">ЧИСТАЯ ПРИБЫЛЬ</div>
          <div className="kpi-value blue">{rub(data.profit)}</div>
          <div className="kpi-delta">{data.profitNote}</div>
        </div>
      </div>

      <div className="report-grid">
        <div className="breakdown card">
          <div className="breakdown-head">
            <div className="breakdown-title">Расходы по статьям</div>
            <div className="breakdown-total">{rub(data.expensesTotal)}</div>
            <div className="spacer" />
            <button className="link" onClick={() => setScreen('categories')}>все статьи →</button>
          </div>
          <StackBar items={data.expenses} />
          <Legend items={data.expenses} twoCol onSelect={onDrill} />
          <div className="breakdown-hint">клик по статье → из каких документов сложилась сумма</div>
        </div>

        <div className="dynamics card">
          <div className="breakdown-head">
            <div className="breakdown-title">Динамика выручки</div>
            <div className="breakdown-hint" style={{ marginTop: 0 }}>6 месяцев</div>
          </div>
          <Bars bars={data.revenueBars} />
        </div>
      </div>

      <div className="reports-footer">
        <div className="reports-footer-meta">{data.footer}</div>
        <div className="spacer" />
        <button className="link" style={{ fontSize: '12.5px' }} onClick={() => setScreen('queue')}>открыть очередь →</button>
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
          <div className="kpi-delta up">{data.inflowDelta}</div>
        </div>
        <div className="kpi card">
          <div className="kpi-label">ВЫПЛАТЫ</div>
          <div className="kpi-value">{rub(data.outflow)}</div>
          <div className="kpi-delta">{data.outflowNote}</div>
        </div>
        <div className="kpi card">
          <div className="kpi-label">ОСТАТОК НА {data.balanceDate}</div>
          <div className="kpi-value blue">{rub(data.balance)}</div>
          <div className="kpi-delta up">{data.balanceDelta}</div>
        </div>
      </div>

      <div className="report-grid half">
        <div className="breakdown card">
          <div className="breakdown-head">
            <div className="breakdown-title">Поступления</div>
            <div className="breakdown-total">{rub(data.inflow)}</div>
          </div>
          <StackBar items={data.receipts} />
          <Legend items={data.receipts} />
          <div className="breakdown-hint">клик по строке → платежи и документы</div>
        </div>
        <div className="breakdown card">
          <div className="breakdown-head">
            <div className="breakdown-title">Выплаты</div>
            <div className="breakdown-total">{rub(data.outflow)}</div>
          </div>
          <StackBar items={data.payments} />
          <Legend items={data.payments} />
        </div>
      </div>

      <div className="accounts-strip card">
        <div className="accounts-label">ОСТАТКИ ПО СЧЕТАМ</div>
        {data.accounts.map((a) => (
          <div key={a.name} className="account">
            <div className="account-name">{a.name}</div>
            <div className="account-sum">{money(a.sum)}</div>
          </div>
        ))}
        <div className="spacer" />
        <div className="accounts-start">начало месяца: {rub(data.monthStart)}</div>
      </div>
    </>
  )
}

export default function Reports() {
  const { categories, showToast } = useApp()
  const [tab, setTab] = useState('opu')
  const [monthIdx, setMonthIdx] = useState(monthOrder.length - 1)
  const [drill, setDrill] = useState(null)

  const monthKey = monthOrder[monthIdx]
  const month = reports[monthKey]

  return (
    <div className="reports">
      <div className="reports-head">
        <div className="reports-title">Отчёты</div>
        <Segment
          items={[{ value: 'opu', label: 'ОПиУ' }, { value: 'dds', label: 'ДДС' }]}
          value={tab}
          onChange={setTab}
        />
        <div className="pager">
          <button disabled={monthIdx === 0} onClick={() => setMonthIdx((i) => i - 1)}>‹</button>
          <div className="pager-label">{month.label}</div>
          <button disabled={monthIdx === monthOrder.length - 1} onClick={() => setMonthIdx((i) => i + 1)}>›</button>
        </div>
        <div className="spacer" />
        <button className="btn-ghost" onClick={() => showToast('Отчёт сохранён в .xlsx')}>скачать .xlsx ⤓</button>
      </div>

      {tab === 'opu'
        ? <OpuView data={month.opu} monthLabel={month.label} onDrill={setDrill} />
        : <DdsView data={month.dds} />}

      {drill && (
        <DrillModal
          article={drill}
          monthLabel={month.label}
          account={categories.find((c) => c.id === drill.id)?.account ?? '—'}
          onClose={() => setDrill(null)}
        />
      )}
    </div>
  )
}
