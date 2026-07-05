import { useState } from 'react'
import { Segment } from '../../components/ui.jsx'
import { StackBar, Legend } from '../Reports.jsx'
import { reports, monthOrder } from '../../data.js'
import { money, rub } from '../../format.js'

export default function MobileReports() {
  const [tab, setTab] = useState('opu')
  const month = reports[monthOrder[monthOrder.length - 1]]
  const opu = month.opu
  const dds = month.dds

  return (
    <>
      <div className="mq-head">
        <div className="mq-title">Отчёты</div>
        <div className="mq-count">{month.label}</div>
        <div className="spacer" />
        <Segment
          items={[{ value: 'opu', label: 'ОПиУ' }, { value: 'dds', label: 'ДДС' }]}
          value={tab}
          onChange={setTab}
          small
        />
      </div>
      <div className="mr">
        {tab === 'opu' ? (
          <>
            <div className="kpi card">
              <div className="kpi-label">ВЫРУЧКА</div>
              <div className="kpi-value">{rub(opu.revenue)}</div>
              <div className="kpi-delta up">{opu.revenueDelta}</div>
            </div>
            <div className="kpi card">
              <div className="kpi-label">ЧИСТАЯ ПРИБЫЛЬ</div>
              <div className="kpi-value blue">{rub(opu.profit)}</div>
              <div className="kpi-delta">{opu.profitNote}</div>
            </div>
            <div className="breakdown card">
              <div className="breakdown-head">
                <div className="breakdown-title">Расходы по статьям</div>
                <div className="breakdown-total">{rub(opu.expensesTotal)}</div>
              </div>
              <StackBar items={opu.expenses} />
              <Legend items={opu.expenses} twoCol />
            </div>
          </>
        ) : (
          <>
            <div className="kpi card">
              <div className="kpi-label">ПОСТУПЛЕНИЯ</div>
              <div className="kpi-value">{rub(dds.inflow)}</div>
              <div className="kpi-delta up">{dds.inflowDelta}</div>
            </div>
            <div className="kpi card">
              <div className="kpi-label">ВЫПЛАТЫ</div>
              <div className="kpi-value">{rub(dds.outflow)}</div>
              <div className="kpi-delta">{dds.outflowNote}</div>
            </div>
            <div className="kpi card">
              <div className="kpi-label">ОСТАТОК НА {dds.balanceDate}</div>
              <div className="kpi-value blue">{rub(dds.balance)}</div>
              <div className="kpi-delta up">{dds.balanceDelta}</div>
            </div>
            <div className="breakdown card">
              <div className="breakdown-head">
                <div className="breakdown-title">Выплаты</div>
                <div className="breakdown-total">{rub(dds.outflow)}</div>
              </div>
              <StackBar items={dds.payments} />
              <Legend items={dds.payments} />
            </div>
            <div className="accounts-strip card">
              <div className="accounts-label">ОСТАТКИ ПО СЧЕТАМ</div>
              {dds.accounts.map((a) => (
                <div key={a.name} className="account">
                  <div className="account-name">{a.name}</div>
                  <div className="account-sum">{money(a.sum)}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
