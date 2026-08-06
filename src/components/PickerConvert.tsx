import { useMemo, useState } from 'react'
import { allFormats, normalizeHex, readableText } from '../lib/color'
import { useCopy } from './useCopy'

const SEED = '#1a56ff'

/** Picker + live 4-format convert (hex / rgb / hsl / oklch). */
export function PickerConvert() {
  const [text, setText] = useState(SEED)
  const [copied, copy] = useCopy()

  const hex = useMemo(() => normalizeHex(text), [text])
  const formats = useMemo(
    () => (hex ? allFormats(hex) : null),
    [hex],
  )

  return (
    <div className="panel">
      <div className="swatch-hero">
        <div
          className="swatch-face"
          style={{ background: hex ?? '#cccccc' }}
        >
          <input
            type="color"
            aria-label="Pick a color"
            value={hex ?? '#cccccc'}
            onChange={(e) => setText(e.target.value)}
          />
          <span className="swatch-face__hint">click to pick</span>
        </div>

        <div className="readouts">
          <div className="field">
            <label htmlFor="anyinput">Any CSS color</label>
            <input
              id="anyinput"
              className="input"
              value={text}
              spellCheck={false}
              placeholder="#1a56ff · rgb(26 86 255) · hsl(224 100% 55%) · rebeccapurple"
              onChange={(e) => setText(e.target.value)}
              style={{
                borderColor: text && !hex ? '#c0392b' : undefined,
              }}
            />
            {text && !hex && (
              <span className="error">Not a valid color.</span>
            )}
          </div>

          {formats &&
            (['hex', 'rgb', 'hsl', 'oklch'] as const).map((k) => (
              <div className="readout" key={k}>
                <span className="readout__key">{k}</span>
                <span className="readout__val">{formats[k]}</span>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => copy(k, formats[k])}
                  title={`Copy ${k}`}
                >
                  {copied === k ? '✓' : 'copy'}
                </button>
              </div>
            ))}

          {hex && (
            <div
              style={{
                marginTop: '0.5rem',
                padding: '0.6rem 0.8rem',
                borderRadius: '0.5rem',
                background: hex,
                color: readableText(hex),
                fontFamily: 'var(--oz-font-mono)',
                fontSize: '0.85rem',
              }}
            >
              Readable text auto-picks {readableText(hex)} on this color.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
