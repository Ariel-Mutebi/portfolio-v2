import type { LegoSceneConfig } from './types.ts';
import { threeColor } from '../../../lib/colors.ts';

export function getDefaultConfig(): Required<LegoSceneConfig> {
  return {
    backgroundColor: threeColor('--color-ebony-100'),
    gridColor: threeColor('--color-ebony-300'),
    gridCenterColor: threeColor('--color-ebony-400'),
    modelPath: '/assets/3031.mpd',
    modelScale: 1.2,
    cameraPosition: {
      x: 3,
      y: 2,
      z: 3
    }
  };
}
