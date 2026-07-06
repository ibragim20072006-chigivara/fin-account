import { useMemo, useState } from 'react'
import { useApp, computeReports } from '../../state.jsx'
import { Segment } from '../../components/ui.jsx'
import { StackBar, Legend } from '../Reports.jsx'
import { rub } from '../../format.js'

export default function MobileReports() {
  const { documents, categories } = useApp()
  const [tab, setTab] = useState('opu')
  const report = useMemo(() => computeReports(documents, categories), [documents, categories])
  const opu = report.opu
  const dds = report.dds

  return (
    <>
      <div className="mq-head">
        <div className="mq-title">Отчёты</div>
        <div className="spacer" />
        <Segment
          items={[{ value: 'opu', label: 'ОПиУ' }, { value: 'dds', label: 'ДДС' }]}
          value={tab}
          onChange={setTab}
          small
        />
      </div>
      <div className="mr">
        {!report.hasData ? (
          <div className="page-empty card">Отчёт появится после первой отгрузки документов</div>
        ) : tab === 'opu' ? (
          <>
            <div className="kpi card">
              <div className="kpi-label">ВЫРУЧКА</div>
              <div className="kpi-value">{rub(opu.revenue)}</div>
            </div>
            <div className="kpi card">
              <div className="kpi-label">ЧИСТАЯ ПРИБЫЛЬ</div>
              <div className="kpi-value blue">{rub(opu.profit)}</div>
            </div>
            {opu.expenses.length > 0 && (
              <div className="breakdown card">
                <div className="breakdown-head">
                  <div className="breakdown-title">Расходы по статьям</div>
                  <div className="breakdown-total">{rub(opu.expensesTotal)}</div>
                </div>
                <StackBar items={opu.expenses} />
                <Legend items={opu.expenses} twoCol />
              </div>
            )}
          </>
        ) : (
          <>
            <div className="kpi card">
              <div className="kpi-label">ПОСТУПЛЕНИЯ</div>
              <div className="kpi-value">{rub(dds.inflow)}</div>
            </div>
            <div className="kpi card">
              <div className="kpi-label">ВЫПЛАТЫ</div>
              <div className="kpi-value">{rub(dds.outflow)}</div>
            </div>
            <div className="kpi card">
              <div className="kpi-label">ДЕНЕЖНЫЙ ПОТОК</div>
              <div className="kpi-value blue">{rub(dds.inflow - dds.outflow)}</div>
            </div>
            {dds.payments.length > 0 && (
              <div className="breakdown card">
                <div className="breakdown-head">
                  <div className="breakdown-title">Выплаты</div>
                  <div className="breakdown-total">{rub(dds.outflow)}</div>
                </div>
                <StackBar items={dds.payments} />
                <Legend items={dds.payments} />
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
