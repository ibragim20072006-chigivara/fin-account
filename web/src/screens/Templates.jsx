import { useState } from 'react'
import { useApp } from '../state.jsx'

export default function Templates() {
  const { templates, showToast } = useApp()
  const [selectedId, setSelectedId] = useState(templates[0].id)
  const tpl = templates.find((t) => t.id === selectedId)

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-title">Шаблоны выгрузки</div>
        <div className="page-sub">формат, в котором отгрузки уходят в учёт</div>
        <div className="spacer" />
        <button className="btn-outline-blue" onClick={() => showToast('Загрузите файл-образец — колонки распознаются автоматически')}>+ шаблон из файла</button>
      </div>

      <div className="split">
        <div className="side-list card">
          {templates.map((t) => (
            <button
              key={t.id}
              className={`tpl-row${t.id === selectedId ? ' selected' : ''}${t.archived ? ' archived' : ''}`}
              onClick={() => setSelectedId(t.id)}
            >
              <div className="tpl-row-top">
                <div className="tpl-row-name">{t.name}</div>
                {t.badge === 'основной' && <span className="chip success green-sm">основной</span>}
                {t.badge === 'архив' && <span className="chip muted green-sm">архив</span>}
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
            <button className="btn-ghost sm" onClick={() => showToast('Выберите новый файл шаблона — маппинг сохранится')}>заменить файл</button>
          </div>

          <div className="map-table">
            <div className="map-row head">
              <div>КОЛОНКА ШАБЛОНА</div>
              <div>ОТКУДА БЕРЁТСЯ</div>
            </div>
            {tpl.mapping.map(([col, src]) => (
              <div key={col} className="map-row">
                <div className="map-col">{col}</div>
                <div className="map-src">
                  {src.includes('настроен в категориях')
                    ? <>счёт категории (<a href="#категории">настроен в категориях</a>)</>
                    : src}
                </div>
              </div>
            ))}
          </div>

          <div className="field">
            <div className="section-label">КАК ВЫГЛЯДИТ СТРОКА · НАКЛАДНАЯ №214</div>
            <div className="example-box" style={{ marginTop: 8 }}>{tpl.example}</div>
          </div>

          <div className="detail-foot">{tpl.footer}</div>
        </div>
      </div>
    </div>
  )
}
