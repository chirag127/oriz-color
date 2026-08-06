import { useMemo, useState } from 'react'
import { normalizeHex, wcagGrade } from '../lib/color'

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`badge ${ok ? 'badge--pass' : 'badge--fail'}`}>
      {label} {ok ? 'PASS' : 'fail'}
    </span>
  )
}

/** WCAG 2.1 contrast checker with live pass/fail matrix. */
export function ContrastChecker() {
  const [fg, setFg] = useState('#14140f')
  const [bg, setBg] = useState('#fbfbfa')

  const fgHex = normalizeHex(fg) ?? '#000000'
  const bgHex = normalizeHex(bg) ?? '#ffffff'
  const grade = useMemo(() => wcagGrade(fgHex, bgHex), [fgHex, bgHex])

  function swap() {
    setFg(bg)
    setBg(fg)
  }

  return (
    <div className="panel">
      <div className="plinth">
        <div className="row">
          <div className="field" style={{ flex: '0 0 3.5rem' }}>
            <label htmlFor="cfgc">Text</label>
            <input
              id="cfgc"
              type="color"
              className="input"
              style={{ height: '2.6rem', padding: 0 }}
              value={fgHex}
              onChange={(e) => setFg(e.target.value)}
            />
          </div>
          <div className="field grow">
            <label htmlFor="cfg">Text color</label>
            <input
              id="cfg"
              className="input"
              value={fg}
              spellCheck={false}
              onChange={(e) => setFg(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn"
            onClick={swap}
            title="Swap text / background"
          >
            ⇅ swap
          </button>
          <div className="field" style={{ flex: '0 0 3.5rem' }}>
            <label htmlFor="cbgc">Bg</label>
            <input
              id="cbgc"
              type="color"
              className="input"
              style={{ height: '2.6rem', padding: 0 }}
              value={bgHex}
              onChange={(e) => setBg(e.target.value)}
            />
          </div>
          <div className="field grow">
            <label htmlFor="cbg">Background</label>
            <input
              id="cbg"
              className="input"
              value={bg}
              spellCheck={false}
              onChange={(e) => setBg(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div
        className="contrast-stage"
        style={{ background: bgHex, color: fgHex, borderColor: 'transparent' }}
      >
        <span className="ratio-big">{grade.ratio}:1</span>
        <h3>Big heading sample</h3>
        <p>
          The quick brown fox jumps over the lazy dog — body copy at a normal
          reading size to judge legibility on this pairing.
        </p>
      </div>

      <div className="plinth">
        <div className="badges">
          <Badge ok={grade.aaNormal} label="AA normal" />
          <Badge ok={grade.aaLarge} label="AA large" />
          <Badge ok={grade.aaaNormal} label="AAA normal" />
          <Badge ok={grade.aaaLarge} label="AAA large" />
          <Badge ok={grade.uiAA} label="UI / graphics 3:1" />
        </div>
        <p className="hint" style={{ marginTop: '0.75rem' }}>
          AA normal ≥ 4.5:1 · AA large / AAA large ≥ 3:1 / 4.5:1 · AAA normal ≥
          7:1 · UI components ≥ 3:1 (WCAG 2.1).
        </p>
      </div>
    </div>
  )
}
