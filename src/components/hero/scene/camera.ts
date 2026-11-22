import { MathUtils, PerspectiveCamera } from 'three';

const FOV = 45;
const FOCUS_WIDTH = 4;

export function createCameraRig(canvas: HTMLCanvasElement, terrainAspect: number) {
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 200);
  const focusHeight = FOCUS_WIDTH * terrainAspect;
  const tanHalfFov = Math.tan((FOV * Math.PI) / 360);

  /** progress 0 = tilted 3D view, 1 = straight-down map view */
  const update = (progress: number) => {
    const aspect = canvas.clientWidth / canvas.clientHeight;
    const angle = MathUtils.lerp(MathUtils.degToRad(35), 0, progress);
    const projectedHeight = focusHeight * Math.cos(angle);

    const distH = (FOCUS_WIDTH * 0.5) / (tanHalfFov * aspect);
    const distV = (projectedHeight * 0.5) / tanHalfFov;
    const dist = Math.min(distH, distV);

    camera.position.set(0, -dist * Math.sin(angle), dist * Math.cos(angle));
    camera.lookAt(0, 0, 0);
  };

  const resize = () => {
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  };

  return { camera, update, resize };
}
