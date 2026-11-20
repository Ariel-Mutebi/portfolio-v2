import { Box3, Vector3 } from 'three';
import { LDrawLoader } from 'three/addons/loaders/LDrawLoader.js';
import { LDrawConditionalLineMaterial } from 'three/addons/materials/LDrawConditionalLineMaterial.js';

import type { Object3D } from 'three';
import type { LegoSceneConfig } from './types.ts';

function createModelLoader(): LDrawLoader {
  const loader = new LDrawLoader();

  loader.setConditionalLineMaterial(
    LDrawConditionalLineMaterial
  );

  return loader;
}

function centerAndScaleModel(
  model: Object3D,
  targetScale: number
): void {
  const box = new Box3().setFromObject(model);

  const size = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());

  const scale = targetScale / Math.max(
    size.x,
    size.y,
    size.z
  );

  model.scale.setScalar(scale);

  model.position.set(
    -center.x * scale,
    -center.y * scale,
    -center.z * scale
  );
}

export async function loadModel(config: Required<LegoSceneConfig>): Promise<Object3D> {
  const loader = createModelLoader();

  const model = await loader.loadAsync(config.modelPath);

  centerAndScaleModel(model, config.modelScale);

  return model;
}
