# oriz Color

- **Live app:** https://color.oriz.in
- **About / info:** https://chirag127.github.io/oriz-color/
- **LLM index:** https://color.oriz.in/llms.txt (full text: `/llms-full.txt`)

Color studio — pick, convert, harmonize, gradient, check contrast, and lift a palette straight out of any image.

**100% client-side. No upload, no signup, no server, free.** Images never leave your device — extraction runs on a local `<canvas>`. AI palette suggestions are optional; the core tools work with AI off.

## Features

- **Pick + Convert** — native color picker; live conversion across hex / rgb / hsl / oklch, copy any format.
- **Palettes** — complementary, analogous, triadic, tetradic, split-complementary, monochromatic, shades + a tint/shade ramp. Optional AI "describe a brand → palette".
- **Gradient** — multi-stop, angle control, oklch / oklab / hsl / srgb interpolation, CSS export, sampled stops.
- **Contrast** — WCAG 2.1 ratio with AA/AAA (normal + large) and UI 3:1 pass matrix, live preview, swap.
- **Extract** — drag-drop or pick an image, quantize its dominant colors (3–12), copy any.

## Tech

Astro (static) + React 19 islands + Tailwind v4. Color math via [`culori`](https://culorijs.org). Shared atomic `@chirag127/oz-*` packages for chrome, tokens, AI (g4f, keyless in-browser), and file helpers. PWA-installable; core tools work offline. Live app on Cloudflare Pages; this repo also publishes a separate info page to GitHub Pages.

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
