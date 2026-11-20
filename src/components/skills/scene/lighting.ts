import {
  Scene,
  HemisphereLight,
  DirectionalLight
} from 'three';

export function setupLighting(scene: Scene): void {
  const ambientLight = new HemisphereLight(
    0xffffff,
    0x888888,
    2
  );

  scene.add(ambientLight);

  const directionalLight = new DirectionalLight(
    0xffffff,
    3
  );

  directionalLight.position.set(4, 6, 4);

  scene.add(directionalLight);
}
