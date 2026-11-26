import { oglColor } from '../../lib/colors.ts';
import type { DitherConfig } from './types.ts';

export const measure = (node: HTMLElement, dpr: number, cell: number) => ({
  width: Math.max(1, Math.round(node.clientWidth * dpr)),
  height: Math.max(1, Math.round(node.clientHeight * dpr)),
  cell: Math.max(1, Math.round(cell * dpr)),
  dpr,
});

export const createUniforms = ({ base, ink, cell }: DitherConfig) => ({
  uResolution: { value: [1, 1] },
  uCell: { value: cell },
  uDpr: { value: 1 },
  uTime: { value: 0 },
  uBase: { value: oglColor(base) },
  uInk: { value: oglColor(ink) },
});
