# ASCII Generator

An in-browser generator of animated ASCII patterns. Pick an effect, a character set and a palette, adjust the grid, and export the result as text, image, SVG or video.

## Features

- **16 animated patterns**, from waves and spirals to patterns inspired by Almir Mavignier and the golden ratio.
- **10 character sets** (blocks, dots, braille, geometric...) plus a custom set.
- **Text Mode:** draws text inside the art. Accented letters are supported (Ç, Ã, É...). Characters without a drawing are listed in the interface.
- **Mouse or touch interaction:** hold the mouse button (or drag your finger) over the art to distort it.
- **Frame stepping:** with the animation paused, move one frame forward or back.
- **Palettes:** nine background and text pairs, with checked contrast. Custom colors are accepted too.
- **Randomize:** picks a pattern, character set, palette and slider values.
- **Saved presets:** keep configurations under a name. They stay in this browser.
- **Share:** the configuration lives in the URL. The "Copy link" button copies the current address.
- **Export:** `.txt`, `.svg` (vector, with colors), `.png` (2x), and a 6-second video (WebM or MP4, depending on the browser).
- **Responsive:** on phones, the art is on top and the controls below. The font shrinks on its own when the grid doesn't fit the panel.

## Getting started

Requirements: Node.js 22.13 or newer (required by ESLint 10 and Vitest 5).

```bash
npm install
npm run dev       # development server
```

Other commands:

| Command | What it does |
| --- | --- |
| `npm run build` | Type-checks and builds the production version into `dist/` |
| `npm run preview` | Serves the build output |
| `npm test` | Runs the unit tests (Vitest) |
| `npm run lint` | Runs ESLint |

## Sharing a configuration

URL parameters only appear when the value differs from the default. A link with no changes stays clean.

| Parameter | Values | Setting |
| --- | --- | --- |
| `pattern` | one of the 16 pattern names, e.g. `golden_petals` | pattern |
| `speed` | 1 to 20 | speed |
| `density` | 0.1 to 2 (step 0.1) | density |
| `scale` | 0.05 to 1 (step 0.05) | scale |
| `width` / `height` | 20 to 120 / 10 to 60 | grid size |
| `font` | 8 to 24 | font size (may shrink on its own to fit) |
| `chars` | `blocks`, `dots`, `circles`, `squares`, `lines`, `gradients`, `minimal`, `ascii`, `braille`, `geometric` or `custom` | character set |
| `custom` | up to 200 characters (only with `chars=custom`) | custom characters |
| `bg` / `fg` | hex color without `#`, e.g. `0d0221` | background and text |
| `animate` | `1` or `0` | animation on |
| `mouse` | `1` or `0` | mouse interaction |
| `textmode` | `1` or `0` | Text Mode |
| `text` | up to 40 characters (converted to uppercase) | Text Mode text |
| `textsize` | 4 to 15 | text size |
| `thickness` | 1 to 8 | stroke thickness |

Invalid values are ignored, and numbers outside the range are clamped to the nearest limit.

Example: `http://localhost:5173/?pattern=golden_petals&speed=7&bg=0d0221&fg=ff2e88`

## Saved presets

Presets are stored in the browser's `localStorage` under the key `gerador-ascii:presets`. They don't sync between devices. To move a preset elsewhere, share the link.

## Project structure

```
src/
├── App.tsx              # Main screen: state, effects and interface
├── App.css
├── main.tsx             # Entry point
├── patterns.ts          # The 16 patterns (value functions per cell)
├── renderAscii.ts       # Turns each cell's value into a character
├── pointer.ts           # Maps the mouse or touch position to grid cells
├── presets.ts           # Character sets
├── palettes.ts          # Background and text palettes
├── settings.ts          # Full configuration, slider limits and URL encoding
├── randomize.ts         # Randomize
├── savedPresets.ts      # Presets saved in the browser
├── textMask.ts          # Text Mode mask (vector font, accents)
├── strokeFont.ts        # Letter and digit drawings
├── fit.ts               # Fitting the font to the panel
├── animation.ts         # Animation clock and frame stepping
├── exporter.ts          # SVG, PNG, video and download
└── components/
    ├── Slider.tsx
    └── SavedPresetsPanel.tsx
```

Logic modules don't depend on React, and those with testable behavior have a `.test.ts` next to them. `presets.ts` and `strokeFont.ts` are data only.

## Stack

React 18, TypeScript, Vite 8 (with the React plugin 6), Vitest 5 and ESLint 10.

## Limitations

- **Video:** requires `MediaRecorder` and `canvas.captureStream`. Browsers without them disable the button. Recording takes the full 6 seconds.
- **Copy:** the clipboard requires a secure context (HTTPS or `localhost`). Without one, the app shows a message, and you can use Export instead.
- **Accents in Text Mode:** acute, grave, circumflex, tilde, diaeresis and cedilla are supported. Other characters appear in the "skipped" list.
- **Font:** the art uses `Courier New` (or a monospace fallback). Other fonts can change the proportions of Text Mode.
