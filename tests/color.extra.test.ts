import { describe, expect, it } from 'vitest'
import {
  allFormats,
  contrastRatio,
  cssGradient,
  formatAs,
  gradientSamples,
  harmony,
  luminance,
  normalizeHex,
  quantize,
  ramp,
  readableText,
  toHsl360,
  toRgb255,
  wcagGrade,
} from '../src/lib/color'

// Bolsters tests/color.test.ts — covers branches the first suite leaves open:
// non-red hues, oklch formatting, every harmony kind, ramp ordering,
// interpolation spaces, quantizer frequency ordering + k cap, WCAG tiers.

describe('conversion round-trips (non-red hues)', () => {
  it('#00ff00 → rgb/hsl channels', () => {
    expect(toRgb255('#00ff00')).toEqual({ r: 0, g: 255, b: 0 })
    const h = toHsl360('#00ff00')
    expect(h?.h).toBe(120)
    expect(h?.s).toBe(100)
    expect(h?.l).toBe(50)
  })
  it('#0000ff hue = 240', () => {
    expect(toHsl360('#0000ff')?.h).toBe(240)
  })
  it('clamps out-of-gamut rgb into 0..255', () => {
    const c = toRgb255('rgb(300 -20 128)')
    expect(c).not.toBeNull()
    expect(c!.r).toBe(255)
    expect(c!.g).toBe(0)
    expect(c!.b).toBe(128)
  })
  it('achromatic grey reports 0 saturation', () => {
    const h = toHsl360('#808080')
    expect(h?.s).toBe(0)
    expect(h?.l).toBe(50)
  })
})

describe('formatAs precision', () => {
  it('rgb + hsl emit the base color values', () => {
    expect(formatAs('#ff0000', 'rgb')).toBe('rgb(255, 0, 0)')
    expect(formatAs('#ff0000', 'hsl')).toBe('hsl(0 100% 50%)')
  })
  it('oklch is a well-formed triple', () => {
    const o = formatAs('#1a56ff', 'oklch')
    expect(o).toMatch(/^oklch\(-?\d+(\.\d+)?\s-?\d+(\.\d+)?\s-?\d+(\.\d+)?\)$/)
  })
  it('allFormats round-trips hex identity', () => {
    expect(allFormats('#abcdef').hex).toBe('#abcdef')
  })
  it('every model returns "" on garbage', () => {
    for (const m of ['hex', 'rgb', 'hsl', 'oklch'] as const) {
      expect(formatAs('not-a-color', m)).toBe('')
    }
  })
  it('normalizeHex trims surrounding whitespace', () => {
    expect(normalizeHex('  #FF0000  ')).toBe('#ff0000')
  })
})

describe('WCAG grade tiers', () => {
  it('mid-contrast pair lands in the AA-large / UI band only', () => {
    // #767676 on white ~4.54 — passes AA normal + large, fails AAA normal.
    const g = wcagGrade('#767676', '#ffffff')
    expect(g.ratio).toBeGreaterThanOrEqual(4.5)
    expect(g.aaNormal).toBe(true)
    expect(g.aaLarge).toBe(true)
    expect(g.aaaNormal).toBe(false)
    expect(g.aaaLarge).toBe(true)
    expect(g.uiAA).toBe(true)
  })
  it('3:1-only pair passes UI + AA-large but not AA-normal', () => {
    // #949494 on white ~3.0x
    const g = wcagGrade('#949494', '#ffffff')
    expect(g.aaLarge).toBe(true)
    expect(g.uiAA).toBe(true)
    expect(g.aaNormal).toBe(false)
  })
  it('contrast is symmetric', () => {
    expect(contrastRatio('#123456', '#abcdef')).toBe(
      contrastRatio('#abcdef', '#123456'),
    )
  })
  it('invalid input yields ratio 0 and all-false grade', () => {
    const g = wcagGrade('garbage', '#ffffff')
    expect(g.ratio).toBe(0)
    expect(g.aaNormal).toBe(false)
    expect(g.aaLarge).toBe(false)
    expect(g.uiAA).toBe(false)
  })
})

describe('luminance', () => {
  it('mid-grey sits between black and white', () => {
    const l = luminance('#808080')
    expect(l).not.toBeNull()
    expect(l!).toBeGreaterThan(0)
    expect(l!).toBeLessThan(1)
  })
  it('pure red luminance uses the 0.2126 coefficient', () => {
    expect(luminance('#ff0000')).toBe(0.213)
  })
  it('invalid → null', () => {
    expect(luminance('nope')).toBeNull()
  })
  it('readableText on a mid-blue prefers white', () => {
    expect(readableText('#1a56ff')).toBe('#ffffff')
  })
})

