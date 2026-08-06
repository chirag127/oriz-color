import { useEffect, useRef, useState } from 'react'
import { quantize } from '../lib/color'
import { SwatchChip } from './SwatchChip'

/** Extract a palette from an uploaded image via canvas quantize. No upload. */
export function ExtractPalette() {
  const [preview, setPreview] = useState<string | null>(null)
  const [palette, setPalette] = useState<string[]>([])
  const [count, setCount] = useState(6)
  const [state, setState] = useState<'idle' | 'working' | 'error'>('idle')
  const [err, setErr] = useState('')
  const dropRef = useRef<HTMLLabelElement>(null)
  const lastFile = useRef<File | null>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setState('error')
      setErr('That is not an image file.')
      return
    }
    lastFile.current = file
    setState('working')
    setErr('')
    try {
      const { readAsDataURL } = await import('@chirag127/oz-file')
      const url = await readAsDataURL(file)
      setPreview(url)
      const colors = await extractFromDataUrl(url, count)
      setPalette(colors)
      setState('idle')
    } catch {
      setState('error')
      setErr('Could not read that image.')
    }
  }

  // re-extract when count changes and we have an image
  useEffect(() => {
    if (!preview) return
    let cancelled = false
    ;(async () => {
      setState('working')
      try {
        const colors = await extractFromDataUrl(preview, count)
        if (!cancelled) {
          setPalette(colors)
          setState('idle')
        }
      } catch {
        if (!cancelled) setState('idle')
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])

  // drag-drop via shared oz-file
  useEffect(() => {
    const el = dropRef.current
    if (!el) return
    let teardown = () => {}
    ;(async () => {
      const { onDropZone } = await import('@chirag127/oz-file')
      teardown = onDropZone(el, (files) => {
        if (files[0]) handleFile(files[0])
      })
    })()
    return () => teardown()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="panel">
      <label ref={dropRef} className="dropzone" htmlFor="imgin">
        <input
          id="imgin"
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
          }}
        />
        {state === 'working' ? (
          <span>
            <span className="spinner" /> reading pixels…
          </span>
        ) : preview ? (
          'Drop another image, or click to choose'
        ) : (
          'Drop an image here, or click to choose — nothing leaves your browser'
        )}
      </label>

      {state === 'error' && <p className="error">{err}</p>}

      {preview && (
        <>
          <img className="preview-img" src={preview} alt="uploaded preview" />
          <div className="plinth">
            <div className="field" style={{ maxWidth: '18rem' }}>
              <label htmlFor="excount">Colors: {count}</label>
              <input
                id="excount"
                type="range"
                min={3}
                max={12}
                value={count}
                onChange={(e) => setCount(+e.target.value)}
              />
            </div>
          </div>
          <section>
            <div className="section-title">
              <h2 style={{ fontSize: '1.05rem' }}>Extracted palette</h2>
              <span className="hint">click to copy</span>
            </div>
            <div className="grid-swatches" style={{ marginTop: '0.75rem' }}>
              {palette.map((c, i) => (
                <SwatchChip key={`${c}-${i}`} hex={c} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

/** Draw to an offscreen canvas (downscaled) and quantize. */
async function extractFromDataUrl(url: string, k: number): Promise<string[]> {
  const img = await loadImage(url)
  const max = 220
  const scale = Math.min(1, max / Math.max(img.width, img.height))
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('no 2d context')
  ctx.drawImage(img, 0, 0, w, h)
  const { data } = ctx.getImageData(0, 0, w, h)
  return quantize(data, k)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}
