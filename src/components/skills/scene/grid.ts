import { Scene, GridHelper } from 'three';
import type { LegoSceneConfig } from './types.ts';

export function setupGroundGrid(
  scene: Scene,
  config: Required<LegoSceneConfig>
): GridHelper {
  const grid = new GridHelper(
    10,
    40,
    config.gridCenterColor,
    config.gridColor
  );

  const material = grid.material;

  material.transparent = true;
  material.opacity = 0.35;

  scene.add(grid);

  return grid;
}
