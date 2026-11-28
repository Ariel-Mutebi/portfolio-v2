import {
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  type WebGLRenderer
} from 'three';
import { threeColor } from '../../lib/colors.ts';

/** Builds the reflections: a grey room with long light panels */
export function createStudioEnvironment(renderer: WebGLRenderer) {
  const room = new Scene();
  room.background = threeColor('--color-ebony-500');

  const geometry = new PlaneGeometry(1, 1);
  const material = new MeshBasicMaterial({ side: DoubleSide });
  material.color.setScalar(4);

  function addPanel(x: number, y: number, z: number, width: number, height: number) {
    const panel = new Mesh(geometry, material);
    panel.position.set(x, y, z);
    panel.scale.set(width, height, 1);
    panel.lookAt(0, 0, 0);
    room.add(panel);
  }

  addPanel(0, 5, 0, 1.2, 8);
  addPanel(-5, 2, 0, 8, 0.6);
  addPanel(5, 2, 0, 8, 0.6);

  const pmrem = new PMREMGenerator(renderer);
  const target = pmrem.fromScene(room, 0.04);

  pmrem.dispose();
  geometry.dispose();
  material.dispose();

  return target;
}
