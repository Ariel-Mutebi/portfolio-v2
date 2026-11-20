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

GSAP `ScrollTrigger` pins a sticky viewport over a `200vh` scroll track and drives `setProgress` from `self.progress`. Scrub is set to `2.0` for a smooth, cinematic catch-up when the user scrolls quickly.

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
- Redraws are throttled via `requestAnimationFrame`.

# LEGO Brick Asset Pipeline

A lightweight build-time pipeline that resolves, downloads, and packs individual LDraw LEGO parts into self-contained MPD files for rendering with Three.js.

Instead of shipping the entire 140 MB LDraw library or loading individual part dependencies at runtime, each LEGO brick is packaged into a single asset.

## How it works

### 1. Build pipeline (`scripts/ldraw/index.ts`)

Run `pnpm run pack:brick` to generate a packed LEGO model.

The pipeline is split into focused modules under `scripts/ldraw/`:

- **`config.ts`** — brick filename, LDraw mirror, temporary directory, output directory, and pinned Three.js release (`r187`).
- **`client.ts`** — downloads individual LDraw files from the LDraw mirror, resolves file locations (`parts/`, `p/`, `models/`), and preserves special filenames such as `LDConfig.ldr`.
- **`resolver.ts`** — parses LDraw type-1 references, recursively discovers dependencies, downloads required subparts and primitives, and prevents duplicate downloads and circular references.
- **`packer.ts`** — downloads and executes Three.js's official `packLDrawModel.mjs` utility, then copies the resulting MPD into the public assets directory.
- **`pipeline.ts`** — orchestrates the build: downloads colour definitions, retrieves the root brick, resolves dependencies, and invokes the packer.
- **`index.ts`** — entry point that initializes configuration, runs the pipeline, and cleans up the temporary directory.

### 2. Dependency resolution

The pipeline starts with a single LDraw part (e.g. `3031.dat`) and recursively resolves its dependencies.

For example:

```text
3031.dat
├── stud.dat
├── stud4.dat
└── box5.dat
```

Dependencies are discovered by parsing LDraw type-1 lines, which reference other parts or primitives.

- Files are downloaded only when needed.
- Already visited dependencies are skipped.
- Independent dependencies are downloaded concurrently.
- `LDConfig.ldr` is downloaded separately for LDraw colour definitions.

No complete LDraw library installation is required.

### 3. Packing (`packer.ts`)

Once all dependencies are available locally, the pipeline delegates packaging to Three.js's official `packLDrawModel.mjs` utility.

The packer combines the root model and its dependencies into a single MPD file.

The generated asset is copied to:

```text
public/assets/3031.mpd
```

The Three.js packing utility is pinned to release `r187` to match the project's installed Three.js version.

### 4. Scene integration

The resulting MPD is loaded directly using Three.js's `LDrawLoader`:

```ts
const loader = new LDrawLoader();

loader.setConditionalLineMaterial(
  LDrawConditionalLineMaterial
);

const brick = await loader.loadAsync(
  '/assets/3031.mpd'
);

scene.add(brick);
```

Because the model is self-contained, the browser doesn't need to fetch individual LDraw dependencies.

The usual Three.js scene setup handles camera positioning, lighting, scaling, and rendering.

## Adding another brick

To generate a different LEGO part, change the brick filename passed to `createConfig()` in `scripts/ldraw/index.ts`:

```ts
const config = await createConfig('3001.dat');
```

Then run:

```bash
pnpm run pack:brick
```

The resulting model will be available at:

```text
public/assets/3001.mpd
```

Each brick is packaged independently, so only the dependencies required by that particular model are downloaded.

## Performance notes

- No full LDraw library is shipped with the application.
- Dependency resolution and model packing happen at build time, not in the browser.
- Each brick is delivered as a single self-contained MPD asset.
- No runtime requests for individual `.dat` dependencies.
- Temporary downloaded files are removed after packing.
- The Three.js packer is pinned to `r187` for version consistency.