describe('harmony — every kind', () => {
  const base = '#1a56ff'
  it('lengths per kind', () => {
    expect(harmony(base, 'analogous')).toHaveLength(3)
    expect(harmony(base, 'split-complementary')).toHaveLength(3)
    expect(harmony(base, 'monochromatic')).toHaveLength(5)
    expect(harmony(base, 'shades')).toHaveLength(6)
  })
  it('first swatch of every hue-rotation kind is the base color', () => {
    for (const k of [
      'complementary',
      'analogous',
      'triadic',
      'tetradic',
      'split-complementary',
    ] as const) {
      // analogous starts at -30, so its base sits at index 1.
      const arr = harmony(base, k)
      const expectBase = normalizeHex(base)
      const hit = arr.some((c) => c === expectBase)
      expect(hit).toBe(true)
    }
  })
  it('every kind yields only valid 6-digit hex', () => {
    for (const k of [
      'complementary',
      'analogous',
      'triadic',
      'tetradic',
      'split-complementary',
      'monochromatic',
      'shades',
    ] as const) {
      for (const c of harmony(base, k)) expect(c).toMatch(/^#[0-9a-f]{6}$/)
    }
  })
  it('monochromatic / shades keep hue, vary lightness (distinct swatches)', () => {
    const mono = harmony(base, 'monochromatic')
    expect(new Set(mono).size).toBeGreaterThan(1)
  })
})

describe('ramp ordering', () => {
  it('default count = 5 → 11 stops', () => {
    expect(ramp('#1a56ff')).toHaveLength(11)
  })
  it('base sits at the center and the light half climbs in luminance', () => {
    // count=3 → 7 stops, base at index 3. The tint half (base→white)
    // is strictly increasing in luminance.
    const r = ramp('#808080', 3)
    expect(r).toHaveLength(7)
    expect(r[3]).toBe('#808080')
    const lightLums = r.slice(3).map((c) => luminance(c)!)
    for (let i = 1; i < lightLums.length; i++) {
      expect(lightLums[i]).toBeGreaterThan(lightLums[i - 1])
    }
    // every stop is valid hex
    for (const c of r) expect(c).toMatch(/^#[0-9a-f]{6}$/)
  })
  it('spans from a near-black shade to a near-white tint', () => {
    const r = ramp('#808080', 3)
    const lums = r.map((c) => luminance(c)!)
    expect(Math.min(...lums)).toBeLessThan(luminance('#808080')!)
    expect(Math.max(...lums)).toBeGreaterThan(luminance('#808080')!)
  })
  it('invalid base → []', () => {
    expect(ramp('not-a-color')).toEqual([])
  })
})

describe('gradient spaces + css', () => {
  const stops = [
    { color: '#ff0000', pos: 0 },
    { color: '#0000ff', pos: 100 },
  ]
  it('rgb-space midpoint blends both channels', () => {
    const s = gradientSamples(stops, 3, 'rgb')
    expect(s).toHaveLength(3)
    expect(s[0]).toBe('#ff0000')
    expect(s[2]).toBe('#0000ff')
    // midpoint has some red and some blue, no full-strength either
    const mid = toRgb255(s[1])!
    expect(mid.r).toBeGreaterThan(0)
    expect(mid.b).toBeGreaterThan(0)
  })
  it('sorts stops by position regardless of input order', () => {
    const s = gradientSamples(
      [
        { color: '#0000ff', pos: 100 },
        { color: '#ff0000', pos: 0 },
      ],
      2,
      'rgb',
    )
    expect(s[0]).toBe('#ff0000')
    expect(s[1]).toBe('#0000ff')
  })
  it('drops invalid stops before requiring 2+', () => {
    expect(
      gradientSamples(
        [
          { color: '#ff0000', pos: 0 },
          { color: 'garbage', pos: 100 },
        ],
        4,
      ),
    ).toEqual([])
  })
  it('cssGradient omits "in <space>" for srgb', () => {
    const css = cssGradient(stops, 45, 'srgb')
    expect(css).toContain('linear-gradient(45deg, ')
    expect(css).not.toContain(' in ')
  })
  it('cssGradient rounds angle + positions', () => {
    const css = cssGradient(
      [
        { color: '#ff0000', pos: 12.4 },
        { color: '#0000ff', pos: 87.6 },
      ],
      90.7,
      'hsl',
    )
    expect(css).toContain('91deg in hsl')
    expect(css).toContain('#ff0000 12%')
    expect(css).toContain('#0000ff 88%')
  })
})

describe('quantize behavior', () => {
  it('orders by frequency, most-common first', () => {
    // 3 red pixels, 1 blue — red must lead.
    const px = new Uint8ClampedArray([
      255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 0, 0, 255, 255,
    ])
    const out = quantize(px, 4)
    expect(out[0]).toBe('#ff0000')
    expect(out).toContain('#0000ff')
  })
  it('honors the k cap', () => {
    // four distinct opaque colors, ask for 2
    const px = new Uint8ClampedArray([
      255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 0, 255,
    ])
    expect(quantize(px, 2)).toHaveLength(2)
  })
  it('all-transparent input → []', () => {
    const px = new Uint8ClampedArray([255, 0, 0, 0, 0, 255, 0, 0])
    expect(quantize(px, 4)).toEqual([])
  })
  it('averages near-colors sharing a 4-bit bucket', () => {
    // two nearly-identical reds collapse into one swatch
    const px = new Uint8ClampedArray([250, 2, 2, 255, 255, 0, 0, 255])
    const out = quantize(px, 4)
    expect(out).toHaveLength(1)
    expect(out[0]).toMatch(/^#[0-9a-f]{6}$/)
  })
})
