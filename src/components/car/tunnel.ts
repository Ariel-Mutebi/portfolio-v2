import {
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  LineBasicMaterial,
  LineLoop,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  Vector3,
} from 'three';
import floorVertexShader from './shaders/floor.vert?raw';
import floorFragmentShader from './shaders/floor.frag?raw';
import { threeColor } from '../../lib/colors.ts';

/** Change the floor's look here. Strengths range from 0 to 1 */
const getFloorAppearance = () => ({
  gridColor: threeColor('--color-ebony-400'),
  shadowColor: threeColor('--color-ebony-950'),
  tintStrength: 0.08,
  lineStrength: 0.2,
  shadowStrength: 1.0,
});

function createFloor(floorY: number) {
  const appearance = getFloorAppearance();
  const geometry = new PlaneGeometry(10, 10);
  const material = new ShaderMaterial({
    uniforms: {
      uGridColor: { value: new Color(appearance.gridColor) },
      uShadowColor: { value: new Color(appearance.shadowColor) },
      uTintStrength: { value: appearance.tintStrength },
      uLineStrength: { value: appearance.lineStrength },
      uShadowStrength: { value: appearance.shadowStrength },
    },
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    vertexShader: floorVertexShader,
    fragmentShader: floorFragmentShader,
  });

  const mesh = new Mesh(geometry, material);
  /** Planes start upright, so lay this one flat */
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = floorY - 0.01;

  return { mesh, geometry, material };
}

function createFrames(floorY: number) {
  /** An eight-sided outline, 3.2 wide and 2 high */
  const points = [
    [-1.2, 0], [1.2, 0], [1.6, 0.4], [1.6, 1.6],
    [1.2, 2], [-1.2, 2], [-1.6, 1.6], [-1.6, 0.4],
  ].map(([x, y]) => new Vector3(x, y, 0));

  const geometry = new BufferGeometry().setFromPoints(points);
  const material = new LineBasicMaterial({
    color: threeColor('--color-ebony-800'),
    transparent: true,
    opacity: 0.45,
  });

  const lines = [-3, 3].map((z) => {
    const line = new LineLoop(geometry, material);
    line.position.set(0, floorY, z);
    return line;
  });

  return { lines, geometry, material };
}

/** Builds the visible parts of the tunnel */
export function createTunnel(floorY: number) {
  const floor = createFloor(floorY);
  const frames = createFrames(floorY);

  const group = new Group();
  group.add(floor.mesh, ...frames.lines);

  function dispose() {
    for (const part of [floor, frames]) {
      part.geometry.dispose();
      part.material.dispose();
    }
  }

  return { group, dispose };
}
