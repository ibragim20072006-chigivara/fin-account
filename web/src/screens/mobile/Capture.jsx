import { useEffect, useRef, useState } from 'react'
import { useApp } from '../../state.jsx'
import { videoToDataUrl } from '../../image.js'
import NewDocument from '../NewDocument.jsx'

export default function Capture({ onOpenQueue }) {
  const { recognizeAndAdd, showToast } = useApp()
  const [busy, setBusy] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [camError, setCamError] = useState('')
  const [preview, setPreview] = useState(null) // снятый кадр на подтверждение (dataURL)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCamError('Камера недоступна в этом браузере')
        return
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        })
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      } catch (err) {
        if (!cancelled) setCamError(err?.name === 'NotAllowedError' ? 'Нет доступа к камере' : 'Камера недоступна')
      }
    })()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  // Затвор только снимает кадр — распознаём после подтверждения (экономим вызовы GigaChat).
  const snap = () => {
    if (busy || camError) return
    try {
      setPreview(videoToDataUrl(videoRef.current))
    } catch (err) {
      showToast(err.message || 'Камера ещё не готова')
    }
  }

  const confirm = async () => {
    if (busy || !preview) return
    setBusy(true)
    try {
      await recognizeAndAdd(preview)
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
        {camError ? (
          <div className="cap-noaccess">
            <div className="cap-noaccess-title">{camError}</div>
            <div className="cap-noaccess-text">Разрешите доступ к камере в браузере, либо добавьте фото из галереи в разделе «Очередь».</div>
          </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline muted />
            {preview && <img className="cap-shot" src={preview} alt="снимок" />}
            {!preview && (
              <>
                <div className="vf-corner tl" />
                <div className="vf-corner tr" />
                <div className="vf-corner bl" />
                <div className="vf-corner br" />
                <div className="vf-hint">наведите на документ целиком</div>
              </>
            )}
          </>
        )}
        {busy && <div className="cap-busy">ИИ распознаёт документ…</div>}
      </div>

      {!preview && <button className="cap-manual" onClick={() => setShowNew(true)} disabled={busy}>или ввести вручную</button>}
      {showNew && <NewDocument onClose={() => setShowNew(false)} />}

      {preview ? (
        <div className="cap-confirm-row">
          <button className="cap-retake" onClick={() => setPreview(null)} disabled={busy}>Переснять</button>
          <button className="cap-recognize" onClick={confirm} disabled={busy}>{busy ? 'Распознаю…' : 'Распознать'}</button>
        </div>
      ) : (
        <div className="cap-shutter-row">
          <div className="cap-shutter-side" />
          <div className="cap-shutter-wrap">
            {!camError && (
              <button className="cap-shutter" onClick={snap} aria-label="Снять"><div /></button>
            )}
          </div>
          <button className="cap-queue-link cap-shutter-side" onClick={onOpenQueue}>Очередь →</button>
        </div>
      )}
    </>
  )
}
