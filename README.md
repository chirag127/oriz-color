# oriz-color

Color studio — **[color.oriz.in](https://color.oriz.in)**

Pick, convert, harmonize, gradient, contrast-check, and extract palettes from images. All in the browser.

**100% client-side. No upload, no signup, no server.** Images never leave your device — extraction runs on a local `<canvas>`. AI palette suggestions are optional polish; the core tools work with AI fully offline.

## Features

- **Pick + Convert** — native color picker; live conversion across hex / rgb / hsl / oklch, copy any format.
- **Palettes** — complementary, analogous, triadic, tetradic, split-complementary, monochromatic, shades + a tint/shade ramp. Optional AI "describe a brand → palette".
- **Gradient** — multi-stop, angle control, oklch / oklab / hsl / srgb interpolation, CSS export, sampled stops.
- **Contrast** — WCAG 2.1 ratio with AA/AAA (normal + large) and UI-3:1 pass matrix, live preview, swap.
- **Extract** — drag-drop or pick an image, quantize its dominant colors (3–12), copy any.

## Stack

Astro (static) + React 19 islands + Tailwind v4. Color math via [`culori`](https://culorijs.org). Shared atomic `@chirag127/oz-*` packages for chrome, tokens, AI (g4f), and file helpers. Heavy libs are lazy-imported only when a feature is used.

## Develop

```bash
npm install --legacy-peer-deps
npm run dev       # local
npm run test      # vitest — pure color logic
npm run build     # static dist/
npm run deploy    # cloudflare pages
```

## License

MIT © 2026 Chirag Singhal
