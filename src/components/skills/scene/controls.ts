import { PerspectiveCamera, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createControls(
  renderer: WebGLRenderer,
  camera: PerspectiveCamera
): OrbitControls {
  const controls = new OrbitControls(
    camera,
    renderer.domElement
  );

  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // Restrict vertical rotation
  controls.minPolarAngle = Math.PI / 6;
  controls.maxPolarAngle = Math.PI / 2.1;

  // Disable zoom
  controls.enableZoom = false;

  // Keep the camera focused on the model
  controls.target.set(0, 0, 0);

  controls.update();

  return controls;
}
