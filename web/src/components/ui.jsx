import { STATUS } from '../state.jsx'

export function StatusChip({ status, label }) {
  const s = STATUS[status]
  return <span className={`chip ${s.tone}`}>{label ?? s.label}</span>
}

export function Segment({ items, value, onChange, small }) {
  return (
    <div className={`segment${small ? ' sm' : ''}`}>
      {items.map((it) => (
        <button
          key={it.value}
          className={`segment-item${it.value === value ? ' active' : ''}`}
          onClick={() => onChange(it.value)}
        >
          {it.label}
        </button>
      ))}
    </div>
  )
}

export function Toggle({ on, onChange }) {
  return (
    <button
      className={`toggle${on ? ' on' : ''}`}
      role="switch"
      aria-checked={on}
      onClick={onChange}
    />
  )
}

export function DocCard({ doc, status, selected, onClick }) {
  return (
    <button className={`doc-card${selected ? ' selected' : ''}${status === 'shipped' ? ' shipped' : ''}`} onClick={onClick}>
      <div className="doc-card-top">
        <div className="doc-card-title">{doc.title}</div>
        <StatusChip status={status} />
      </div>
      {status !== 'shipped' && <div className="doc-card-sub">{doc.subtitle}</div>}
      <div className="doc-card-meta">
        {doc.metaOverride ??
          `${doc.uploadedBy} · ${doc.uploadedAt}${doc.lines.length ? ` · ${doc.lines.length} ${plural(doc.lines.length, 'строка', 'строки', 'строк')}` : ''}`}
      </div>
    </button>
  )
}

export function plural(n, one, few, many) {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few
  return many
}
