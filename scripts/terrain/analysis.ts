import { WIDTH, HEIGHT, FLAT_RADIUS, FLAT_TOLERANCE, SMOOTHING_RADIUS, SMOOTHING_PASSES } from './config.ts';
import { range, clamp, toLonLat } from './geo.ts';
import type { Frame, Extent } from './types.ts';
import type { LonLat } from '../../src/components/hero/scene/types.ts';

export const findExtent = (values: Float32Array): Extent => ({
  min: values.reduce((lowest, value) => Math.min(lowest, value), Infinity),
  max: values.reduce((highest, value) => Math.max(highest, value), -Infinity),
});

export const locateHighestPoint = (elevations: Float32Array, frame: Frame, extent: Extent): LonLat => {
  const index = elevations.indexOf(extent.max);
  return toLonLat(frame.left + (index % WIDTH), frame.top + Math.floor(index / WIDTH), 11);
};

const windowFilter = (
  values: Float32Array,
  radius: number,
  axis: 'x' | 'y',
  pick: (a: number, b: number) => number,
  initial: number,
) => {
  const offsets = range(-radius, radius);
  return Float32Array.from(values, (_, i) => {
    const col = i % WIDTH;
    const row = Math.floor(i / WIDTH);
    return offsets.reduce((best, offset) => {
      const c = axis === 'x' ? clamp(col + offset, 0, WIDTH - 1) : col;
      const r = axis === 'y' ? clamp(row + offset, 0, HEIGHT - 1) : row;
      return pick(best, values[r * WIDTH + c]);
    }, initial);
  });
};

const minFilter = (values: Float32Array, radius: number) =>
  windowFilter(windowFilter(values, radius, 'x', Math.min, Infinity), radius, 'y', Math.min, Infinity);

const maxFilter = (values: Float32Array, radius: number) =>
  windowFilter(windowFilter(values, radius, 'x', Math.max, -Infinity), radius, 'y', Math.max, -Infinity);

const boxBlur = (values: Float32Array, radius: number) => {
  const size = 2 * radius + 1;
  const add = (a: number, b: number) => a + b;
  const averaged = (axis: 'x' | 'y', input: Float32Array) =>
    windowFilter(input, radius, axis, add, 0).map((sum) => sum / size);
  return averaged('y', averaged('x', values));
};

export const detectWater = (elevations: Float32Array) => {
  const highest = maxFilter(elevations, FLAT_RADIUS);
  const lowest = minFilter(elevations, FLAT_RADIUS);
  const flat = Float32Array.from(elevations, (_, i) =>
    highest[i] - lowest[i] < FLAT_TOLERANCE ? 1 : 0,
  );
  return range(1, SMOOTHING_PASSES).reduce((soft) => boxBlur(soft, SMOOTHING_RADIUS), flat);
};

export const toWatermask = (water: Float32Array) =>
  Uint8Array.from(water, (value) => Math.round(value * 255));

export const waterShareOf = (water: Float32Array) =>
  water.filter((value) => value > 0.5).length / water.length;

export const quantize = (elevations: Float32Array, { min, max }: Extent) =>
  Uint16Array.from(elevations, (meters) => Math.round(((meters - min) / (max - min)) * 65535));
