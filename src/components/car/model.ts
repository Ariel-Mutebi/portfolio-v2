import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

/** Scales the model to 4 units long and centres it on the origin */
function normaliseModel(model: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const scale = 4 / Math.max(size.x, size.y, size.z);

  model.scale.multiplyScalar(scale);
  model.position.sub(center).multiplyScalar(scale);
}

/** Turns plain, opaque surfaces silver-grey */
function paintModel(model: THREE.Object3D) {
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;

    for (const material of [object.material].flat()) {
      if (!(material instanceof THREE.MeshStandardMaterial)) continue;
      if (material.map || material.transparent) continue;

      material.color.set(0xbfc3c6);
      material.metalness = 0.25;
      material.roughness = 0.4;
    }
  });
}

/** Loads the car, ready to be added to the scene */
export async function loadCarModel(url: string) {
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);

  const { scene: model } = await loader.loadAsync(url);
  normaliseModel(model);
  paintModel(model);

  return model;
}

/** Frees the memory used by a model */
export function disposeModel(model: THREE.Object3D) {
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();

    for (const material of [object.material].flat()) {
      for (const value of Object.values(material)) {
        if (!(value instanceof THREE.Texture)) continue;
        value.dispose();
        if (value.source.data instanceof ImageBitmap) value.source.data.close();
      }
      material.dispose();
    }
  });
}
