import { ROLES, ROLE_ORDER } from '../data.js'

const Arrow = () => (
  <div className="guide-arrow" aria-hidden="true">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2v11M3.5 8.5 8 13l4.5-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
)

const STAGES = [
  {
    n: 1, eyebrow: 'Ввод', title: 'Документ попадает в систему',
    text: 'Три способа внести накладную, чек, акт или ведомость.',
    status: { tone: 'neutral', label: 'в обработке' },
    methods: ['📷 съёмка · демо', '＋ документ · вручную', '⭳ из файла · CSV'],
  },
  {
    n: 2, eyebrow: 'Очередь', title: 'Общий лоток входящих',
    text: 'Все документы в одном списке. Слева — перечень со статусами, справа — разбор выбранного: фото и распознанные строки.',
    status: { tone: 'warning', label: 'проверить' },
  },
  {
    n: 3, eyebrow: 'Сверка', title: 'Бухгалтер проверяет строки',
    text: 'Если система не уверена в цене — итог показывается неполным («43 060 + ?»). Выбрал верную цену → строка исправлена, сумма пересчитана.',
    status: { tone: 'success', label: 'готово' },
    flag: true,
  },
  {
    n: 4, eyebrow: 'Отгрузка', title: '«Отгрузить в учёт»',
    text: 'Когда вопросов нет — документ отгружается и становится частью официальных данных. Можно по одному или все готовые сразу.',
    status: { tone: 'muted', label: 'отгружено' },
  },
]

const CARDS = [
  { icon: '🏷️', title: 'Категории', text: '«Полочки» для строк: приход или расход. Определяют, как строка попадёт в отчёт — Приход, Расход и Выручка.' },
  { icon: '▦', title: 'Шаблоны', text: 'Шапка файла выгрузки: какие столбцы, в каком порядке и как названы. Активный шаблон — формат скачиваемого CSV.' },
  { icon: '⚙️', title: 'Настройки', text: 'Кнопка скачивания выгрузки и управление командой (добавить, сменить роль, удалить) — только у администратора.' },
]

export default function Guide() {
  return (
    <div className="page">
      <div className="guide">
        <div className="guide-head">
          <div className="page-title">Руководство</div>
          <p className="guide-lede">
            Приложение — конвейер для первичных документов: от того, как накладную или чек внесли,
            до того, как цифры легли в отчёт и в файл для бухгалтерии.
          </p>
          <div className="guide-roles">
            {ROLE_ORDER.map((r) => (
              <div key={r} className="guide-role"><b>{ROLES[r].label}</b><span>{ROLES[r].hint}</span></div>
            ))}
          </div>
        </div>

        <div className="section-label">Конвейер документа</div>

        <div className="guide-flow">
          {STAGES.map((s, i) => (
            <div key={s.n}>
              <article className="guide-stage card">
                <div className="guide-num">{s.n}</div>
                <div>
                  <div className="guide-stage-head">
                    <div>
                      <div className="guide-eyebrow">{s.eyebrow}</div>
                      <div className="guide-stage-title">{s.title}</div>
                    </div>
                    <span className={`chip ${s.status.tone}`}>{s.status.label}</span>
                  </div>
                  <p className="guide-stage-text">{s.text}</p>
                  {s.methods && (
                    <div className="guide-chips">
                      {s.methods.map((m) => <span key={m} className="guide-method">{m}</span>)}
                    </div>
                  )}
                  {s.flag && (
                    <div className="guide-chips">
                      <span className="chip-red">уточнить цену</span>
                      <span className="guide-then">→</span>
                      <span className="chip success">исправлено</span>
                    </div>
                  )}
                </div>
              </article>
              {i < STAGES.length && <Arrow />}
            </div>
          ))}

          <article className="guide-stage card">
            <div className="guide-num">5</div>
            <div>
              <div className="guide-stage-head">
                <div>
                  <div className="guide-eyebrow">Итог</div>
                  <div className="guide-stage-title">Куда попадают отгруженные данные</div>
                </div>
              </div>
              <div className="guide-branch">
                <div className="guide-branch-box">
                  <div className="guide-bb-title"><span className="guide-dot" />Отчёты</div>
                  <p>Складываются в ОПиУ (приход и выручка) и ДДС (движение денег). Клик по статье показывает документы-источники.</p>
                </div>
                <div className="guide-branch-box">
                  <div className="guide-bb-title"><span className="guide-dot" />Файл выгрузки</div>
                  <p>Скачиваются одним CSV по активному шаблону — этот файл несут в 1С.</p>
                </div>
              </div>
            </div>
          </article>
        </div>

        <div className="section-label">Что настраивает конвейер</div>
        <div className="guide-cards">
          {CARDS.map((c) => (
            <div key={c.title} className="card guide-card">
              <div className="guide-card-icon">{c.icon}</div>
              <h3>{c.title}</h3>
              <p>{c.text}</p>
            </div>
          ))}
        </div>

        <div className="section-label">Полезно знать</div>
        <div className="guide-notes">
          <div className="guide-note">
            <h4>Где хранятся данные</h4>
            <p>Пользователи и шаблоны сохраняются в браузере. Очередь документов пока живёт в памяти — обновление страницы её очищает.</p>
          </div>
          <div className="guide-note">
            <h4>Телефон и компьютер</h4>
            <p>Одно приложение. На телефоне — нижние вкладки, на компьютере — боковое меню. Роль скрывает лишние кнопки.</p>
          </div>
        </div>

        <div className="guide-legend">
          <div className="guide-legend-item"><span className="chip neutral">в обработке</span> распознаётся</div>
          <div className="guide-legend-item"><span className="chip warning">проверить</span> есть спорные строки</div>
          <div className="guide-legend-item"><span className="chip success">готово</span> можно отгружать</div>
          <div className="guide-legend-item"><span className="chip muted">отгружено</span> в учёте</div>
        </div>
      </div>
    </div>
  )
}
