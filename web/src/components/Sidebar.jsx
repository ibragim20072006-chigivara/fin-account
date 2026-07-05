import { useApp } from '../state.jsx'
import { currentUser } from '../data.js'

const NAV = [
  { id: 'queue', label: 'Очередь' },
  { id: 'reports', label: 'Отчёты' },
  { id: 'categories', label: 'Категории' },
  { id: 'templates', label: 'Шаблоны' },
  { id: 'settings', label: 'Настройки' },
]

export default function Sidebar() {
  const { screen, setScreen, documents } = useApp()
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
            {item.id === 'queue' && <span className="sidebar-badge">{documents.length}</span>}
          </button>
        ))}
      </nav>
      <div className="sidebar-user">
        <div className="avatar">{currentUser.initials}</div>
        <div>
          <div className="sidebar-user-name">{currentUser.name}</div>
          <div className="sidebar-user-role">{currentUser.role}</div>
        </div>
      </div>
    </div>
  )
}
