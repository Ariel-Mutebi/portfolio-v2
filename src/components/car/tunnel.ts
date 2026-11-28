import * as THREE from 'three';
import floorVertexShader from './shaders/floor.vert?raw';
import floorFragmentShader from './shaders/floor.frag?raw';

function createFloor(floorY: number) {
  const geometry = new THREE.PlaneGeometry(10, 10);
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: floorVertexShader,
    fragmentShader: floorFragmentShader,
  });

  const mesh = new THREE.Mesh(geometry, material);
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
  ].map(([x, y]) => new THREE.Vector3(x, y, 0));

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: 0x62686d,
    transparent: true,
    opacity: 0.45,
  });

  const lines = [-3, 3].map((z) => {
    const line = new THREE.LineLoop(geometry, material);
    line.position.set(0, floorY, z);
    return line;
  });

  return { lines, geometry, material };
}

/** Builds the visible parts of the tunnel */
export function createTunnel(floorY: number) {
  const floor = createFloor(floorY);
  const frames = createFrames(floorY);

  const group = new THREE.Group();
  group.add(floor.mesh, ...frames.lines);

  function dispose() {
    for (const part of [floor, frames]) {
      part.geometry.dispose();
      part.material.dispose();
    }
  }

  return { group, dispose };
}
