import type {
  Object3D,
  Material,
  BufferGeometry
} from 'three';

export function disposeObject(object: Object3D): void {
  object.traverse((child) => {
    const mesh = child as Object3D & {
      geometry?: BufferGeometry;
      material?: Material | Material[];
    };

    mesh.geometry?.dispose();

    if (mesh.material) {
      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];

      for (const material of materials) {
        material.dispose();
      }
    }
  });
}
