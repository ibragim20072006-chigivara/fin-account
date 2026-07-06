import { useEffect, useState } from 'react'
import { useApp } from '../state.jsx'
import { api } from '../api.js'

export default function Register() {
  const { register, login } = useApp()
  const [hasUsers, setHasUsers] = useState(null) // null пока не знаем
  const [name, setName] = useState('')
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.status().then((s) => setHasUsers(s.hasUsers)).catch(() => setHasUsers(true))
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (hasUsers) await login({ login: loginId, password })
      else await register({ name, login: loginId, password })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  const isRegister = hasUsers === false
  const canSubmit = loginId.trim() && password && (!isRegister || name.trim())

  return (
    <div className="auth">
      <div className="auth-card card">
        <div className="auth-brand">
          <div className="sidebar-logo-mark">К</div>
          <div className="sidebar-logo-name">Карьер-менеджер</div>
        </div>

        {hasUsers === null ? (
          <div className="auth-sub">Загрузка…</div>
        ) : (
          <form onSubmit={submit}>
            <div className="auth-title">{isRegister ? 'Регистрация' : 'Вход'}</div>
            <div className="auth-sub">
              {isRegister
                ? 'Первый пользователь становится администратором'
                : 'Введите логин и пароль'}
            </div>

            {isRegister && (
              <label className="auth-field">
                <div className="section-label">ИМЯ</div>
                <input className="auth-input" autoFocus value={name} placeholder="Имя и фамилия" onChange={(e) => setName(e.target.value)} />
              </label>
            )}
            <label className="auth-field">
              <div className="section-label">ЛОГИН</div>
              <input className="auth-input" autoFocus={!isRegister} value={loginId} placeholder="логин" autoComplete="username" onChange={(e) => setLoginId(e.target.value)} />
            </label>
            <label className="auth-field">
              <div className="section-label">ПАРОЛЬ</div>
              <input className="auth-input" type="password" value={password} autoComplete={isRegister ? 'new-password' : 'current-password'} onChange={(e) => setPassword(e.target.value)} />
            </label>

            {error && <div className="auth-error">{error}</div>}

            <button className="btn-primary" type="submit" disabled={!canSubmit || busy}>
              {busy ? '…' : isRegister ? 'Создать и войти' : 'Войти'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
