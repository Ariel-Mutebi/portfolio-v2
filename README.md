# Rwenzori Terrain Hero

An interactive WebGL hero that morphs a photorealistic 3D terrain of the Rwenzori Mountains into a 2D topographic contour map as you scroll.

## How it works

### 1. Bake pipeline (`scripts/terrain.ts`)

Run `pnpm run bake:terrain` (or with `--force` to rebuild). The pipeline is split into focused modules under `scripts/terrain/`:

- **`config.ts`** — center point, zoom, output dimensions, sun direction, exaggeration.
- **`geo.ts`** — Web Mercator projection, distance helpers.
- **`tiles.ts`** — downloads AWS Terrarium DEM tiles, decodes RGB to meters, stitches them into a single `Float32Array` of elevations.
- **`analysis.ts`** — water detection (flatness test + box blur), min/max extent, quantization to 16-bit.
- **`bake.ts`** — generates and writes all output binaries:
  - `heightmap.bin` — 16-bit quantized elevation, converted to half-float in the browser.
  - `watermask.bin` — 8-bit soft water field (0 = land, 1 = water).
  - `normalmap.bin` — baked terrain normals (RGBA).
  - `shadowmap.bin` — baked sun shadows (single channel).
  - `noise.bin` — tileable FBM noise for terrain tint.
  - `terrain.json` — metadata (bounds, min/max elevation, meters-per-pixel).

### 2. Scene (`src/components/hero/scene.ts`)

- A `PlaneGeometry` (256×256 segments) is displaced by the heightmap in the vertex shader.
- A `PerspectiveCamera` dynamically fits a focus window (independent of the larger plane) so the terrain **always fills the screen** at any aspect ratio.
- `setProgress(p)` — `0.0` = angled 3D view, `1.0` = flat top-down map. It lerps the camera between the two and sets `uReal = 1.0 - p`.
- Renders are throttled to one per `requestAnimationFrame`.

### 3. Shader (`src/components/hero/shaders/terrain.frag`)

One fragment shader handles both states via the `uReal` uniform:

- **Real state** (`uReal > 0`) — samples the baked normal and shadow maps, applies elevation-based tinting (`heightTint`), hemisphere ambient, water fresnel, and a vignette.
- **Map state** (`uReal < 1`) — draws anti-aliased contour lines from a **mip-biased** heightmap lookup (smooth contours, no jitter), with minor (100 m) and index (500 m) lines, a soft hillshade, and coastline strokes.
- **Both** — the states are cross-faded with `mix(mapColor, realColor, uReal)`.

### 4. Scroll wiring (`src/components/hero/Hero.svelte`)

GSAP `ScrollTrigger` pins a sticky viewport over a `200vh` scroll track and drives `setProgress` from `self.progress`. Scrub is set to `1.5` for a smooth, cinematic catch-up when the user scrolls quickly.

## Tuning cheatsheet

| What | Where | Notes |
|---|---|---|
| Camera angle / zoom | `scene.ts` → `focusWidth`, `focusHeight` | Larger = more zoomed out |
| Terrain height | `fullscreen.vert` → `heightScale` | Should stay proportional to `planeWidth` |
| Contour intervals | `terrain.frag` → `contour(..., 100.0, ...)` and `contour(..., 500.0, ...)` | First arg is meters |
| Contour colors | `scene.ts` → `uFieldColor`, `uMinorColor`, `uIndexColor` | Driven by CSS variables |
| Sun direction | `config.ts` → `SUN_DIRECTION` and `terrain.frag` → `lightDir` | **Must match**, then re-bake |
| Exaggeration | `config.ts` → `EXAGGERATION` and `scene.ts` → `uExaggeration` | **Must match**, then re-bake |

## Performance notes

- `pixelRatio` is capped at `1` and `alpha: false` to avoid compositing overhead.
- All heavy work (normals, shadows, noise) is baked at build time — the shader only does ~5 texture lookups per pixel.
- Map contours use a mip-biased lookup instead of a 5-tap blur.
- Redraws are throttled via `requestAnimationFrame` and skipped when `progress` hasn't meaningfully changed.
