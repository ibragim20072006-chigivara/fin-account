import { useApp } from '../state.jsx'
import { Segment, Toggle } from '../components/ui.jsx'
import { team } from '../data.js'

export default function Settings() {
  const { notifications, toggleNotification, exportMode, setExportMode, showToast } = useApp()

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-title">Настройки</div>
      </div>

      <div className="settings-col">
        <div className="settings-card card">
          <div className="settings-card-title">Выгрузка в учёт</div>
          <div className="settings-row">
            <div className="settings-row-label">Куда уходит файл</div>
            <div className="settings-value">на почту бухгалтерии · buh@karier-yug.ru</div>
            <button className="link" style={{ fontSize: '12.5px' }} onClick={() => showToast('Укажите новый адрес или папку выгрузки')}>изменить</button>
          </div>
          <div className="settings-row">
            <div className="settings-row-label">Когда отправлять</div>
            <Segment
              small
              items={[
                { value: 'instant', label: 'сразу при отгрузке' },
                { value: 'daily', label: 'раз в день, 18:00' },
              ]}
              value={exportMode}
              onChange={setExportMode}
            />
          </div>
        </div>

        <div className="team-card card">
          <div className="team-head">
            <div className="settings-card-title">Команда</div>
            <div className="spacer" />
            <button className="btn-outline-blue" style={{ padding: '5px 11px' }} onClick={() => showToast('Ссылка-приглашение скопирована')}>+ пригласить</button>
          </div>
          {team.map((m) => (
            <div key={m.name} className="team-row">
              <div className="avatar lg">{m.initials}</div>
              <div className="team-name">{m.name}</div>
              <div className="team-role">{m.role}</div>
              <div className="team-rights">{m.rights}</div>
              <div className="spacer" />
              <button className="team-link" onClick={() => showToast(`Права: ${m.rights}`)}>права</button>
            </div>
          ))}
        </div>

        <div className="team-card card">
          <div className="settings-card-title" style={{ paddingBottom: 10 }}>Уведомления в Telegram</div>
          {notifications.map((n) => (
            <div key={n.id} className="notif-row">
              <div className="notif-label">{n.label}</div>
              <Toggle on={n.on} onChange={() => toggleNotification(n.id)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
