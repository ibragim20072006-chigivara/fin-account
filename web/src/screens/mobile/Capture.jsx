import { useRef, useState } from 'react'
import { useApp } from '../../state.jsx'
import { fileToDataUrl } from '../../image.js'
import NewDocument from '../NewDocument.jsx'

export default function Capture({ onOpenQueue }) {
  const { recognizeAndAdd, showToast } = useApp()
  const [busy, setBusy] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const fileRef = useRef(null)

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      await recognizeAndAdd(await fileToDataUrl(file))
      onOpenQueue()
    } catch (err) {
      showToast(err.message || 'Не удалось распознать документ')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="cap-head">
        <button className="cap-cancel" onClick={onOpenQueue}>Отмена</button>
        <div className="cap-title">Съёмка документа</div>
      </div>

      <div className="viewfinder">
        <div className="vf-corner tl" />
        <div className="vf-corner tr" />
        <div className="vf-corner bl" />
        <div className="vf-corner br" />
        <div className="vf-label">{busy ? 'ИИ распознаёт документ…' : 'наведите на документ целиком'}</div>
        <div className="vf-hint">{busy ? 'подождите несколько секунд' : 'снимок → распознавание → в очередь'}</div>
      </div>

      <button className="cap-manual" onClick={() => setShowNew(true)} disabled={busy}>или ввести вручную</button>
      {showNew && <NewDocument onClose={() => setShowNew(false)} />}

      <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={onFile} />
      <div className="cap-shutter-row">
        <div className="cap-preview"><div className="cap-preview-img" /></div>
        <div className="cap-shutter-wrap">
          <button className="cap-shutter" onClick={() => fileRef.current?.click()} disabled={busy} aria-label="Снять"><div /></button>
        </div>
        <button className="cap-queue-link" onClick={onOpenQueue}>Очередь →</button>
      </div>
    </>
  )
}
