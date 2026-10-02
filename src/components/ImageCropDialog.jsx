import { useCallback, useEffect, useState } from 'react'
import Cropper from 'react-easy-crop'
import { Check, X } from 'lucide-react'
import { cx } from '../lib/utils'
import { VoidButton } from './ui'

const ASPECTS = [
  { label: 'Square', value: 1 },
  { label: 'Landscape', value: 4 / 3 },
  { label: 'Wide', value: 16 / 9 },
  { label: 'Portrait', value: 3 / 4 },
]

/** Draws the selected crop region onto a canvas and returns it as a JPEG
    Blob — this is what actually gets uploaded, not the original file. */
function getCroppedBlob(imageUrl, cropPixels) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(cropPixels.width)
      canvas.height = Math.round(cropPixels.height)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(
        img,
        cropPixels.x,
        cropPixels.y,
        cropPixels.width,
        cropPixels.height,
        0,
        0,
        canvas.width,
        canvas.height
      )
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Could not crop that image.'))),
        'image/jpeg',
        0.92
      )
    }
    img.onerror = () => reject(new Error('Could not read that image.'))
    img.src = imageUrl
  })
}

/** Full-screen crop step shown after picking a file and before it uploads —
    drag to reposition, scroll/pinch (or the slider) to zoom, pick a shape.
    `onConfirm(blob)` receives the cropped result as a ready-to-upload JPEG
    Blob; `confirmLabel` lets the caller decide whether this is the last
    step ("Crop & upload") or leads into a further review step
    ("Crop & continue"). */
export default function ImageCropDialog({ file, defaultAspect = 4 / 3, confirmLabel = 'Crop & upload', busy, onCancel, onConfirm }) {
  const [imageUrl, setImageUrl] = useState('')
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [aspect, setAspect] = useState(defaultAspect)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setImageUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const onCropComplete = useCallback((_area, pixels) => setCroppedAreaPixels(pixels), [])

  const confirm = async () => {
    if (!croppedAreaPixels) return
    setError('')
    try {
      const blob = await getCroppedBlob(imageUrl, croppedAreaPixels)
      onConfirm(blob)
    } catch (err) {
      setError(err.message || 'Could not crop that image.')
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-void-000/90 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg border border-silver/15 bg-void-100 p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="metal font-display text-xl">Crop this photo</h3>
          <button onClick={onCancel} aria-label="Cancel" className="text-silver-lo transition-colors hover:text-flare">
            <X size={16} />
          </button>
        </div>

        <div className="relative h-72 w-full overflow-hidden border border-silver/10 bg-void-000 sm:h-80">
          {imageUrl && (
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {ASPECTS.map((a) => (
            <button
              key={a.label}
              onClick={() => setAspect(a.value)}
              className={cx(
                'border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-widest2 transition-colors',
                aspect === a.value
                  ? 'border-flare bg-flare text-void-000'
                  : 'border-silver/15 text-silver-mid hover:border-silver/40 hover:text-silver-hi'
              )}
            >
              {a.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest2 text-silver-lo">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-flare"
          />
        </div>

        {error && <p className="mt-3 text-xs text-flare">{error}</p>}

        <div className="mt-5 flex gap-3">
          <VoidButton size="sm" onClick={confirm} disabled={busy}>
            <Check size={13} /> {busy ? 'Working…' : confirmLabel}
          </VoidButton>
          <VoidButton size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </VoidButton>
        </div>
      </div>
    </div>
  )
}
