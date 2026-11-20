import type { Color } from 'three';

export interface LegoSceneConfig {
  backgroundColor?: Color;
  gridColor?: Color;
  gridCenterColor?: Color;
  modelPath?: string;
  modelScale?: number;
  cameraPosition?: {
    x: number;
    y: number;
    z: number;
  };
}

export interface LegoSceneInstance {
  destroy: () => void;
}
