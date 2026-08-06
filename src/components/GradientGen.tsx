import { useMemo, useState } from 'react'
import {
  type GradientStop,
  cssGradient,
  gradientSamples,
  normalizeHex,
} from '../lib/color'
import { useCopy } from './useCopy'
import { SwatchChip } from './SwatchChip'

type Space = 'oklch' | 'oklab' | 'hsl' | 'srgb'

/** Multi-stop gradient generator with oklch-smooth interpolation + CSS export. */
export function GradientGen() {
  const [stops, setStops] = useState<GradientStop[]>([
    { color: '#1a56ff', pos: 0 },
    { color: '#ff4d6d', pos: 100 },
  ])
  const [angle, setAngle] = useState(90)
  const [space, setSpace] = useState<Space>('oklch')
  const [steps, setSteps] = useState(8)
  const [copied, copy] = useCopy()

  const css = useMemo(
    () => cssGradient(stops, angle, space),
    [stops, angle, space],
  )
  const swatches = useMemo(
    () =>
      gradientSamples(
        stops,
        steps,
        space === 'srgb' ? 'rgb' : (space as 'oklch' | 'oklab' | 'hsl'),
      ),
    [stops, steps, space],
  )

  function setStop(i: number, patch: Partial<GradientStop>) {
    setStops((s) => s.map((st, idx) => (idx === i ? { ...st, ...patch } : st)))
  }
  function addStop() {
    setStops((s) => [...s, { color: '#ffd000', pos: 50 }])
  }
  function removeStop(i: number) {
    setStops((s) => (s.length > 2 ? s.filter((_, idx) => idx !== i) : s))
  }

  return (
    <div className="panel">
      <div className="gradient-preview" style={{ background: css }} />

      <div className="plinth">
        <div className="row" style={{ marginBottom: '1rem' }}>
          <div className="field" style={{ flex: '1 1 8rem' }}>
            <label htmlFor="gangle">Angle {angle}°</label>
            <input
              id="gangle"
              type="range"
              min={0}
              max={360}
              value={angle}
              onChange={(e) => setAngle(+e.target.value)}
            />
          </div>
          <div className="field" style={{ flex: '1 1 8rem' }}>
            <label htmlFor="gspace">Interpolation</label>
            <select
              id="gspace"
              className="select"
              value={space}
              onChange={(e) => setSpace(e.target.value as Space)}
            >
              <option value="oklch">oklch (smoothest)</option>
              <option value="oklab">oklab</option>
              <option value="hsl">hsl</option>
              <option value="srgb">srgb</option>
            </select>
          </div>
          <div className="field" style={{ flex: '1 1 6rem' }}>
            <label htmlFor="gsteps">Sample steps {steps}</label>
            <input
              id="gsteps"
              type="range"
              min={3}
              max={16}
              value={steps}
              onChange={(e) => setSteps(+e.target.value)}
            />
          </div>
        </div>

        <div className="stop-list">
          {stops.map((st, i) => {
            const hex = normalizeHex(st.color) ?? '#000000'
            return (
              <div className="stop" key={i}>
                <input
                  type="color"
                  aria-label={`Stop ${i + 1} color`}
                  value={hex}
                  onChange={(e) => setStop(i, { color: e.target.value })}
                />
                <input
                  className="input"
                  aria-label={`Stop ${i + 1} value`}
                  value={st.color}
                  spellCheck={false}
                  onChange={(e) => setStop(i, { color: e.target.value })}
                />
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={100}
                  aria-label={`Stop ${i + 1} position`}
                  value={st.pos}
                  onChange={(e) =>
                    setStop(i, { pos: Math.min(100, Math.max(0, +e.target.value)) })
                  }
                />
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => removeStop(i)}
                  disabled={stops.length <= 2}
                  title="Remove stop"
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>

        <button
          type="button"
          className="btn"
          style={{ marginTop: '0.75rem' }}
          onClick={addStop}
        >
          + add stop
        </button>
      </div>

      <div className="plinth">
        <div className="section-title">
          <h2 style={{ fontSize: '1.05rem' }}>CSS</h2>
          <button
            type="button"
            className="btn"
            onClick={() => copy('css', `background: ${css};`)}
          >
            {copied === 'css' ? 'copied ✓' : 'copy'}
          </button>
        </div>
        <code
          className="readout__val"
          style={{ display: 'block', marginTop: '0.6rem' }}
        >
          background: {css};
        </code>
      </div>

      <section>
        <div className="section-title">
          <h2 style={{ fontSize: '1.05rem' }}>Sampled stops</h2>
          <span className="hint">click to copy each</span>
        </div>
        <div className="grid-swatches" style={{ marginTop: '0.75rem' }}>
          {swatches.map((c, i) => (
            <SwatchChip key={`${c}-${i}`} hex={c} />
          ))}
        </div>
      </section>
    </div>
  )
}
