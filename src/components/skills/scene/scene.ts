import { Scene } from 'three';
import type { LegoSceneConfig } from './types.ts';

export function createScene(
  config: Required<LegoSceneConfig>
): Scene {
  const scene = new Scene();

  scene.background = config.backgroundColor;

  return scene;
}
