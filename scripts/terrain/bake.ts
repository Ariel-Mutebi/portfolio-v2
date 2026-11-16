import { mkdir, writeFile } from 'node:fs/promises';
import {
  WIDTH,
  HEIGHT,
  CENTER,
  ZOOM,
  SUN_DIRECTION,
  HEIGHTMAP_PATH,
  WATERMASK_PATH,
  NORMALMAP_PATH,
  SHADOWMAP_PATH,
  NOISE_TEXTURE_PATH,
  META_PATH,
} from './config.ts';
import { metersPerPixelAt, toLonLat, clamp } from './geo.ts';
import type { Frame, Extent } from './types.ts';
import type { TerrainMetadata } from '../../src/components/hero/types.ts';

const hash = (x: number, y: number) => {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
};

const valueNoise = (x: number, y: number) => {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const n00 = hash(ix, iy), n10 = hash(ix + 1, iy);
  const n01 = hash(ix, iy + 1), n11 = hash(ix + 1, iy + 1);
  return (n00 * (1 - ux) + n10 * ux) * (1 - uy) + (n01 * (1 - ux) + n11 * ux) * uy;
};

const fbm = (x: number, y: number, octaves: number) => {
  let value = 0, amp = 0.5;
  for (let i = 0; i < octaves; i++) {
    value += amp * valueNoise(x, y);
    x *= 2; y *= 2; amp *= 0.5;
  }
  return value;
};

/** Bakes a tileable noise texture. Stored in the blue channel. */
export const computeNoiseTexture = (size: number = 1024) => {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const fx = x / size, fy = y / size;
      data[i + 0] = 0;
      data[i + 1] = 0;
      data[i + 2] = Math.round(fbm(fx * 40, fy * 40, 2) * 255);
      data[i + 3] = 255;
    }
  }
  return data;
};

export const computeNormalMap = (elevations: Float32Array) => {
  const normals = new Uint8Array(WIDTH * HEIGHT * 4);
  const mpp = metersPerPixelAt(CENTER.lat, ZOOM);
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const i = y * WIDTH + x;
      const east = elevations[y * WIDTH + Math.min(x + 2, WIDTH - 1)];
      const west = elevations[y * WIDTH + Math.max(x - 2, 0)];
      const north = elevations[Math.max(y - 2, 0) * WIDTH + x];
      const south = elevations[Math.min(y + 2, HEIGHT - 1) * WIDTH + x];
      const run = 4 * mpp;
      const nx = -(east - west) / run;
      const ny = -(north - south) / run;
      const nz = 1.0;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      normals[i * 4 + 0] = Math.round(((nx / len) * 0.5 + 0.5) * 255);
      normals[i * 4 + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255);
      normals[i * 4 + 2] = Math.round(((nz / len) * 0.5 + 0.5) * 255);
      normals[i * 4 + 3] = 255;
    }
  }
  return normals;
};

export const computeShadowMap = (elevations: Float32Array, exaggeration: number) => {
  const shadows = new Uint8Array(WIDTH * HEIGHT);
  const { x: lx, y: ly, z: lz } = SUN_DIRECTION;
  const len = Math.sqrt(lx * lx + ly * ly + lz * lz);
  const normX = lx / len, normY = ly / len, normZ = lz / len;

  // Sun ray direction in pixel space (y increases south)
  const stepX = normX;
  const stepY = -normY;
  const stepLen = Math.sqrt(stepX * stepX + stepY * stepY);
  const sdx = stepX / stepLen;
  const sdy = stepY / stepLen;

  const stepPx = 8.0;
  const stepMeters = stepPx * metersPerPixelAt(CENTER.lat, ZOOM);
  const tanSun = normZ / Math.sqrt(normX * normX + normY * normY);

  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const startElevation = elevations[y * WIDTH + x];
      let shadow = 1.0;
      for (let i = 1; i <= 16; i++) {
        const sx = clamp(Math.round(x + sdx * stepPx * i), 0, WIDTH - 1);
        const sy = clamp(Math.round(y + sdy * stepPx * i), 0, HEIGHT - 1);
        const ground = (elevations[sy * WIDTH + sx] - startElevation) * exaggeration;
        const ray = i * stepMeters * tanSun;
        const s = Math.max(0, Math.min(1, (ray - ground + 40) / 80));
        shadow = Math.min(shadow, s);
      }
      shadows[y * WIDTH + x] = Math.round(shadow * 255);
    }
  }
  return shadows;
};

export const buildMetadata = (frame: Frame, { min, max }: Extent): TerrainMetadata => {
  const northWest = toLonLat(frame.left, frame.top, ZOOM);
  const southEast = toLonLat(frame.left + WIDTH, frame.top + HEIGHT, ZOOM);
  return {
    width: WIDTH,
    height: HEIGHT,
    minElevation: min,
    maxElevation: max,
    metersPerPixel: metersPerPixelAt(CENTER.lat, ZOOM),
    zoom: ZOOM,
    center: CENTER,
    bounds: {
      west: northWest.lon,
      east: southEast.lon,
      north: northWest.lat,
      south: southEast.lat,
    },
  };
};

export const writeOutputs = async (
  quantized: Uint16Array,
  watermask: Uint8Array,
  normalmap: Uint8Array,
  shadowmap: Uint8Array,
  noisemap: Uint8Array,
  metadata: TerrainMetadata,
) => {
  await mkdir('src/assets/terrain', { recursive: true });
  await mkdir('src/data', { recursive: true });
  await writeFile(HEIGHTMAP_PATH, Buffer.from(quantized.buffer));
  await writeFile(WATERMASK_PATH, watermask);
  await writeFile(NORMALMAP_PATH, normalmap);
  await writeFile(SHADOWMAP_PATH, shadowmap);
  await writeFile(NOISE_TEXTURE_PATH, noisemap);
  await writeFile(META_PATH, JSON.stringify(metadata, null, 2));
};
