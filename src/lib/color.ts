/**
 * color.ts — pure color logic. Framework-free, unit-tested.
 * Conversions built on culori; contrast/WCAG hand-rolled (native math).
 */
import {
  converter,
  formatHex,
  formatRgb,
  parse,
  wcagContrast,
  interpolate,
  samples,
} from 'culori'

export type Rgb = { r: number; g: number; b: number } // 0..255
export type Hsl = { h: number; s: number; l: number } // h 0..360, s/l 0..100

const toRgb = converter('rgb')
const toHsl = converter('hsl')
const toOklch = converter('oklch')

/** Parse ANY css color string → normalized hex, or null if invalid. */
export function normalizeHex(input: string): string | null {
  const c = parse(input.trim())
  if (!c) return null
  return formatHex(c)
}

/** Any color string → {r,g,b} 0..255, or null. */
export function toRgb255(input: string): Rgb | null {
  const c = parse(input.trim())
  if (!c) return null
  const r = toRgb(c)
  return {
    r: Math.round(clamp01(r.r) * 255),
    g: Math.round(clamp01(r.g) * 255),
    b: Math.round(clamp01(r.b) * 255),
  }
}

/** Any color → HSL (degrees / percent). null if invalid. */
export function toHsl360(input: string): Hsl | null {
  const c = parse(input.trim())
  if (!c) return null
  const h = toHsl(c)
  return {
    h: Math.round(h.h ?? 0),
    s: Math.round((h.s ?? 0) * 100),
    l: Math.round((h.l ?? 0) * 100),
  }
}

/** Format a color string in a target model. Returns '' if invalid. */
export function formatAs(
  input: string,
  model: 'hex' | 'rgb' | 'hsl' | 'oklch',
): string {
  const c = parse(input.trim())
  if (!c) return ''
  switch (model) {
    case 'hex':
      return formatHex(c)
    case 'rgb':
      return formatRgb(c)
    case 'hsl': {
      const h = toHsl(c)
      return `hsl(${round(h.h ?? 0)} ${pct(h.s)}% ${pct(h.l)}%)`
    }
    case 'oklch': {
      const o = toOklch(c)
      return `oklch(${round3(o.l ?? 0)} ${round3(o.c ?? 0)} ${round(o.h ?? 0)})`
    }
  }
}

/** All four formats for one color. Empty strings if invalid. */
export function allFormats(input: string) {
  return {
    hex: formatAs(input, 'hex'),
    rgb: formatAs(input, 'rgb'),
    hsl: formatAs(input, 'hsl'),
    oklch: formatAs(input, 'oklch'),
  }
}

/** WCAG contrast ratio between two colors (1..21). 0 if either invalid. */
export function contrastRatio(a: string, b: string): number {
  const ca = parse(a.trim())
  const cb = parse(b.trim())
  if (!ca || !cb) return 0
  return round2(wcagContrast(ca, cb))
}

export type WcagGrade = {
  ratio: number
  aaNormal: boolean
  aaLarge: boolean
  aaaNormal: boolean
  aaaLarge: boolean
  uiAA: boolean // 3:1 for UI components / graphics
}

/** Full WCAG 2.1 pass matrix for a fg/bg pair. */
export function wcagGrade(fg: string, bg: string): WcagGrade {
  const ratio = contrastRatio(fg, bg)
  return {
    ratio,
    aaNormal: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaaNormal: ratio >= 7,
    aaaLarge: ratio >= 4.5,
    uiAA: ratio >= 3,
  }
}

/** Relative luminance 0..1 (WCAG). null if invalid. */
export function luminance(input: string): number | null {
  const rgb = toRgb255(input)
  if (!rgb) return null
  const f = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return round3(0.2126 * f(rgb.r) + 0.7152 * f(rgb.g) + 0.0722 * f(rgb.b))
}

/** Pick black or white text for best contrast on a background. */
export function readableText(bg: string): '#000000' | '#ffffff' {
  return contrastRatio('#000000', bg) >= contrastRatio('#ffffff', bg)
    ? '#000000'
    : '#ffffff'
}

// ---- harmony palettes (color-theory) ----

export type HarmonyKind =
  | 'complementary'
  | 'analogous'
  | 'triadic'
  | 'tetradic'
  | 'split-complementary'
  | 'monochromatic'
  | 'shades'

