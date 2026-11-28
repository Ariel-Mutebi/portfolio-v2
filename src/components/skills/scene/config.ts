import type { LegoSceneConfig } from './types.ts';
import { threeColor } from '../../../lib/colors.ts';

export function getDefaultConfig(): Required<LegoSceneConfig> {
  return {
    backgroundColor: threeColor('--color-ebony-100'),
    gridColor: threeColor('--color-ebony-300'),
    gridCenterColor: threeColor('--color-ebony-400'),
    modelScale: 1.2,
    plateCount: 6,
    dropHeight: 1.5,
    cameraPosition: {
      x: 3,
      y: 2,
      z: 3
    },
    viewOffsetX: 0.2
  };
}
