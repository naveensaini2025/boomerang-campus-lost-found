/**
 * Compress an image in the browser with canvas.
 * Keeps photos small enough for localStorage (max 600px, JPEG ~75%).
 */
export function compressImage(file, maxSize = 600, quality = 0.75) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file selected'))
    if (!file.type.startsWith('image/')) return reject(new Error('Please choose an image file'))

    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read that image'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Could not open that image'))
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}
