import { PerspectiveCamera } from 'three';
import type { LegoSceneConfig } from './types.ts';

export function createCamera(
  container: HTMLElement,
  config: Required<LegoSceneConfig>
): PerspectiveCamera {
  const camera = new PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );

  const { x, y, z } = config.cameraPosition;

  camera.position.set(x, y, z);
  camera.lookAt(0, 0, 0);

  return camera;
}
