// Читает файл изображения, ужимает через canvas и возвращает data URL (JPEG) —
// меньше трафик/цена распознавания; фото временно хранится в документе до отгрузки.
export function fileToDataUrl(file, maxSide = 1200, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
      const w = Math.max(1, Math.round(img.width * scale))
      const h = Math.max(1, Math.round(img.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Не удалось прочитать изображение')) }
    img.src = url
  })
}

// Снимает текущий кадр <video> (живая камера), ужимает через canvas и возвращает JPEG data URL.
export function videoToDataUrl(video, maxSide = 1600, quality = 0.85) {
  const vw = video.videoWidth
  const vh = video.videoHeight
  if (!vw || !vh) throw new Error('Камера ещё не готова')
  const scale = Math.min(1, maxSide / Math.max(vw, vh))
  const w = Math.max(1, Math.round(vw * scale))
  const h = Math.max(1, Math.round(vh * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d').drawImage(video, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', quality)
}
