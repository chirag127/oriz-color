import { useMemo, useState } from 'react'
import {
  type HarmonyKind,
  harmony,
  normalizeHex,
  ramp,
} from '../lib/color'
import { SwatchChip } from './SwatchChip'

const KINDS: HarmonyKind[] = [
  'complementary',
  'analogous',
  'triadic',
  'tetradic',
  'split-complementary',
  'monochromatic',
  'shades',
]

/** Harmony + tint/shade ramp generator, plus optional AI brand palette. */
export function PaletteGen() {
  const [base, setBase] = useState('#1a56ff')
  const [kind, setKind] = useState<HarmonyKind>('analogous')

  const hex = useMemo(() => normalizeHex(base), [base])
  const palette = useMemo(() => (hex ? harmony(hex, kind) : []), [hex, kind])
  const scale = useMemo(() => (hex ? ramp(hex, 5) : []), [hex])

  // ---- AI brand palette (optional) ----
  const [brand, setBrand] = useState('')
  const [aiColors, setAiColors] = useState<string[]>([])
  const [aiState, setAiState] = useState<'idle' | 'thinking' | 'error'>('idle')
  const [aiMsg, setAiMsg] = useState('')

  async function genBrand() {
    if (!brand.trim()) return
    setAiState('thinking')
    setAiMsg('')
    setAiColors([])
    try {
      const { complete } = await import('@chirag127/oz-ai')
      const out = await complete(
        `Brand / mood: "${brand.trim()}". Design a 5-color palette that fits it.`,
        {
          system:
            'You are a color designer. Return ONLY a JSON array of exactly 5 hex color strings, e.g. ["#0a0a0a","#ffffff","#ff4d00","#123456","#e8e8e8"]. No prose, no markdown.',
        },
      )
      const hexes = (out.match(/#[0-9a-fA-F]{6}\b/g) ?? [])
        .map((h) => normalizeHex(h))
        .filter((h): h is string => !!h)
        .slice(0, 8)
      if (hexes.length === 0) throw new Error('no colors parsed')
      setAiColors(hexes)
      setAiState('idle')
    } catch {
      setAiState('error')
      setAiMsg('AI unavailable right now. Core generators above still work.')
    }
  }

  return (
    <div className="panel">
      <div className="plinth">
        <div className="row">
          <div className="field" style={{ flex: '0 0 3.5rem' }}>
            <label htmlFor="palbase">Base</label>
            <input
              id="palbase"
              type="color"
              className="input"
              style={{ height: '2.6rem', padding: 0 }}
              value={hex ?? '#000000'}
              onChange={(e) => setBase(e.target.value)}
            />
          </div>
          <div className="field grow">
            <label htmlFor="palbasetext">Base color</label>
            <input
              id="palbasetext"
              className="input"
              value={base}
              spellCheck={false}
              onChange={(e) => setBase(e.target.value)}
            />
          </div>
          <div className="field grow">
            <label htmlFor="palkind">Harmony</label>
            <select
              id="palkind"
              className="select"
              value={kind}
              onChange={(e) => setKind(e.target.value as HarmonyKind)}
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <section>
        <div className="section-title">
          <h2 style={{ fontSize: '1.1rem' }}>{kind}</h2>
          <span className="hint">click a swatch to copy</span>
        </div>
        {palette.length > 0 ? (
          <div className="grid-swatches" style={{ marginTop: '0.75rem' }}>
            {palette.map((c, i) => (
              <SwatchChip key={`${c}-${i}`} hex={c} />
            ))}
          </div>
        ) : (
          <p className="hint">Enter a valid base color.</p>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: '1.1rem' }}>Tint / shade ramp</h2>
        <div className="grid-swatches" style={{ marginTop: '0.75rem' }}>
          {scale.map((c, i) => (
            <SwatchChip key={`${c}-${i}`} hex={c} />
          ))}
        </div>
      </section>

      <section className="plinth">
        <div className="section-title">
          <h2 style={{ fontSize: '1.1rem' }}>AI brand palette</h2>
          <span className="hint">optional · powered by g4f</span>
        </div>
        <div className="ai-row" style={{ marginTop: '0.75rem' }}>
          <div className="field grow">
            <label htmlFor="brand">Describe a brand or mood</label>
            <input
              id="brand"
              className="input"
              placeholder="e.g. calm coastal wellness studio"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && genBrand()}
            />
          </div>
          <button
            type="button"
            className="btn btn--primary"
            onClick={genBrand}
            disabled={aiState === 'thinking' || !brand.trim()}
          >
            {aiState === 'thinking' ? (
              <>
                <span className="spinner" /> thinking…
              </>
            ) : (
              'Generate'
            )}
          </button>
        </div>
        {aiState === 'error' && <p className="error">{aiMsg}</p>}
        {aiColors.length > 0 && (
          <div className="grid-swatches" style={{ marginTop: '1rem' }}>
            {aiColors.map((c, i) => (
              <SwatchChip key={`${c}-${i}`} hex={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
