import { useState } from 'react'
import { useApp } from '../state.jsx'

export default function Templates() {
  const { templates, showToast, canEdit } = useApp()
  const [selectedId, setSelectedId] = useState(templates[0].id)
  const tpl = templates.find((t) => t.id === selectedId) ?? templates[0]

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-title">Шаблоны выгрузки</div>
        <div className="page-sub">формат, в котором отгрузки скачиваются в учёт</div>
        <div className="spacer" />
        {canEdit && <button className="btn-outline-blue" onClick={() => showToast('Загрузите файл-образец — колонки распознаются автоматически')}>+ шаблон из файла</button>}
      </div>

      <div className="split">
        <div className="side-list card">
          {templates.map((t) => (
            <button
              key={t.id}
              className={`tpl-row${t.id === selectedId ? ' selected' : ''}`}
              onClick={() => setSelectedId(t.id)}
            >
              <div className="tpl-row-top">
                <div className="tpl-row-name">{t.name}</div>
                {t.badge === 'основной' && <span className="chip success green-sm">основной</span>}
              </div>
              <div className="tpl-row-meta">{t.meta}</div>
            </button>
          ))}
        </div>

        <div className="detail card">
          <div className="detail-head">
            <div className="detail-title">{tpl.name}</div>
            <div className="page-sub">{tpl.description}</div>
            <div className="spacer" />
            {canEdit && <button className="btn-ghost sm" onClick={() => showToast('Выберите новый файл шаблона — маппинг сохранится')}>заменить файл</button>}
          </div>

          <div className="map-table">
            <div className="map-row head">
              <div>КОЛОНКА ШАБЛОНА</div>
              <div>ОТКУДА БЕРЁТСЯ</div>
            </div>
            {tpl.columns.map((col, i) => (
              <div key={col.key} className="map-row">
                <div className="map-col">{String.fromCharCode(65 + i)} · {col.label}</div>
                <div className="map-src">
                  {col.key === 'account'
                    ? <>счёт категории (<a href="#категории">настроен в категориях</a>)</>
                    : col.source}
                </div>
              </div>
            ))}
          </div>

          <div className="detail-foot">отгрузки скачиваются в этом формате одним CSV-файлом</div>
        </div>
      </div>
    </div>
  )
}
