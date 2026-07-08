import { useState } from 'react'
import { useApp } from '../state.jsx'
import { Segment } from '../components/ui.jsx'

export default function CategoryForm({ onDone, onCancel }) {
  const { addCategory } = useApp()
  const [name, setName] = useState('')
  const [kind, setKind] = useState('income')
  const valid = name.trim()

  const submit = () => {
    if (!valid) return
    const id = addCategory({ name, kind })
    onDone?.(id)
  }

  return (
    <div className="add-user">
      <input className="keyword-input" style={{ width: 210 }} autoFocus placeholder="Название категории" value={name} onChange={(e) => setName(e.target.value)} />
      <Segment
        small
        items={[{ value: 'income', label: 'Приход' }, { value: 'expense', label: 'Расход' }]}
        value={kind}
        onChange={setKind}
      />
      <button className="btn-primary sm" onClick={submit} disabled={!valid}>создать</button>
      {onCancel && <button className="team-link" onClick={onCancel}>отмена</button>}
    </div>
  )
}
