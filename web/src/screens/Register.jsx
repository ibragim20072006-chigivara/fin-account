import { useState } from 'react'
import { useApp } from '../state.jsx'
import { ROLES, ROLE_ORDER } from '../data.js'
import { initials } from '../auth.js'

export default function Register() {
  const { users, register, login } = useApp()
  const firstUser = users.length === 0
  const [mode, setMode] = useState(firstUser ? 'create' : 'pick')
  const [name, setName] = useState('')
  const [role, setRole] = useState('editor')

  const submit = (e) => {
    e.preventDefault()
    register({ name, role })
  }

  return (
    <div className="auth">
      <div className="auth-card card">
        <div className="auth-brand">
          <div className="sidebar-logo-mark">К</div>
          <div className="sidebar-logo-name">Карьер-менеджер</div>
        </div>

        {mode === 'pick' ? (
          <>
            <div className="auth-title">Вход</div>
            <div className="auth-sub">Выберите пользователя или добавьте нового</div>
            <div className="auth-users">
              {users.map((u) => (
                <button key={u.id} className="auth-user" onClick={() => login(u.id)}>
                  <div className="avatar">{initials(u.name)}</div>
                  <div className="auth-user-info">
                    <div className="auth-user-name">{u.name}</div>
                    <div className="auth-user-role">{ROLES[u.role]?.label ?? u.role}</div>
                  </div>
                  <div className="spacer" />
                  <div className="link">войти →</div>
                </button>
              ))}
            </div>
            <button className="btn-outline-blue" onClick={() => setMode('create')}>+ новый пользователь</button>
          </>
        ) : (
          <form onSubmit={submit}>
            <div className="auth-title">{firstUser ? 'Регистрация' : 'Новый пользователь'}</div>
            <div className="auth-sub">
              {firstUser
                ? 'Первый пользователь становится администратором'
                : 'Роль определяет права: просмотр или редактирование'}
            </div>

            <label className="auth-field">
              <div className="section-label">ИМЯ</div>
              <input
                className="auth-input"
                autoFocus
                value={name}
                placeholder="Имя и фамилия"
                onChange={(e) => setName(e.target.value)}
              />
            </label>

            {!firstUser && (
              <div className="auth-field">
                <div className="section-label">РОЛЬ</div>
                <div className="auth-roles">
                  {ROLE_ORDER.map((r) => (
                    <button
                      type="button"
                      key={r}
                      className={`auth-role${role === r ? ' active' : ''}`}
                      onClick={() => setRole(r)}
                    >
                      <div className="auth-role-name">{ROLES[r].label}</div>
                      <div className="auth-role-hint">{ROLES[r].hint}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button className="btn-primary" type="submit" disabled={!name.trim()}>
              {firstUser ? 'Создать и войти' : 'Добавить и войти'}
            </button>
            {!firstUser && (
              <button type="button" className="link auth-back" onClick={() => setMode('pick')}>← к списку</button>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
