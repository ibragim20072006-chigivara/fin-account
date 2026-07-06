import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useApp } from '../state.jsx'
import { ROLES, ROLE_ORDER } from '../data.js'
import { initials } from '../api.js'
import { downloadShipmentCsv } from '../export.js'

function ExportCard() {
  const { documents, activeTemplate, showToast } = useApp()
  const shippedCount = documents.filter((d) => d.status === 'shipped').length

  const download = () => {
    const rows = downloadShipmentCsv(documents, activeTemplate)
    showToast(rows ? `Скачано строк: ${rows}` : 'Нет отгруженных документов для выгрузки')
  }

  return (
    <div className="settings-card card">
      <div className="settings-card-title">Выгрузка</div>
      <div className="settings-row">
        <div className="settings-row-label">Формат</div>
        <div className="settings-value">CSV · шаблон «{activeTemplate.name}»</div>
      </div>
      <div className="settings-row">
        <div className="settings-row-label">Отгружено документов</div>
        <div className="settings-value">{shippedCount}</div>
        <div className="spacer" />
        <button className="btn-primary sm" onClick={download}>Скачать .csv</button>
      </div>
    </div>
  )
}

function AddUser() {
  const { addUser, showToast } = useApp()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('viewer')

  const reset = () => { setName(''); setLogin(''); setPassword(''); setRole('viewer'); setOpen(false) }
  const valid = name.trim() && login.trim() && password

  const submit = async () => {
    if (!valid) return
    try {
      await addUser({ name, login, password, role })
      reset()
    } catch (e) {
      showToast(e.message)
    }
  }

  if (!open) {
    return <button className="btn-outline-blue" style={{ padding: '5px 11px' }} onClick={() => setOpen(true)}>+ пригласить</button>
  }

  return (
    <div className="add-user">
      <input className="keyword-input" style={{ width: 150 }} autoFocus placeholder="Имя и фамилия" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="keyword-input" style={{ width: 110 }} placeholder="логин" value={login} onChange={(e) => setLogin(e.target.value)} />
      <input className="keyword-input" style={{ width: 110 }} type="password" placeholder="пароль" value={password} onChange={(e) => setPassword(e.target.value)} />
      <select className="role-select" value={role} onChange={(e) => setRole(e.target.value)}>
        {ROLE_ORDER.map((r) => <option key={r} value={r}>{ROLES[r].label}</option>)}
      </select>
      <button className="btn-primary sm" onClick={submit} disabled={!valid}>добавить</button>
      <button className="team-link" onClick={reset}>отмена</button>
    </div>
  )
}

function TeamCard() {
  const { users, currentUser, isAdmin, setUserRole, removeUser, loadUsers } = useApp()

  useEffect(() => { loadUsers() }, [])

  return (
    <div className="team-card card">
      <div className="team-head">
        <div className="settings-card-title">Команда</div>
        <div className="spacer" />
        {isAdmin && <AddUser />}
      </div>
      {users.map((u) => {
        const isMe = u.id === currentUser.id
        return (
          <div key={u.id} className="team-row">
            <div className="avatar lg">{initials(u.name)}</div>
            <div className="team-name">{u.name}{isMe && <span className="team-you"> · вы</span>}</div>
            {isAdmin && !isMe ? (
              <select className="role-select" value={u.role} onChange={(e) => setUserRole(u.id, e.target.value)}>
                {ROLE_ORDER.map((r) => <option key={r} value={r}>{ROLES[r].label}</option>)}
              </select>
            ) : (
              <div className="team-role">{ROLES[u.role]?.label ?? u.role}</div>
            )}
            <div className="team-rights">{ROLES[u.role]?.hint ?? ''}</div>
            <div className="spacer" />
            {isAdmin && !isMe && (
              <button className="team-remove" onClick={() => removeUser(u.id)} title="Удалить">
                <X size={15} strokeWidth={2} />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function Settings() {
  return (
    <div className="page">
      <div className="page-head">
        <div className="page-title">Настройки</div>
      </div>

      <div className="settings-col">
        <ExportCard />
        <TeamCard />
      </div>
    </div>
  )
}
