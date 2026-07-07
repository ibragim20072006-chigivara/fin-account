import { useMemo, useState } from 'react'
import { useApp, computeReports } from '../../state.jsx'
import { Segment } from '../../components/ui.jsx'
import { StackBar, Legend } from '../Reports.jsx'
import { rub } from '../../format.js'

export default function MobileReports() {
  const { documents, categories } = useApp()
  const [tab, setTab] = useState('opu')
  const report = useMemo(() => computeReports(documents, categories), [documents, categories])

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
              <div className="kpi-label">ПРИХОД</div>
              <div className="kpi-value">{rub(report.prihod)}</div>
            </div>
            <div className="kpi card">
              <div className="kpi-label">ВЫРУЧКА</div>
              <div className="kpi-value blue">{rub(report.vyruchka)}</div>
            </div>
            {report.payments.length > 0 && (
              <div className="breakdown card">
                <div className="breakdown-head">
                  <div className="breakdown-title">Расход по статьям</div>
                  <div className="breakdown-total">{rub(report.rashod)}</div>
                </div>
                <StackBar items={report.payments} />
                <Legend items={report.payments} twoCol />
              </div>
            )}
          </>
        ) : (
          <>
            <div className="kpi card">
              <div className="kpi-label">ПРИХОД</div>
              <div className="kpi-value">{rub(report.prihod)}</div>
            </div>
            <div className="kpi card">
              <div className="kpi-label">РАСХОД</div>
              <div className="kpi-value">{rub(report.rashod)}</div>
            </div>
            <div className="kpi card">
              <div className="kpi-label">ВЫРУЧКА</div>
              <div className="kpi-value blue">{rub(report.vyruchka)}</div>
            </div>
            {report.payments.length > 0 && (
              <div className="breakdown card">
                <div className="breakdown-head">
                  <div className="breakdown-title">Расход по статьям</div>
                  <div className="breakdown-total">{rub(report.rashod)}</div>
                </div>
                <StackBar items={report.payments} />
                <Legend items={report.payments} />
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
