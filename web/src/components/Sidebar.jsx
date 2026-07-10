import { LogOut } from 'lucide-react'
import { useApp } from '../state.jsx'
import { initials } from '../api.js'

const NAV = [
  { id: 'reports', label: 'Отчёты' },
  { id: 'queue', label: 'Очередь' },
  { id: 'categories', label: 'Категории' },
  { id: 'guide', label: 'Руководство' },
  { id: 'settings', label: 'Настройки' },
]

export default function Sidebar() {
  const { screen, setScreen, documents, currentUser, role, logout } = useApp()
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">К</div>
        <div className="sidebar-logo-name">Карьер-менеджер</div>
      </div>
      <nav className="sidebar-nav">
        {NAV.map((item) => (
          <button
            key={item.id}
            className={`sidebar-item${screen === item.id ? ' active' : ''}`}
            onClick={() => setScreen(item.id)}
          >
            {item.label}
            {item.id === 'queue' && documents.length > 0 && (
              <span className="sidebar-badge">{documents.length}</span>
            )}
          </button>
        ))}
      </nav>
      <div className="sidebar-user">
        <div className="avatar">{initials(currentUser.name)}</div>
        <div className="sidebar-user-main">
          <div className="sidebar-user-name">{currentUser.name}</div>
          <div className="sidebar-user-role">{role?.label ?? ''}</div>
        </div>
        <button className="sidebar-logout" onClick={logout} title="Выйти">
          <LogOut size={16} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  )
}
