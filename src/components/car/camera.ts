import { PerspectiveCamera } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/** Creates a camera that can be dragged around the origin */
export function createCameraRig(canvas: HTMLCanvasElement, onChange: () => void) {
  const camera = new PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(4, 2, 5);

  const controls = new OrbitControls(camera, canvas);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.minPolarAngle = Math.PI * 0.25;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.update();
  controls.addEventListener('change', onChange);

  /** Lets vertical swipes scroll the page. Must come after OrbitControls */
  canvas.style.touchAction = 'pan-y';

  function resize(width: number, height: number) {
    camera.aspect = width / height;
    /** Zooms out on narrow screens so the car fits */
    camera.zoom = Math.min(1, camera.aspect / 1.4);
    camera.updateProjectionMatrix();
  }

  return { camera, resize, dispose: () => controls.dispose() };
}
