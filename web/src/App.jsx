import { useState, useEffect } from 'react'
import { Camera, Inbox, BarChart3, Settings as SettingsIcon, BookOpen } from 'lucide-react'
import { useApp } from './state.jsx'
import Sidebar from './components/Sidebar.jsx'
import Queue, { QueueList } from './screens/Queue.jsx'
import Reports from './screens/Reports.jsx'
import Categories from './screens/Categories.jsx'
import Settings from './screens/Settings.jsx'
import Guide from './screens/Guide.jsx'
import Register from './screens/Register.jsx'
import Capture from './screens/mobile/Capture.jsx'
import MobileReports from './screens/mobile/MobileReports.jsx'

const SCREENS = {
  queue: Queue,
  reports: Reports,
  categories: Categories,
  settings: Settings,
  guide: Guide,
}

// Рендерим только активную оболочку (десктоп/мобайл) — брейкпоинт как в styles.css (767px).
function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    mql.addEventListener('change', onChange)
    setMatches(mql.matches)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return matches
}

function Desktop() {
  const { screen } = useApp()
  const Screen = SCREENS[screen] ?? Queue
  return (
    <div className="app">
      <Sidebar />
      <Screen />
    </div>
  )
}

const CAPTURE_TAB = { id: 'capture', label: 'Съёмка', Icon: Camera }
const BASE_TABS = [
  { id: 'queue', label: 'Очередь', Icon: Inbox },
  { id: 'reports', label: 'Отчёты', Icon: BarChart3 },
]
const SETTINGS_TAB = { id: 'settings', label: 'Настройки', Icon: SettingsIcon }
const GUIDE_TAB = { id: 'guide', label: 'Гид', Icon: BookOpen }

function Mobile() {
  const { canEdit } = useApp()
  const tabs = [...(canEdit ? [CAPTURE_TAB] : []), ...BASE_TABS, SETTINGS_TAB, GUIDE_TAB]
  const [tab, setTab] = useState('queue')
  const dark = tab === 'capture'
  return (
    <div className={`mobile ${dark ? 'dark' : 'light'}`}>
      {tab === 'capture' && canEdit && <Capture onOpenQueue={() => setTab('queue')} />}
      {tab === 'queue' && <QueueList mobile />}
      {tab === 'reports' && <MobileReports />}
      {tab === 'settings' && <Settings />}
      {tab === 'guide' && <Guide />}
      <div className="tabbar">
        {tabs.map(({ id, label, Icon }) => (
          <button key={id} className={`tab${tab === id ? ' active' : ''}`} onClick={() => setTab(id)}>
            <Icon size={22} strokeWidth={1.5} />
            <div className="tab-label">{label}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const { currentUser, loading, toast } = useApp()
  const isMobile = useMediaQuery('(max-width: 767px)')

  if (loading) {
    return (
      <div className="auth">
        <div className="auth-card card"><div className="auth-sub">Загрузка…</div></div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <>
        <Register />
        {toast && <div className="toast">{toast}</div>}
      </>
    )
  }

  return (
    <>
      {isMobile ? <Mobile /> : <Desktop />}
      {toast && <div className="toast">{toast}</div>}
    </>
  )
}
