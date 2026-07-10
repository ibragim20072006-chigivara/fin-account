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
    n: 1, eyebrow: 'Шаг 1 · Ввод', title: 'Внесите документ',
    text: 'Три способа добавить накладную, чек, акт или ведомость — выберите удобный. Все они дают одинаковый результат: документ в очереди.',
    methods: ['📷 съёмка · фото + ИИ', '＋ документ · вручную', '⭳ из файла · CSV'],
  },
  {
    n: 2, eyebrow: 'Шаг 2 · Очередь', title: 'Документ ждёт проверки',
    text: 'Все входящие — в одном списке со статусами и фильтрами «Все / Проверить / Готово». Слева перечень, справа разбор выбранного: фото (если снят) или карточка сведений и таблица позиций.',
    status: { tone: 'warning', label: 'проверить' },
  },
  {
    n: 3, eyebrow: 'Шаг 3 · Сверка', title: 'Проверьте позиции и цены',
    text: 'Если у строки нет цены, итог показан неполным («43 060 + ?»), а строка помечена «уточнить цену». Впишите цену — сумма пересчитается. Любую позицию можно отредактировать карандашом или удалить, даже после отгрузки.',
    flag: true,
  },
  {
    n: 4, eyebrow: 'Шаг 4 · Отгрузка', title: 'Отгрузите в учёт',
    text: 'Когда вопросов нет — «отгрузить в учёт» по одному или «Выгрузить готовые» пачкой. Документ становится частью официальных данных, а фото после отгрузки удаляется.',
    status: { tone: 'muted', label: 'отгружено' },
  },
]

const CARDS = [
  { icon: '🏷️', title: 'Категории', text: '«Полочки» для строк: приход или расход. Определяют, как позиция попадёт в отчёты и в выгрузку. Создаёте сами или одной кнопкой из подсказок ИИ.' },
  { icon: '📊', title: 'Отчёты', text: 'ОПиУ и ДДС считаются автоматически по отгруженным документам: приход, расход и выручка (приход минус расход), с разбивкой по статьям.' },
  { icon: '⬇', title: 'Выгрузка CSV', text: 'Готовые данные — одной кнопкой в CSV-отчёт с фиксированными столбцами: дата, контрагент, категория, тип, кол-во, цена, сумма.' },
  { icon: '⚙️', title: 'Настройки', text: 'Скачивание отчёта и управление командой: пригласить сотрудника, сменить роль, удалить. Команда доступна только администратору.' },
]

export default function Guide() {
  return (
    <div className="page">
      <div className="guide">
        <div className="guide-head">
          <div className="page-title">Руководство</div>
          <p className="guide-lede">
            Карьер-менеджер — конвейер для первичных документов: накладную, чек, акт или ведомость
            вносят один раз, программа помогает проверить суммы и категории, а затем цифры сами
            складываются в отчёты и в файл для бухгалтерии.
          </p>
          <div className="guide-roles">
            {ROLE_ORDER.map((r) => (
              <div key={r} className="guide-role"><b>{ROLES[r].label}</b><span>{ROLES[r].hint}</span></div>
            ))}
          </div>
        </div>

        <div className="section-label">Путь документа</div>

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
                    {s.status && <span className={`chip ${s.status.tone}`}>{s.status.label}</span>}
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
                  <p>Готовые документы скачиваются одним CSV с фиксированными столбцами — этот файл несут в бухгалтерию.</p>
                </div>
              </div>
            </div>
          </article>
        </div>

        <div className="section-label">Что помогает вести учёт</div>
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
            <h4>Данные общие для команды</h4>
            <p>Документы, категории и пользователи хранятся на сервере. Вход по токену переживает перезагрузку, а чужие правки подтягиваются автоматически.</p>
          </div>
          <div className="guide-note">
            <h4>Телефон и компьютер</h4>
            <p>Одно приложение. На телефоне — нижние вкладки и отдельная «Съёмка» (камера или фото из галереи), на компьютере — боковое меню. Роль скрывает лишние кнопки.</p>
          </div>
          <div className="guide-note">
            <h4>ИИ помогает, но проверяйте</h4>
            <p>Распознавание с фото и подсказки категорий иногда ошибаются. Перед отгрузкой сверяйте позиции, цены и категории с оригиналом документа.</p>
          </div>
          <div className="guide-note">
            <h4>Фото хранится временно</h4>
            <p>Снимок остаётся у документа только на время проверки — чтобы сверять строки с оригиналом. После отгрузки он удаляется.</p>
          </div>
        </div>

        <div className="guide-legend">
          <div className="guide-legend-item"><span className="chip warning">проверить</span> есть строки без цены</div>
          <div className="guide-legend-item"><span className="chip success">готово</span> все суммы на месте, можно отгружать</div>
          <div className="guide-legend-item"><span className="chip muted">отгружено</span> в учёте и отчётах</div>
        </div>
      </div>
    </div>
  )
}
