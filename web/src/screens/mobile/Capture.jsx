import { useEffect, useState } from 'react'
import NewDocument from '../NewDocument.jsx'

const DOC_TYPES = ['Накладная', 'Чек', 'Ведомость', 'Акт']

export default function Capture({ onOpenQueue }) {
  const [docType, setDocType] = useState('Накладная')
  const [photos, setPhotos] = useState(0)
  const [progress, setProgress] = useState(0)
  const [showNew, setShowNew] = useState(false)

  useEffect(() => {
    if (photos === 0 || progress >= 100) return
    const t = window.setInterval(() => setProgress((p) => Math.min(100, p + 1.6)), 700)
    return () => window.clearInterval(t)
  }, [photos, progress < 100])

  const shoot = () => {
    setPhotos((n) => n + 1)
    setProgress((p) => (p >= 100 ? 8 : Math.max(6, p - 12)))
  }

  const etaSec = Math.max(5, Math.round((100 - progress) * 0.6))

  return (
    <>
      <div className="cap-head">
        <button className="cap-cancel" onClick={onOpenQueue}>Отмена</button>
        <div className="cap-title">Новый документ</div>
      </div>

      <div className="viewfinder">
        <div className="vf-corner tl" />
        <div className="vf-corner tr" />
        <div className="vf-corner bl" />
        <div className="vf-corner br" />
        <div className="vf-label">видоискатель камеры</div>
        <div className="vf-hint">наведите на документ целиком</div>
      </div>

      <div className="cap-chips">
        {DOC_TYPES.map((t) => (
          <button key={t} className={`cap-chip${t === docType ? ' active' : ''}`} onClick={() => setDocType(t)}>
            {t}
          </button>
        ))}
      </div>

      <button className="cap-manual" onClick={() => setShowNew(true)}>или ввести вручную</button>

      {showNew && <NewDocument onClose={() => setShowNew(false)} />}

      <div className="cap-shutter-row">
        <div className="cap-preview">
          <div className="cap-preview-img" />
          {photos > 0 && <div className="cap-preview-badge">{photos}</div>}
        </div>
        <div className="cap-shutter-wrap">
          <button className="cap-shutter" onClick={shoot} aria-label="Снять"><div /></button>
        </div>
        <button className="cap-queue-link" onClick={onOpenQueue}>Очередь →</button>
      </div>

      {photos > 0 && (
        <div className="cap-progress">
          <div className="cap-progress-row">
            <div className="cap-progress-text">
              {progress >= 100
                ? `${photos} фото обработано · смотрите в очереди`
                : `${photos} фото отправлено · ИИ обрабатывает`}
            </div>
            <div className="cap-progress-eta">{progress >= 100 ? 'готово' : `~${etaSec} сек`}</div>
          </div>
          <div className="cap-progress-bar">
            <div className="cap-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
    </>
  )
}