/** Generate a harmony palette (list of hex) from a base color. */
export function harmony(base: string, kind: HarmonyKind): string[] {
  const c = parse(base.trim())
  if (!c) return []
  const h = toHsl(c)
  const H = h.h ?? 0
  const S = h.s ?? 0
  const L = h.l ?? 0.5
  const at = (dh: number, s = S, l = L) =>
    formatHex(toRgb({ mode: 'hsl', h: mod360(H + dh), s: clamp01(s), l: clamp01(l) }))!

  switch (kind) {
    case 'complementary':
      return [at(0), at(180)]
    case 'analogous':
      return [at(-30), at(0), at(30)]
    case 'triadic':
      return [at(0), at(120), at(240)]
    case 'tetradic':
      return [at(0), at(90), at(180), at(270)]
    case 'split-complementary':
      return [at(0), at(150), at(210)]
    case 'monochromatic':
      return [0.85, 0.68, 0.5, 0.35, 0.2].map((l) => at(0, S, l))
    case 'shades':
      return [0.9, 0.75, 0.6, 0.45, 0.3, 0.15].map((l) => at(0, S, l))
  }
}

/** Tints (toward white) + shades (toward black) ramp, count each side. */
export function ramp(base: string, count = 5): string[] {
  const c = parse(base.trim())
  if (!c) return []
  const white = parse('#ffffff')!
  const black = parse('#000000')!
  const toW = interpolate([c, white])
  const toB = interpolate([black, c])
  const out: string[] = []
  for (let i = count; i >= 1; i--) out.push(formatHex(toB(i / (count + 1)))!)
  out.push(formatHex(c)!)
  for (let i = 1; i <= count; i++) out.push(formatHex(toW(i / (count + 1)))!)
  return out
}

// ---- gradient ----

export type GradientStop = { color: string; pos: number } // pos 0..100

/** N smooth samples across stops in a given interpolation space. */
export function gradientSamples(
  stops: GradientStop[],
  steps: number,
  space: 'oklch' | 'oklab' | 'rgb' | 'hsl' = 'oklch',
): string[] {
  const valid = stops.filter((s) => parse(s.color))
  if (valid.length < 2) return []
  const sorted = [...valid].sort((a, b) => a.pos - b.pos)
  const it = interpolate(
    sorted.map((s) => s.color),
    space,
  )
  return samples(steps).map((t) => formatHex(it(t)) ?? '#000000')
}

/** CSS gradient string for a set of stops. */
export function cssGradient(
  stops: GradientStop[],
  angle: number,
  space: 'oklch' | 'oklab' | 'srgb' | 'hsl' = 'oklch',
): string {
  const sorted = [...stops].sort((a, b) => a.pos - b.pos)
  const list = sorted.map((s) => `${s.color} ${round(s.pos)}%`).join(', ')
  const method = space === 'srgb' ? '' : ` in ${space}`
  return `linear-gradient(${round(angle)}deg${method}, ${list})`
}

// ---- extract (pure quantizer over pixel array) ----

/**
 * Median-cut-ish palette from RGBA pixel bytes. Returns up to `k` hex colors,
 * most-frequent first. Pure — feed it ImageData.data.
 */
export function quantize(pixels: Uint8ClampedArray, k = 6): string[] {
  const buckets = new Map<string, { r: number; g: number; b: number; n: number }>()
  const step = 4 * Math.max(1, Math.floor(pixels.length / 4 / 20000)) // cap sample
  for (let i = 0; i < pixels.length; i += step) {
    const a = pixels[i + 3]
    if (a < 125) continue
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]
    // 4-bit-per-channel key to group near colors
    const key = `${r >> 4}-${g >> 4}-${b >> 4}`
    const bkt = buckets.get(key)
    if (bkt) {
      bkt.r += r
      bkt.g += g
      bkt.b += b
      bkt.n++
    } else {
      buckets.set(key, { r, g, b, n: 1 })
    }
  }
  return [...buckets.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, k)
    .map(
      (v) =>
        formatHex({
          mode: 'rgb',
          r: v.r / v.n / 255,
          g: v.g / v.n / 255,
          b: v.b / v.n / 255,
        })!,
    )
}

// ---- helpers ----
function clamp01(n: number) {
  return Math.min(1, Math.max(0, n))
}
function mod360(n: number) {
  return ((n % 360) + 360) % 360
}
function round(n: number) {
  return Math.round(n)
}
function round2(n: number) {
  return Math.round(n * 100) / 100
}
function round3(n: number) {
  return Math.round(n * 1000) / 1000
}
function pct(n: number | undefined) {
  return Math.round((n ?? 0) * 100)
}
