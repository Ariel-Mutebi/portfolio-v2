import { TILE } from './config.ts';
import type { LonLat } from '../../src/components/hero/types.ts';

export const range = (start: number, end: number): number[] =>
  Array.from({ length: end - start + 1 }, (_, i) => start + i);

export const clamp = (value: number, low: number, high: number) =>
  Math.min(Math.max(value, low), high);

export const toWorldPixel = (lon: number, lat: number, zoom: number) => {
  const worldSize = TILE * 2 ** zoom;
  const sin = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((lon + 180) / 360) * worldSize,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * worldSize,
  };
};

export const toLonLat = (x: number, y: number, zoom: number): LonLat => {
  const worldSize = TILE * 2 ** zoom;
  const mercatorY = Math.PI - (2 * Math.PI * y) / worldSize;
  return {
    lon: (x / worldSize) * 360 - 180,
    lat: (Math.atan(Math.sinh(mercatorY)) * 180) / Math.PI,
  };
};

export const metersPerPixelAt = (lat: number, zoom: number) =>
  (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;
