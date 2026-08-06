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

describe('parse + normalize', () => {
  it('normalizes named / rgb / hsl to hex', () => {
    expect(normalizeHex('white')).toBe('#ffffff')
    expect(normalizeHex('rgb(255 0 0)')).toBe('#ff0000')
    expect(normalizeHex('#1a56ff')).toBe('#1a56ff')
  })
  it('returns null for garbage', () => {
    expect(normalizeHex('not-a-color')).toBeNull()
    expect(toRgb255('nope')).toBeNull()
    expect(toHsl360('')).toBeNull()
  })
  it('rgb + hsl channels', () => {
    expect(toRgb255('#ff0000')).toEqual({ r: 255, g: 0, b: 0 })
    const h = toHsl360('#ff0000')
    expect(h?.h).toBe(0)
    expect(h?.s).toBe(100)
    expect(h?.l).toBe(50)
  })
})

describe('formatAs / allFormats', () => {
  it('emits all four models', () => {
    const f = allFormats('#1a56ff')
    expect(f.hex).toBe('#1a56ff')
    expect(f.rgb).toMatch(/^rgb\(/)
    expect(f.hsl).toMatch(/^hsl\(/)
    expect(f.oklch).toMatch(/^oklch\(/)
  })
  it('invalid → empty', () => {
    expect(formatAs('xxx', 'hex')).toBe('')
  })
})

describe('contrast + WCAG', () => {
  it('black on white = 21:1', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBe(21)
  })
  it('same color = 1:1', () => {
    expect(contrastRatio('#777777', '#777777')).toBe(1)
  })
  it('grade matrix passes for max contrast', () => {
    const g = wcagGrade('#000000', '#ffffff')
    expect(g.aaNormal).toBe(true)
    expect(g.aaaNormal).toBe(true)
    expect(g.uiAA).toBe(true)
  })
  it('grade fails for low contrast', () => {
    const g = wcagGrade('#777777', '#888888')
    expect(g.aaNormal).toBe(false)
    expect(g.aaaNormal).toBe(false)
  })
  it('luminance bounds', () => {
    expect(luminance('#000000')).toBe(0)
    expect(luminance('#ffffff')).toBe(1)
  })
  it('readableText picks white on dark, black on light', () => {
    expect(readableText('#000000')).toBe('#ffffff')
    expect(readableText('#ffffff')).toBe('#000000')
  })
})

describe('harmony', () => {
  it('complementary = 2, triadic = 3, tetradic = 4', () => {
    expect(harmony('#1a56ff', 'complementary')).toHaveLength(2)
    expect(harmony('#1a56ff', 'triadic')).toHaveLength(3)
    expect(harmony('#1a56ff', 'tetradic')).toHaveLength(4)
  })
  it('all outputs are valid hex', () => {
    for (const c of harmony('#1a56ff', 'analogous')) {
      expect(c).toMatch(/^#[0-9a-f]{6}$/)
    }
  })
  it('invalid base → []', () => {
    expect(harmony('not-a-color', 'triadic')).toEqual([])
  })
})

describe('ramp', () => {
  it('produces 2n+1 stops incl base', () => {
    expect(ramp('#1a56ff', 5)).toHaveLength(11)
  })
  it('center is the base color', () => {
    const r = ramp('#1a56ff', 3)
    expect(r[3]).toBe('#1a56ff')
  })
})

describe('gradient', () => {
  it('samples the requested count', () => {
    const s = gradientSamples(
      [
        { color: '#000000', pos: 0 },
        { color: '#ffffff', pos: 100 },
      ],
      5,
    )
    expect(s).toHaveLength(5)
    expect(s[0]).toBe('#000000')
    expect(s[4]).toBe('#ffffff')
  })
  it('needs 2+ valid stops', () => {
    expect(gradientSamples([{ color: '#000', pos: 0 }], 5)).toEqual([])
  })
  it('cssGradient string is well-formed', () => {
    const css = cssGradient(
      [
        { color: '#000000', pos: 0 },
        { color: '#ffffff', pos: 100 },
      ],
      90,
      'oklch',
    )
    expect(css).toContain('linear-gradient(90deg in oklch')
    expect(css).toContain('#000000 0%')
    expect(css).toContain('#ffffff 100%')
  })
})

describe('quantize', () => {
  it('extracts dominant colors from pixel bytes', () => {
    // 2 red + 2 blue pixels (RGBA)
    const px = new Uint8ClampedArray([
      255, 0, 0, 255, 255, 0, 0, 255, 0, 0, 255, 255, 0, 0, 255, 255,
    ])
    const out = quantize(px, 4)
    expect(out.length).toBeGreaterThanOrEqual(1)
    for (const c of out) expect(c).toMatch(/^#[0-9a-f]{6}$/)
  })
  it('skips transparent pixels', () => {
    const px = new Uint8ClampedArray([255, 0, 0, 0, 0, 255, 0, 255])
    const out = quantize(px, 4)
    expect(out).toEqual(['#00ff00'])
  })
})
