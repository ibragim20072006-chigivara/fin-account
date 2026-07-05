import { useState } from 'react'
import { Camera, Inbox, BarChart3 } from 'lucide-react'
import { useApp } from './state.jsx'
import Sidebar from './components/Sidebar.jsx'
import Queue, { QueueList } from './screens/Queue.jsx'
import Reports from './screens/Reports.jsx'
import Categories from './screens/Categories.jsx'
import Templates from './screens/Templates.jsx'
import Settings from './screens/Settings.jsx'
import Capture from './screens/mobile/Capture.jsx'
import MobileReports from './screens/mobile/MobileReports.jsx'

const SCREENS = {
  queue: Queue,
  reports: Reports,
  categories: Categories,
  templates: Templates,
  settings: Settings,
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

const TABS = [
  { id: 'capture', label: 'Съёмка', Icon: Camera },
  { id: 'queue', label: 'Очередь', Icon: Inbox },
  { id: 'reports', label: 'Отчёты', Icon: BarChart3 },
]

function Mobile() {
  const [tab, setTab] = useState('queue')
  const dark = tab === 'capture'
  return (
    <div className={`mobile ${dark ? 'dark' : 'light'}`}>
      {tab === 'capture' && <Capture onOpenQueue={() => setTab('queue')} />}
      {tab === 'queue' && <QueueList mobile />}
      {tab === 'reports' && <MobileReports />}
      <div className="tabbar">
        {TABS.map(({ id, label, Icon }) => (
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
  const { toast } = useApp()
  return (
    <>
      <Desktop />
      <Mobile />
      {toast && <div className="toast">{toast}</div>}
    </>
  )
}
