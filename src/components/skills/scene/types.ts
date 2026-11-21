import type { Color } from 'three';

export interface LegoSceneConfig {
  backgroundColor?: Color;
  gridColor?: Color;
  gridCenterColor?: Color;
  modelScale?: number;
  plateCount?: number;
  dropHeight?: number;
  cameraPosition?: {
    x: number;
    y: number;
    z: number;
  };
}

export interface LegoSceneInstance {
  setProgress: (progress: number) => void;
  destroy: () => void;
}
